import { test } from '@playwright/test';
import * as flows from '../flows';

test.describe('UAT matrix role: Merchant Staff', () => {

  test.describe('Feature tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(process.env.UAT_URL!);
    });

    test('Merchant Staff views deal list [Configuration | read]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: read
      // Expected Behavior: Deal list is visible

      await flows.viewDealList(page);
    });

    test('Merchant Staff creates deal - success [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Deal created and visible in list

      await flows.createDealHappyPath(page);
    });

    test('Merchant Staff updates deal - success [Configuration | update]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: update
      // Expected Behavior: Deal updated successfully

      await flows.updateDealHappyPath(page);
    });

    test('Merchant Staff can manage deals [Configuration | manage]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: manage
      // Expected Behavior: Manage options visible

      await flows.manageDeal(page);
    });

    test('Deal title empty - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidDealTitleEmpty(page);
    });

    test('Deal title exceeds 50 characters - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidDealTitleTooLong(page);
    });

    test('Description empty - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidDescriptionEmpty(page);
    });

    test('Description exceeds 100 characters - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidDescriptionTooLong(page);
    });

    test('Start date empty - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidStartDateEmpty(page);
    });

    test('End date empty - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidEndDateEmpty(page);
    });

    test('End date before start date - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show date range error

      await flows.invalidEndDateBeforeStartDate(page);
    });

    test('End time before start time - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show date/time range error

      await flows.invalidEndTimeBeforeStartTime(page);
    });

    test('Deal value is zero - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidDealValueZero(page);
    });

    test('Deal value is empty - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidDealValueEmpty(page);
    });

    test('Deal value is negative - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidDealValueNegative(page);
    });

    test('Quantity is zero - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidQuantityZero(page);
    });

    test('Quantity is negative - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidQuantityNegative(page);
    });

    test('Minimum spend is negative - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidMinimumSpendNegative(page);
    });

    test('Empty terms and conditions - creation succeeds (BUG) [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Should show validation error but succeeds

      await flows.bugEmptyTermsAndConditionsAllowed(page);
    });

    test('Deal value percentage exceeds 100 - creation succeeds (BUG) [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Should show validation error but succeeds

      await flows.bugDealValueExceedsOneHundredPercent(page);
    });

  });

});
