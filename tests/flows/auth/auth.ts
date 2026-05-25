import { Page, BrowserContext } from '@playwright/test';
import {
  getUatUrl,
  getCredentials,
  fillEmailField,
  fillPasswordField,
  clickSignIn,
  waitForLoginForm,
  waitForDashboard,
  waitForInvalidCredentialsError,
} from './utils';

// ---------------------------------------------------------------------------
// Happy path login
// ---------------------------------------------------------------------------

export async function loginAs(page: Page, normalizedRole: string): Promise<void> {
  const uatUrl = getUatUrl();
  const { username, password } = getCredentials(normalizedRole);

  // networkidle ensures the JS framework has fully mounted before we
  // look for any elements — domcontentloaded fires too early for SPAs.
  await page.goto(uatUrl, { waitUntil: 'networkidle' });
  await waitForLoginForm(page);

  await fillEmailField(page, username);
  await fillPasswordField(page, password);
  await clickSignIn(page);

  await waitForDashboard(page);
}

// ---------------------------------------------------------------------------
// Invalid credentials flow
// ---------------------------------------------------------------------------

export async function loginWithInvalidCredentials(
  page: Page,
  context: BrowserContext,
  normalizedRole: string,
): Promise<void> {
  const uatUrl = getUatUrl();
  const { username, password } = getCredentials(normalizedRole);

  await context.clearCookies();
  await page.goto(uatUrl, { waitUntil: 'networkidle' });

  // Clear client-side storage now that we're on the correct origin
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Reload so the app boots fresh with no cached state
  await page.reload({ waitUntil: 'networkidle' });
  await waitForLoginForm(page);

  await fillEmailField(page, username);
  await fillPasswordField(page, `${password}invalid`);
  await clickSignIn(page);

  await waitForInvalidCredentialsError(page);
}