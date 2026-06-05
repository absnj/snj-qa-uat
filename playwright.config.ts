import { defineConfig } from '@playwright/test';

import { loadTestEnv } from './tests-old/setup/env';

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
  workers: 4,
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
    // TODO: add a superuser project when superuser tests are ready.
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
