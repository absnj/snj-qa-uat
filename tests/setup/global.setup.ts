// tests/setup/global.setup.ts
import { chromium, type FullConfig } from '@playwright/test';
import { loadTestEnv } from './env';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminHomePage } from '../pages/admin/AdminHomePage';
import { HomePage } from '../pages/home/HomePage';
import { ALL_ROLES, ALL_CRM_ROLES, getCredentials, type Role } from '../specs/helpers/roles';
import fs from 'fs/promises';

loadTestEnv();

const ROLES: Role[] = [...ALL_ROLES, ...ALL_CRM_ROLES];

async function globalSetup(_config: FullConfig) {
  await fs.mkdir('tests/setup/.auth', { recursive: true });
  await fs.mkdir('tests/setup/traces', { recursive: true });

  const browser = await chromium.launch({
  headless: true, // try headed first to confirm
  args: [
    '--disable-blink-features=AutomationControlled',
  ]
});
  try {
    for (const role of ROLES) {
      console.log(`Generating auth state for ${role.normalized}`);
      const context = await browser.newContext();
      await context.tracing.start({ screenshots: true, snapshots: true });
      const page = await context.newPage();
      try {
        const { username, password } = getCredentials(role.normalized);
        const loginPage = new LoginPage(page, context);
        const isCrmRole = ALL_CRM_ROLES.includes(role);
        await loginPage.loginAs(username, password, isCrmRole
          ? { createHomePage: (p) => new AdminHomePage(p) }
          : {});
        await context.storageState({
          path: `tests/setup/.auth/${role.normalized.toLowerCase()}.json`,
        });
      } catch (error) {
        throw new Error(`Global setup failed for ${role.normalized}: ${(error as Error).message}`);
      } finally {
        await context.tracing.stop({
          path: `tests/setup/traces/${role.normalized.toLowerCase()}-setup.zip`,
        });
        await context.close();
      }
    }

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
