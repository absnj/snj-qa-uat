import { Page, Locator, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export function getUatUrl(): string {
  return requiredEnv('UAT_URL');
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

export function getCredentials(normalizedRole: string): {
  username: string;
  password: string;
} {
  const roleKey = normalizedRole.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

  return {
    username: process.env[`UAT_${roleKey}_USER`] ?? requiredEnv('UAT_USER'),
    password: process.env[`UAT_${roleKey}_PASSWORD`] ?? requiredEnv('UAT_PASSWORD'),
  };
}

// ---------------------------------------------------------------------------
// Navigation primitive
// Starts listening for networkidle BEFORE the click so the request
// fired immediately after the click is never missed.
// ---------------------------------------------------------------------------

export async function clickAndWaitForNav(page: Page, locator: Locator): Promise<void> {
  await Promise.all([
    page.waitForLoadState('networkidle'),
    locator.click(),
  ]);
}

// ---------------------------------------------------------------------------
// Login form interactions
// ---------------------------------------------------------------------------

export async function fillEmailField(page: Page, username: string): Promise<void> {
  const field = page.getByRole('textbox', { name: 'Email Address' });
  await field.click();
  await field.fill(username);
}

export async function fillPasswordField(page: Page, password: string): Promise<void> {
  const field = page.getByRole('textbox', { name: 'Password' });
  await field.click();
  await field.fill(password);
}

export async function clickSignIn(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: 'Sign In' });
  await expect(button).toBeEnabled();
  await Promise.all([
    page.waitForLoadState('networkidle'),
    button.click(),
  ]);
}

// ---------------------------------------------------------------------------
// Wait / assertion helpers
// ---------------------------------------------------------------------------

export async function waitForLoginForm(page: Page): Promise<void> {
  await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
}

export async function waitForDashboard(
  page: Page,
  timeout: number = 15000,
): Promise<void> {
  await expect(
    page.getByRole('heading', { name: 'Welcome to ShopNJoy' }),
  ).toBeVisible({ timeout });
}

export async function waitForInvalidCredentialsError(
  page: Page,
  timeout: number = 10000,
): Promise<void> {
  await expect(
    page
      .getByRole('region', { name: 'Notifications' })
      .getByText('Invalid email or password.'),
  ).toBeVisible({ timeout });
}