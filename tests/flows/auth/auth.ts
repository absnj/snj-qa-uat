import { Page, BrowserContext } from '@playwright/test';
import {
  fillEmailField,
  fillPasswordField,
  clickSignIn,
  waitForLoginForm,
  waitForDashboard,
  waitForInvalidCredentialsError,
} from '../../pages/LoginPage';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

function getUatUrl(): string {
  return requiredEnv('UAT_URL');
}

function getCredentials(normalizedRole: string): { username: string; password: string } {
  const roleKey = normalizedRole.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  return {
    username: process.env[`UAT_${roleKey}_USER`] ?? requiredEnv('UAT_USER'),
    password: process.env[`UAT_${roleKey}_PASSWORD`] ?? requiredEnv('UAT_PASSWORD'),
  };
}

// ---------------------------------------------------------------------------
// Flows
// ---------------------------------------------------------------------------

export async function loginAs(page: Page, normalizedRole: string): Promise<void> {
  const { username, password } = getCredentials(normalizedRole);

  await page.goto(getUatUrl(), { waitUntil: 'networkidle' });
  await waitForLoginForm(page);
  await fillEmailField(page, username);
  await fillPasswordField(page, password);
  await clickSignIn(page);
  await waitForDashboard(page);
}

export async function loginWithInvalidCredentials(
  page: Page,
  context: BrowserContext,
  normalizedRole: string,
): Promise<void> {
  const { username, password } = getCredentials(normalizedRole);

  await context.clearCookies();
  await page.goto(getUatUrl(), { waitUntil: 'networkidle' });

  // Clear client-side storage now that we're on the correct origin
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.reload({ waitUntil: 'networkidle' });
  await waitForLoginForm(page);
  await fillEmailField(page, username);
  await fillPasswordField(page, `${password}invalid`);
  await clickSignIn(page);
  await waitForInvalidCredentialsError(page);
}