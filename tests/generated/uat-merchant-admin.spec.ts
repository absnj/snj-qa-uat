import { test } from '@playwright/test';
import * as flows from '../flows';

test.describe('UAT matrix role: Merchant Admin', () => {

  test.describe('Feature tests', () => {
    test.beforeEach(async ({ page }) => {
      await flows.loginAs(page, 'MERCHANT_ADMIN');
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
