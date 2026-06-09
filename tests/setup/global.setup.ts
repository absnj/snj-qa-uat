// tests/setup/global.setup.ts
import { chromium, type FullConfig } from '@playwright/test';
import { loadTestEnv } from './env';
import { LoginPage } from '../pages/auth/LoginPage';
import fs from 'fs/promises';

loadTestEnv();

const ROLES = [
  'MERCHANT_ADMIN',
  'MERCHANT_STAFF',
  'BRANCH_ADMIN',
  'BRANCH_STAFF',
];

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

async function globalSetup(_config: FullConfig) {
  await fs.mkdir('tests/setup/.auth', { recursive: true });
  await fs.mkdir('tests/setup/traces', { recursive: true });

  const browser = await chromium.launch();
  try {
    for (const role of ROLES) {
      console.log(`Generating auth state for ${role}`);
      const context = await browser.newContext();
      await context.tracing.start({ screenshots: true, snapshots: true });
      const page = await context.newPage();
      try {
        const key = role.toUpperCase();
        const username = requiredEnv(`UAT_${key}_USER`);
        const password = requiredEnv(`UAT_${key}_PASSWORD`);
        const loginPage = new LoginPage(page, context);
        await loginPage.loginAs(username, password);
        await context.storageState({
          path: `tests/setup/.auth/${role.toLowerCase()}.json`,
        });
      } catch (error) {
        throw new Error(`Global setup failed for ${role}: ${(error as Error).message}`);
      } finally {
        await context.tracing.stop({
          path: `tests/setup/traces/${role.toLowerCase()}-setup.zip`,
        });
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

export default globalSetup;
