import { test } from '@playwright/test';
import * as flows from '../flows';

test.describe('UAT matrix role: Merchant Admin', () => {

  test('Valid credentials - login succeeds [Login | authenticate]', async ({ page, context }) => {
    // Role: Merchant Admin
    // Feature/Module: Login
    // Operation: authenticate
    // Expected Behavior: Redirect to dashboard

    await flows.loginAs(page, 'MERCHANT_ADMIN');
  });

  test('Invalid credentials - login fails [Login | authenticate]', async ({ page, context }) => {
    // Role: Merchant Admin
    // Feature/Module: Login
    // Operation: authenticate
    // Expected Behavior: Show error message

    await flows.loginWithInvalidCredentials(page, context, 'MERCHANT_ADMIN');
  });

  test.describe('Feature tests', () => {
    test.beforeEach(async ({ page }) => {
      await flows.loginAs(page, 'MERCHANT_ADMIN');
    });

    test('Create ticket - Success [Support | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: Support
      // Operation: create
      // Expected Behavior: Show success message

      await flows.createTicketSuccess(page);
    });

    test('Empty ticket subject - creation fails [Support | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: Support
      // Operation: create
      // Expected Behavior: Show error message

      await flows.createTicketEmptySubject(page);
    });

    test('Empty ticket description - creation fails [Support | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: Support
      // Operation: create
      // Expected Behavior: Show error message

      await flows.createTicketEmptyDescription(page);
    });

    test('Lengthy ticket subject - creation fails [Support | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: Support
      // Operation: create
      // Expected Behavior: Show error message

      await flows.createTicketLongSubject(page);
    });

    test('Merchant Admin creates user - success [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: User created and visible in list

      await flows.createUserHappyPath(page);
    });

  });

});
