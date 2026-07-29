import { defineConfig } from '@playwright/test';

import { loadTestEnv } from './tests/setup/env';

loadTestEnv();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: './tests/setup/global.setup.ts',
  expect: {
    timeout: 30000,
  },
  timeout: 75_000,
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 0,
  /* Opt out of parallel tests on CI. */
  workers: 8,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.UAT_URL,
    storageState: './tests/setup/.auth/merchant_admin.json',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    /* Below ~1536px wide, the branch-config "Remarks" sidebar leaves the main
     * content column narrow enough that action button labels (e.g. "Add
     * booking", "Change status") collapse to icon-only and lose their
     * accessible name, breaking getByRole name-based locators. */
    viewport: { width: 1536, height: 900 },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'merchant-admin',
      use: { storageState: 'tests/setup/.auth/merchant_admin.json' },
      testMatch: '**/specs/**/*.spec.ts',
      grep: /@merchant-admin/,
    },
    {
      name: 'merchant-staff',
      use: { storageState: 'tests/setup/.auth/merchant_staff.json' },
      testMatch: '**/specs/**/*.spec.ts',
      grep: /@merchant-staff/,
    },
    {
      name: 'branch-admin',
      use: { storageState: 'tests/setup/.auth/branch_admin.json' },
      testMatch: '**/specs/**/*.spec.ts',
      grep: /@branch-admin/,
    },
    {
      name: 'branch-staff',
      use: { storageState: 'tests/setup/.auth/branch_staff.json' },
      testMatch: '**/specs/**/*.spec.ts',
      grep: /@branch-staff/,
    },
    {
      name: 'sales-agent',
      use: { storageState: 'tests/setup/.auth/sales_agent.json' },
      testMatch: '**/specs/**/*.spec.ts',
      grep: /@sales-agent/,
    },
    {
      name: 'merchant-success-staff',
      use: { storageState: 'tests/setup/.auth/merchant_success_staff.json' },
      testMatch: '**/specs/**/*.spec.ts',
      grep: /@merchant-success-staff/,
    },
    // TODO: add a superuser project when superuser tests are ready.

    // Pure API integration tests — no browser, no UI storageState. Auth is a
    // bearer token fetched per-test via AuthApi.signIn, not cookies, and the
    // backend host can differ from the admin dashboard's baseURL above.
    {
      name: 'api',
      testMatch: '**/specs/api/**/*.spec.ts',
      use: { baseURL: process.env.UAT_API_URL },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
