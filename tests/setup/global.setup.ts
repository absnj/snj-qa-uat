import { chromium, type Browser, type FullConfig, type Page } from '@playwright/test';
import { loadTestEnv } from './env';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminHomePage } from '../pages/admin/AdminHomePage';
import { BranchConfigPage } from '../pages/configuration/branch/BranchConfigPage';
import { ALL_ROLES, ALL_CRM_ROLES, getCredentials, type Role } from '../specs/helpers/roles';
import fs from 'fs/promises';

loadTestEnv();

const ROLES: Role[] = [...ALL_ROLES, ...ALL_CRM_ROLES];

/** Tokens last 24h; keep enough margin to outlast the 90-minute job cap. */
const AUTH_REUSE_MARGIN_SECONDS = 2 * 60 * 60;

/** One spare attempt for a blip. Deeper ladders hide regressions. */
const LOGIN_ATTEMPTS = 2;
const LOGIN_BACKOFF_MS = [0, 2_000];

const authStatePath = (role: Role) =>
  `tests/setup/.auth/${role.normalized.toLowerCase()}.json`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * `FORCE_AUTH_REFRESH=1` re-authenticates regardless — needed after a
 * credential or permission change, which an expiry timestamp cannot see.
 */
async function hasUsableAuthState(role: Role): Promise<boolean> {
  if (process.env.FORCE_AUTH_REFRESH) return false;

  try {
    const raw = await fs.readFile(authStatePath(role), 'utf8');
    const state = JSON.parse(raw) as { cookies?: { name: string; expires: number }[] };
    const accessToken = state.cookies?.find((cookie) => cookie.name === 'accessToken');

    // Unix seconds; -1 marks a session cookie, which must not be reused.
    if (!accessToken || accessToken.expires <= 0) return false;

    return accessToken.expires > Date.now() / 1000 + AUTH_REUSE_MARGIN_SECONDS;
  } catch {
    // Missing, unreadable or malformed — treat as "must log in".
    return false;
  }
}

/**
 * Failure context for the error message. Not the trace — that records the typed
 * password, which is why it is gitignored and never uploaded.
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
   * Status only, never the body — it carries the bearer token and this is
   * printed to CI logs. Distinguishes a rejected login from a blocked or
   * unsent one, which look identical from the browser.
   */
  const signInOutcomes: string[] = [];

  page.on('response', (response) => {
    if (!response.url().includes('/auth/sign-in')) return;
    const headers = response.headers();
    const notable = [
      headers['retry-after'] ? `retry-after=${headers['retry-after']}` : null,
      headers['cf-ray'] ? 'via-cloudflare' : null,
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
    /** Signs one role in, with the retry ladder. Resolves to what it did. */
    async function prepareRole(role: Role): Promise<'reused' | 'generated'> {
      if (await hasUsableAuthState(role)) {
        console.log(`Reusing auth state for ${role.normalized}`);
        return 'reused';
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
          return 'generated';
        } catch (error) {
          lastError = error as Error;
        }
      }

      throw new Error(
        `Global setup failed for ${role.normalized} after ${LOGIN_ATTEMPTS} attempts: ${lastError!.message}`,
      );
    }

    /*
     * Sign roles in three at a time. Each gets its own browser context, so there
     * is no ordering between them, and CI pays this on every shard (a fresh
     * checkout has no saved sessions).
     *
     * Three is a measured ceiling, not a guess: all six at once makes UAT's
     * sign-in limiter return 429 for two of them. Only raise it with evidence
     * that both the rate limit and the runner's CPU tolerate more.
     *
     * allSettled, not all, so a failing role is reported as itself rather than
     * hidden behind whichever rejection landed first.
     */
    const AUTH_CONCURRENCY = 3;
    const outcomes: PromiseSettledResult<'reused' | 'generated'>[] = [];

    for (let i = 0; i < ROLES.length; i += AUTH_CONCURRENCY) {
      const batch = ROLES.slice(i, i + AUTH_CONCURRENCY);
      outcomes.push(...(await Promise.allSettled(batch.map(prepareRole))));
    }

    const failures = outcomes.flatMap((o) => (o.status === 'rejected' ? [o.reason as Error] : []));

    // All-or-nothing: a role without storage state would fail every test in
    // its project with a confusing UI error rather than an obvious auth one.
    if (failures.length) {
      throw new Error(failures.map((error) => error.message).join('\n'));
    }

    const settled = outcomes.flatMap((o) => (o.status === 'fulfilled' ? [o.value] : []));
    const reused = settled.filter((r) => r === 'reused').length;
    const generated = settled.filter((r) => r === 'generated').length;

    console.log(`Auth state ready: ${reused} reused, ${generated} generated`);

    // Between-runs capacity reset: clear residual active bookings on both
    // NJoyBook test branches (staff-mode Hajime - My Village, Branch-mode
    // Hajime - Thomson Plaza) so each run starts under the per-slot cap. Runs
    // once here, never concurrently with tests. Non-fatal per branch: a
    // failure must not block the whole suite.
    const RESET_BRANCHES = ['Hajime - My Village', 'Hajime - Thomson Plaza'];
    await Promise.all(
      RESET_BRANCHES.map(async (branchName) => {
        const ctx = await browser.newContext({
          storageState: 'tests/setup/.auth/merchant_admin.json',
          baseURL: process.env.UAT_URL, // BranchConfigPage.open() uses a relative path
          /*
           * Global setup builds its own contexts, so it does not inherit the
           * project's `use.viewport` and would default to 1280x720. Below
           * 1536px the Bookings header actions collapse to icon-only buttons
           * that carry no aria-label, so "Remove active" loses its accessible
           * name and the reset finds nothing to click. Stay clear of that
           * breakpoint rather than sitting exactly on it.
           */
          viewport: { width: 1600, height: 900 },
        });
        try {
          const page = await ctx.newPage();
          const branch = await BranchConfigPage.open(page, branchName);
          const njoyBook = await branch.goToNJoyBook();
          const bookings = await njoyBook.goToBookings();
          await bookings.removeAllActiveBookings();
        } catch (err) {
          console.warn(
            `NJoyBook capacity reset skipped for ${branchName}: ${(err as Error).message}`,
          );
        } finally {
          await ctx.close();
        }
      }),
    );
  } finally {
    await browser.close();
  }
}

export default globalSetup;
