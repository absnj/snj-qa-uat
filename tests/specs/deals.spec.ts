import { test } from '@playwright/test';
import {
  createDealHappyPath,
  dealValueExceedsOneHundredPercent,
  emptyTermsAndConditionsNotAllowed,
  invalidDealTitleEmpty,
  invalidDealTitleTooLong,
  invalidDealValueEmpty,
  invalidDealValueNegative,
  invalidDealValueZero,
  invalidDescriptionEmpty,
  invalidDescriptionTooLong,
  invalidEndDateBeforeStartDate,
  invalidEndDateEmpty,
  invalidEndTimeBeforeStartTime,
  invalidQuantityNegative,
  invalidQuantityZero,
  invalidStartDateEmpty,
  staffUnableToCreateDeal,
  viewDealList,
} from '../flows';
import {
  DEAL_CREATOR_ROLES,
  DEAL_READ_ONLY_ROLES,
  gotoUat,
} from './helpers/roles';

test.describe('Configuration - Deals', () => {
  for (const role of DEAL_CREATOR_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test.beforeEach(async ({ page }) => {
        await gotoUat(page);
      });

      test('shows the deal list', async ({ page }) => {
        await viewDealList(page);
      });

      test('creates a deal successfully', async ({ page }) => {
        await createDealHappyPath(page);
      });

      test('rejects an empty deal title', async ({ page }) => {
        await invalidDealTitleEmpty(page);
      });

      test('rejects a deal title over 50 characters', async ({ page }) => {
        await invalidDealTitleTooLong(page);
      });

      test('rejects an empty description', async ({ page }) => {
        await invalidDescriptionEmpty(page);
      });

      test('rejects a description over 100 characters', async ({ page }) => {
        await invalidDescriptionTooLong(page);
      });

      test('rejects an empty start date', async ({ page }) => {
        await invalidStartDateEmpty(page);
      });

      test('rejects an empty end date', async ({ page }) => {
        await invalidEndDateEmpty(page);
      });

      test('rejects an end date before the start date', async ({ page }) => {
        await invalidEndDateBeforeStartDate(page);
      });

      test('rejects an end time before the start time', async ({ page }) => {
        await invalidEndTimeBeforeStartTime(page);
      });

      test('rejects a zero deal value', async ({ page }) => {
        await invalidDealValueZero(page);
      });

      test('rejects an empty deal value', async ({ page }) => {
        await invalidDealValueEmpty(page);
      });

      test('rejects a negative deal value', async ({ page }) => {
        await invalidDealValueNegative(page);
      });

      test('rejects a zero quantity', async ({ page }) => {
        await invalidQuantityZero(page);
      });

      test('rejects a negative quantity', async ({ page }) => {
        await invalidQuantityNegative(page);
      });

      test('rejects empty terms and conditions', async ({ page }) => {
        await emptyTermsAndConditionsNotAllowed(page);
      });

      test('rejects a deal value percentage over 100', async ({ page }) => {
        await dealValueExceedsOneHundredPercent(page);
      });
    });
  }

  for (const role of DEAL_READ_ONLY_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test.beforeEach(async ({ page }) => {
        await gotoUat(page);
      });

      test('shows the deal list', async ({ page }) => {
        await viewDealList(page);
      });

      test('does not show the create deal button', async ({ page }) => {
        await staffUnableToCreateDeal(page);
      });
    });
  }
});
