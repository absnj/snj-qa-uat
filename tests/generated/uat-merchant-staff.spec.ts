import { test } from '@playwright/test';
import * as flows from '../flows';

test.describe('UAT matrix role: Merchant Staff', () => {

  test.describe('Login tests', () => {
    test.use({ storageState: undefined });

    test('Valid credentials - login succeeds [Login | authenticate]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Login
      // Operation: authenticate
      // Expected Behavior: Redirect to dashboard

      await flows.loginAs(page, context, 'MERCHANT_STAFF');
    });

    test('Invalid credentials - login fails [Login | authenticate]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Login
      // Operation: authenticate
      // Expected Behavior: Show error message

      await flows.loginWithInvalidCredentials(page, context, 'MERCHANT_STAFF');
    });

  });

  test.describe('Feature tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(process.env.UAT_URL!);
    });

    test('Create ticket - Success [Support | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Support
      // Operation: create
      // Expected Behavior: Show success message

      await flows.createTicketSuccess(page);
    });

    test('Empty ticket subject - creation fails [Support | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Support
      // Operation: create
      // Expected Behavior: Show error message

      await flows.createTicketEmptySubject(page);
    });

    test('Empty ticket description - creation fails [Support | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Support
      // Operation: create
      // Expected Behavior: Show error message

      await flows.createTicketEmptyDescription(page);
    });

    test('Lengthy ticket subject - creation fails [Support | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Support
      // Operation: create
      // Expected Behavior: Show error message

      await flows.createTicketLongSubject(page);
    });

    test('Merchant/Branch Staffs option - does not exist [User Management | unable to create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: User Management
      // Operation: unable to create
      // Expected Behavior: Button not present

      await flows.staffUnableToCreate(page);
    });

  });

});
