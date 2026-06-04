import { Page, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

const SELECTORS = {
  emailField: (page: Page) => page.getByRole('textbox', { name: 'Email Address' }),
  passwordField: (page: Page) => page.getByRole('textbox', { name: 'Password' }),
  signInButton: (page: Page) => page.getByRole('button', { name: 'Sign In' }),
  dashboardHeading: (page: Page) => page.getByRole('heading', { name: 'Welcome to ShopNJoy' }),
  invalidCredentialsError: (page: Page) =>
    page
      .getByRole('region', { name: 'Notifications' })
      .getByText('Invalid email or password.'),
};

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

export async function fillEmailField(page: Page, username: string): Promise<void> {
  const field = SELECTORS.emailField(page);
  await field.click();
  await field.fill(username);
}

export async function fillPasswordField(page: Page, password: string): Promise<void> {
  const field = SELECTORS.passwordField(page);
  await field.click();
  await field.fill(password);
}

export async function clickSignIn(page: Page): Promise<void> {
  const button = SELECTORS.signInButton(page);
  await expect(button).toBeEnabled();
  await button.click();
}

// ---------------------------------------------------------------------------
// Waits
// ---------------------------------------------------------------------------

export async function waitForLoginForm(page: Page): Promise<void> {
  await expect(SELECTORS.emailField(page)).toBeVisible();
}

export async function waitForDashboard(page: Page, timeout = 30000): Promise<void> {
  await expect(SELECTORS.dashboardHeading(page)).toBeVisible({ timeout });
}

export async function waitForInvalidCredentialsError(page: Page, timeout = 10000): Promise<void> {
  await expect(SELECTORS.invalidCredentialsError(page)).toBeVisible({ timeout });
}
