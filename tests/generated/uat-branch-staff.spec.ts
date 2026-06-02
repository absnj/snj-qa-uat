import { test } from '@playwright/test';
import * as flows from '../flows';

test.describe('UAT matrix role: Branch Staff', () => {

  test.describe('Feature tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(process.env.UAT_URL!);
    });

    test('Branch Staff views deal list [Configuration | read]', async ({ page, context }) => {
      // Role: Branch Staff
      // Feature/Module: Configuration
      // Operation: read
      // Expected Behavior: Deal list is visible

      await flows.viewDealList(page);
    });

    test('Branch Staff cannot create deal - button not present [Configuration | unable to create]', async ({ page, context }) => {
      // Role: Branch Staff
      // Feature/Module: Configuration
      // Operation: unable to create
      // Expected Behavior: Create button not visible

      await flows.staffUnableToCreateDeal(page);
    });

    test('Branch Staff cannot see Create button [Configuration | access control]', async ({ page, context }) => {
      // Role: Branch Staff
      // Feature/Module: Configuration
      // Operation: access control
      // Expected Behavior: Create button not visible

      await flows.staffUnableToCreateLoyaltyProgram(page);
    });

  });

});
