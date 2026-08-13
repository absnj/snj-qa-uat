// tests/setup/global.setup.ts
import { chromium, type Browser, type FullConfig, type Page } from '@playwright/test';
import { loadTestEnv } from './env';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminHomePage } from '../pages/admin/AdminHomePage';
import { HomePage } from '../pages/home/HomePage';
import { ALL_ROLES, ALL_CRM_ROLES, getCredentials, type Role } from '../specs/helpers/roles';
import fs from 'fs/promises';

loadTestEnv();

const ROLES: Role[] = [...ALL_ROLES, ...ALL_CRM_ROLES];

/**
 * Sign-in fails intermittently on GitHub runners and effectively never locally.
 *
 * Measured in run 31670260412: ~13 sign-in attempts, ~7 of them failed — close
 * to a coin flip, hitting every role equally. A failed attempt lands back on
 * `/login` with no error toast, so the app never reports rejected credentials.
 * The same secrets also produce fully green runs, which rules credentials out;
 * a wrong one would fail every time, not half the time.
 *
 * Root cause is NOT yet known. It is specifically *not* the sign-in rate limit
 * documented in `tests/specs/api/auth.spec.ts` — that throttle does not clear
 * in 15 seconds and then re-trip at the same rate, and it would hit local runs
 * too. A clean ~50/50 split seen only from CI would fit something like one
 * unhealthy instance behind a load balancer, but that is a hypothesis; the
 * sign-in status logged below is what will settle it.
 *
 * Until then this file only reduces exposure: reuse storage state that is still
 * valid rather than re-authenticating, and retry an attempt that fails.
 */

/** An accessToken cookie lasts 24h. Keep enough margin to outlast the longest
 *  job (the CI workflow caps at 90 minutes) so state cannot expire mid-run. */
const AUTH_REUSE_MARGIN_SECONDS = 2 * 60 * 60;

/**
 * At a ~50% per-attempt failure rate, 3 attempts still lose a role ~12% of the
 * time, which across six roles aborts more than half of all runs. 6 attempts
 * takes that to ~1.5% per role, ~9% per run. This is mitigation, not a fix —
 * drop it back once the underlying failure is understood.
 */
const LOGIN_ATTEMPTS = 6;

/**
 * Backoff between attempts. Deliberately short at the start: the failure is
 * transient rather than a rate limit, so an immediate retry usually succeeds
 * and waiting only burns job time. The later steps grow in case the cause does
 * turn out to be load-related.
 */
const LOGIN_BACKOFF_MS = [0, 2_000, 5_000, 10_000, 20_000, 30_000];

const authStatePath = (role: Role) =>
  `tests/setup/.auth/${role.normalized.toLowerCase()}.json`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * True when `<role>.json` still holds an accessToken good for longer than the
 * margin. Set `FORCE_AUTH_REFRESH=1` to re-authenticate regardless — needed
 * after a credential or role-permission change, which the expiry cannot see.
 */
async function hasUsableAuthState(role: Role): Promise<boolean> {
  if (process.env.FORCE_AUTH_REFRESH) return false;

  try {
    const raw = await fs.readFile(authStatePath(role), 'utf8');
    const state = JSON.parse(raw) as { cookies?: { name: string; expires: number }[] };
    const accessToken = state.cookies?.find((cookie) => cookie.name === 'accessToken');

    // `expires` is unix seconds; -1 marks a session cookie, which outlives
    // nothing and must not be reused.
    if (!accessToken || accessToken.expires <= 0) return false;

    return accessToken.expires > Date.now() / 1000 + AUTH_REUSE_MARGIN_SECONDS;
  } catch {
    // Missing, unreadable or malformed — treat as "must log in".
    return false;
  }
}

/**
 * Where the sign-in ended up, for the error message. Deliberately *not* the
 * trace: `tests/setup/traces/` records the login flow including the typed
 * password, which is why it is gitignored and never uploaded. A URL and the
 * visible notification text carry no secret and are enough to tell a throttled
 * sign-in from a changed selector.
 */
async function describeFailure(page: Page): Promise<string> {
  const parts: string[] = [];

  try {
    parts.push(`url=${new URL(page.url()).pathname}`);
  } catch {
    /* page already closed */
  }

  try {
    const notification = page.getByRole('region', { name: 'Notifications' });
    const text = (await notification.innerText({ timeout: 2_000 })).trim();
    if (text) parts.push(`notification="${text.replace(/\s+/g, ' ')}"`);
  } catch {
    /* no notification rendered */
  }

  return parts.length ? ` (${parts.join(', ')})` : '';
}

/** One sign-in attempt: fresh context, trace, login, persist storage state. */
async function authenticate(browser: Browser, role: Role): Promise<void> {
  const context = await browser.newContext();
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  /**
   * What the sign-in request actually returned — the one fact that separates
   * the candidate causes, since every one of them looks identical from the
   * browser (back on /login, no error toast):
   *
   *   401/403 → credential genuinely rejected
   *   429     → rate limit
   *   502/503/504 → an unhealthy backend, i.e. not a test problem at all
   *   request-failed → never reached the server
   *   200     → server accepted it and the app dropped the session (a race)
   *
   * Status and a few headers only. Never the body: on success it carries the
   * bearer token, and this string is printed to CI logs.
   */
  const signInOutcomes: string[] = [];

  page.on('response', (response) => {
    if (!response.url().includes('/auth/sign-in')) return;
    const headers = response.headers();
    const notable = [
      headers['retry-after'] ? `retry-after=${headers['retry-after']}` : null,
      headers['cf-ray'] ? 'via-cloudflare' : null,
      // Identifies which upstream served it — the tell for one bad instance.
      headers['x-served-by'] ? `served-by=${headers['x-served-by']}` : null,
    ].filter(Boolean);
    signInOutcomes.push(`${response.status()}${notable.length ? ` ${notable.join(' ')}` : ''}`);
  });

  page.on('requestfailed', (request) => {
    if (!request.url().includes('/auth/sign-in')) return;
    signInOutcomes.push(`request-failed(${request.failure()?.errorText ?? 'unknown'})`);
  });

  const describeSignIn = () =>
    ` sign-in=[${signInOutcomes.join(', ') || 'no response observed'}]`;

  try {
    const { username, password } = getCredentials(role.normalized);
    const loginPage = new LoginPage(page, context);
    const isCrmRole = ALL_CRM_ROLES.includes(role);

    await loginPage.loginAs(
      username,
      password,
      isCrmRole ? { createHomePage: (p) => new AdminHomePage(p) } : {},
    );

    await context.storageState({ path: authStatePath(role) });
    // Logged on success too: a healthy attempt's status is the baseline you
    // compare a failing one against, and it makes the 50/50 split visible.
    console.log(`  ${role.normalized} ok —${describeSignIn()}`);
  } catch (error) {
    throw new Error(`${(error as Error).message}${await describeFailure(page)}${describeSignIn()}`);
  } finally {
    await context.tracing.stop({
      path: `tests/setup/traces/${role.normalized.toLowerCase()}-setup.zip`,
    });
    await context.close();
  }
}

async function globalSetup(_config: FullConfig) {
  await fs.mkdir('tests/setup/.auth', { recursive: true });
  await fs.mkdir('tests/setup/traces', { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  try {
    let reused = 0;
    let generated = 0;

    for (const role of ROLES) {
      if (await hasUsableAuthState(role)) {
        console.log(`Reusing auth state for ${role.normalized}`);
        reused += 1;
        continue;
      }

      let lastError: Error | undefined;

      for (let attempt = 1; attempt <= LOGIN_ATTEMPTS; attempt += 1) {
        const backoff = LOGIN_BACKOFF_MS[attempt - 1];
        if (backoff) {
          console.warn(
            `Retrying ${role.normalized} sign-in in ${backoff / 1000}s ` +
              `(attempt ${attempt}/${LOGIN_ATTEMPTS}) — previous attempt: ${lastError?.message ?? 'unknown'}`,
          );
          await sleep(backoff);
        }

        console.log(`Generating auth state for ${role.normalized}`);
        try {
          await authenticate(browser, role);
          lastError = undefined;
          generated += 1;
          break;
        } catch (error) {
          lastError = error as Error;
        }
      }

      // Still all-or-nothing after the retries: a role without storage state
      // would fail every test in its project with a confusing UI error rather
      // than an obvious auth one.
      if (lastError) {
        throw new Error(
          `Global setup failed for ${role.normalized} after ${LOGIN_ATTEMPTS} attempts: ${lastError.message}`,
        );
      }
    }

    console.log(`Auth state ready: ${reused} reused, ${generated} generated`);

    // Between-runs capacity reset: clear residual active bookings on both
    // NJoyBook test branches (staff-mode Hajime - My Village, Branch-mode
    // Hajime - Thomson Plaza) so each run starts under the per-slot cap. Runs
    // once here, never concurrently with tests. Non-fatal per branch: a
    // failure must not block the whole suite.
    const RESET_BRANCHES = ['Hajime - My Village', 'Hajime - Thomson Plaza'];
    for (const branchName of RESET_BRANCHES) {
      const ctx = await browser.newContext({
        storageState: 'tests/setup/.auth/merchant_admin.json',
        baseURL: process.env.UAT_URL, // HomePage.goto() uses a relative '/'
      });
      try {
        const page = await ctx.newPage();
        const home = new HomePage(page);
        await home.goto();
        const config = await home.goToConfiguration();
        const branch = await config.openBranchConfig(branchName);
        const njoyBook = await branch.goToNJoyBook();
        const bookings = await njoyBook.goToBookings();
        await bookings.removeAllActiveBookings();
      } catch (err) {
        console.warn(`NJoyBook capacity reset skipped for ${branchName}: ${(err as Error).message}`);
      } finally {
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }
}

export default globalSetup;
