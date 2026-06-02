// tests/setup/global.setup.ts
import { chromium, FullConfig } from '@playwright/test';
import { loginAs } from '../flows/auth/auth';

const ROLES = [
  'MERCHANT_ADMIN',
  'MERCHANT_STAFF', 
  'BRANCH_ADMIN',
  'BRANCH_STAFF',
  'SUPERUSER',
];

async function globalSetup(config: FullConfig) {
  for (const role of ROLES) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const context = page.context();

    await loginAs(page, context, role);

    // Save the session — cookies + localStorage
    await page.context().storageState({
      path: `tests/setup/.auth/${role.toLowerCase()}.json`,
    });

    await browser.close();
  }
}

export default globalSetup;