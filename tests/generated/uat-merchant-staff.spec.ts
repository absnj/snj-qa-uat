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

    test('Empty terms and conditions - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Should show validation error but succeeds

      await flows.emptyTermsAndConditionsNotAllowed(page);
    });

    test('Deal value percentage exceeds 100 - creation fails [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Should show validation error but succeeds

      await flows.dealValueExceedsOneHundredPercent(page);
    });

    test('Visit-Based happy path — 1 reward [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Loyalty program created successfully toast shown

      await flows.createLoyaltyProgramVisitBased1Reward(page);
    });

    test('Transaction-Based happy path — 1 reward [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Loyalty program created successfully toast shown

      await flows.createLoyaltyProgramTransactionBased1Reward(page);
    });

    test('Visit-Based happy path — 5 rewards (max) [Configuration | create]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: create
      // Expected Behavior: Loyalty program created successfully toast shown

      await flows.createLoyaltyProgramVisitBased5Rewards(page);
    });

    test('Add Reward button disabled at 5 rewards (max) [Configuration | reward limit]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: reward limit
      // Expected Behavior: Add Reward button is disabled

      await flows.addRewardButtonDisabledAtMax(page);
    });

    test('Step 1 — Visits Per Stamp empty [Configuration | validation]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: validation
      // Expected Behavior: Validation error shown — cannot proceed

      await flows.invalidVisitsPerStampEmpty(page);
    });

    test('Step 1 — Amount Per Stamp empty (Transaction-Based) [Configuration | validation]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: validation
      // Expected Behavior: Validation error shown — cannot proceed

      await flows.invalidAmountPerStampEmpty(page);
    });

    test('Step 2 — Program Title empty [Configuration | validation]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: validation
      // Expected Behavior: Validation error shown — cannot proceed

      await flows.invalidLoyaltyTitleEmpty(page);
    });

    test('Step 2 — Program Title exceeds 50 characters [Configuration | validation]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: validation
      // Expected Behavior: Validation error shown — cannot proceed

      await flows.invalidLoyaltyTitleTooLong(page);
    });

    test('Step 2 — Description empty [Configuration | validation]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: validation
      // Expected Behavior: Validation error shown — cannot proceed

      await flows.invalidLoyaltyDescriptionEmpty(page);
    });

    test('Step 2 — Description exceeds 100 characters [Configuration | validation]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: validation
      // Expected Behavior: Validation error shown — cannot proceed

      await flows.invalidLoyaltyDescriptionTooLong(page);
    });

    test('Step 3 — Reward Milestone empty [Configuration | validation]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: validation
      // Expected Behavior: Validation error shown — cannot proceed

      await flows.invalidRewardMilestoneEmpty(page);
    });

    test('Step 3 — Reward Name empty [Configuration | validation]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: validation
      // Expected Behavior: Validation error shown — cannot proceed

      await flows.invalidRewardNameEmpty(page);
    });

    test('Step 3 — Reward Valid Until empty [Configuration | validation]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: validation
      // Expected Behavior: Validation error shown — cannot proceed

      await flows.invalidRewardValidUntilEmpty(page);
    });

    test('Step 3 — Reward Quantity empty [Configuration | validation]', async ({ page, context }) => {
      // Role: Merchant Staff
      // Feature/Module: Configuration
      // Operation: validation
      // Expected Behavior: Validation error shown — cannot proceed

      await flows.invalidRewardQuantityEmpty(page);
    });

  });

});
