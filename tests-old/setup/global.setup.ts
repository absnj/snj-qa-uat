// tests/setup/global.setup.ts
import { chromium, FullConfig } from '@playwright/test';
import { loginAs } from '../flows/auth/auth';
import { loadTestEnv } from './env';

loadTestEnv();

const ROLES = [
  'MERCHANT_ADMIN',
  'MERCHANT_STAFF', 
  'BRANCH_ADMIN',
  'BRANCH_STAFF',
];

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();

  try {
    for (const role of ROLES) {
      console.log(`Generating auth state for ${role}`);

      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await loginAs(page, context, role);
        await context.storageState({
          path: `tests/setup/.auth/${role.toLowerCase()}.json`,
        });
      } catch (error) {
        throw new Error(`Global setup login failed for ${role}: ${(error as Error).message}`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

export default globalSetup;
