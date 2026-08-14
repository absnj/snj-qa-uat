import { defineConfig } from '@playwright/test';

import { loadTestEnv } from './tests/setup/env';

loadTestEnv();

export default defineConfig({
  globalSetup: './tests/setup/global.setup.ts',
  expect: {
    timeout: 30000,
  },
  timeout: 75_000,
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // One worker per core. These tests are CPU-bound on the runner, so running
  // more workers than cores just makes each one slower. CI gets its parallelism
  // from sharding across runners instead.
  workers: process.env.CI ? '100%' : 8,
  // CI shards each emit a blob, merged into one HTML report by the `report` job.
  reporter: process.env.CI ? [['blob'], ['line']] : [['html']],
  use: {
    baseURL: process.env.UAT_URL,
    storageState: './tests/setup/.auth/merchant_admin.json',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Below ~1536px the branch-config "Remarks" sidebar squeezes the main column
    // until action buttons ("Add booking", "Change status") collapse to icons and
    // lose their accessible name, breaking every getByRole lookup for them.
    viewport: { width: 1536, height: 900 },
  },

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

    // API tests — no browser, no saved session. Auth is a bearer token fetched
    // per test, and the backend host can differ from the dashboard baseURL above.
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
