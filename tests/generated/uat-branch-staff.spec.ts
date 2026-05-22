import { test } from '@playwright/test';
import * as flows from '../flows';

test.describe('UAT matrix role: Branch Staff', () => {

  test.describe('Feature tests', () => {
    test.beforeEach(async ({ page }) => {
      await flows.loginAs(page, 'BRANCH_STAFF');
    });

    test('Merchant/Branch Staffs option - does not exist [User Management | unable to create]', async ({ page, context }) => {
      // Role: Branch Staff
      // Feature/Module: User Management
      // Operation: unable to create
      // Expected Behavior: Button not present

      await flows.staffUnableToCreate(page);
    });

  });

});
