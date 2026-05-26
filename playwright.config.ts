import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
dotenv.config();
import path from 'path';

// Use tests/.env so generated UAT tests can load the role-specific variables.
const envPaths = [
  path.resolve(__dirname, 'tests', '.env'),
  path.resolve(__dirname, '.env'),
];
for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: './tests/setup/global.setup.ts',
  expect: {
    timeout: 10000,
  },
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 1,
  /* Opt out of parallel tests on CI. */
  workers: 8,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.UAT_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'merchant-admin',
      use: { storageState: 'tests/setup/.auth/merchant_admin.json' },
      testMatch: '**/uat-merchant-admin.spec.ts',
    },
    {
      name: 'merchant-staff',
      use: { storageState: 'tests/setup/.auth/merchant_staff.json' },
      testMatch: '**/uat-merchant-staff.spec.ts',
    },
    {
      name: 'branch-admin',
      use: { storageState: 'tests/setup/.auth/branch_admin.json' },
      testMatch: '**/uat-branch-admin.spec.ts',
    },
    {
      name: 'branch-staff',
      use: { storageState: 'tests/setup/.auth/branch_staff.json' },
      testMatch: '**/uat-branch-staff.spec.ts',
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});