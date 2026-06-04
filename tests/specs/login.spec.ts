// specs/Auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/auth/LoginPage';
import { ALL_ROLES } from './helpers/roles';

test.describe('Login', () => {
  test.use({ storageState: undefined });

  for (const role of ALL_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {

      test('valid credentials redirect to dashboard', async ({ page, context }) => {
        const { username, password } = getCredentials(role.normalized);
        const login = new LoginPage(page, context);
        const home  = await login.loginAs(username, password);

        await expect(home.welcomeHeading).toBeVisible();
      });

      test('invalid credentials show an error', async ({ page, context }) => {
        const { username, password } = getCredentials(role.normalized);
        const login = new LoginPage(page, context);
        await login.loginWithInvalidCredentials(username, password);

        expect(await login.getErrorMessage()).toBe('Invalid email or password.');
      });

    });
  }
});

function getCredentials(normalized: string) {
  const key = normalized.toUpperCase();
  return {
    username: process.env[`UAT_${key}_USER`]!,
    password: process.env[`UAT_${key}_PASSWORD`]!,
  };
}