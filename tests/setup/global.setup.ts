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
 * UAT rate-limits `POST /v2/auth/sign-in` per window. This file signs in every
 * role in sequence and runs on *every* `playwright test` invocation, so a job
 * that re-runs specs (CI triage verifying a fix) used to stack six sign-ins per
 * invocation — 42 in one observed job — and trip the limit. A throttled sign-in
 * never reaches the dashboard, so the old code failed on whichever role the
 * window happened to cut off and aborted the whole suite.
 *
 * Two mitigations below: reuse still-valid storage state instead of
 * re-authenticating, and back off and retry when a sign-in does fail.
 */

/** An accessToken cookie lasts 24h. Keep enough margin to outlast the longest
 *  job (the CI workflow caps at 90 minutes) so state cannot expire mid-run. */
const AUTH_REUSE_MARGIN_SECONDS = 2 * 60 * 60;

const LOGIN_ATTEMPTS = 3;
/** Backoff between sign-in attempts. This is a rate-limit backoff in setup, not
 *  a sleep standing in for a UI wait — the thing being waited on is a server
 *  side window that no locator can observe. */
const LOGIN_BACKOFF_MS = [0, 15_000, 45_000];

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
  } catch (error) {
    throw new Error(`${(error as Error).message}${await describeFailure(page)}`);
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
              `(attempt ${attempt}/${LOGIN_ATTEMPTS}) — likely rate limited`,
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
