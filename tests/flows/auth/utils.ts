import { Page, BrowserContext, expect } from '@playwright/test';

/**
 * Environment variable utilities
 */
function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

function getUatUrl(): string {
  return requiredEnv('UAT_URL');
}

/**
 * Credential resolution
 */
function getCredentials(normalizedRole: string) {
  const roleKey = normalizedRole.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

  return {
    username: process.env[`UAT_${roleKey}_USER`] ?? requiredEnv('UAT_USER'),
    password: process.env[`UAT_${roleKey}_PASSWORD`] ?? requiredEnv('UAT_PASSWORD'),
  };
}

/**
 * Page interactions (selectors and waits)
 */
async function fillEmailField(page: Page, username: string): Promise<void> {
  await page.getByRole('textbox', { name: 'Email Address' }).fill(username);
}

async function fillPasswordField(page: Page, password: string): Promise<void> {
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
}

async function clickSignIn(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Sign In' }).click();
}

async function waitForLoginForm(page: Page): Promise<void> {
  await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
}

async function waitForDashboard(page: Page, timeout: number = 15000): Promise<void> {
  await expect(
    page.getByRole('heading', { name: 'Welcome to ShopNJoy' })
  ).toBeVisible({ timeout });
}

async function waitForInvalidCredentialsError(page: Page, timeout: number = 10000): Promise<void> {
  await expect(
    page.getByRole('region', { name: 'Notifications' })
      .getByText('Invalid email or password.')
  ).toBeVisible({ timeout });
}
