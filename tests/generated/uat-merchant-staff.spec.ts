import { test } from '@playwright/test';
import * as flows from '../flows';

test.describe('UAT matrix role: Merchant Staff', () => {

  test.describe('Feature tests', () => {
    test.beforeEach(async ({ page }) => {
      await flows.loginAs(page, 'MERCHANT_STAFF');
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
