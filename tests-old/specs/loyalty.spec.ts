import { test } from '@playwright/test';
import {
  addRewardButtonDisabledAtMax,
  createLoyaltyProgramTransactionBased1Reward,
  createLoyaltyProgramVisitBased1Reward,
  createLoyaltyProgramVisitBased5Rewards,
  invalidAmountPerStampEmpty,
  invalidLoyaltyDescriptionEmpty,
  invalidLoyaltyDescriptionTooLong,
  invalidLoyaltyTitleEmpty,
  invalidLoyaltyTitleTooLong,
  invalidRewardMilestoneEmpty,
  invalidRewardNameEmpty,
  invalidRewardQuantityEmpty,
  invalidRewardValidUntilEmpty,
  invalidVisitsPerStampEmpty,
  staffUnableToCreateLoyaltyProgram,
} from '../flows';
import {
  gotoUat,
  LOYALTY_CREATOR_ROLES,
  LOYALTY_READ_ONLY_ROLES,
} from './helpers/roles';

test.describe('Configuration - Loyalty Programs', () => {
  for (const role of LOYALTY_CREATOR_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test.beforeEach(async ({ page }) => {
        await gotoUat(page);
      });

      test('creates a visit-based program with one reward', async ({ page }) => {
        await createLoyaltyProgramVisitBased1Reward(page);
      });

      test('creates a transaction-based program with one reward', async ({ page }) => {
        await createLoyaltyProgramTransactionBased1Reward(page);
      });

      test('creates a visit-based program with five rewards', async ({ page }) => {
        await createLoyaltyProgramVisitBased5Rewards(page);
      });

      test('disables Add Reward at the five reward maximum', async ({ page }) => {
        await addRewardButtonDisabledAtMax(page);
      });

      test('rejects an empty visits-per-stamp value', async ({ page }) => {
        await invalidVisitsPerStampEmpty(page);
      });

      test('rejects an empty transaction amount-per-stamp value', async ({ page }) => {
        await invalidAmountPerStampEmpty(page);
      });

      test('rejects an empty program title', async ({ page }) => {
        await invalidLoyaltyTitleEmpty(page);
      });

      test('rejects a program title over 50 characters', async ({ page }) => {
        await invalidLoyaltyTitleTooLong(page);
      });

      test('rejects an empty program description', async ({ page }) => {
        await invalidLoyaltyDescriptionEmpty(page);
      });

      test('rejects a program description over 100 characters', async ({ page }) => {
        await invalidLoyaltyDescriptionTooLong(page);
      });

      test('rejects an empty reward milestone', async ({ page }) => {
        await invalidRewardMilestoneEmpty(page);
      });

      test('rejects an empty reward name', async ({ page }) => {
        await invalidRewardNameEmpty(page);
      });

      test('rejects an empty reward valid-until date', async ({ page }) => {
        await invalidRewardValidUntilEmpty(page);
      });

      test('rejects an empty reward quantity', async ({ page }) => {
        await invalidRewardQuantityEmpty(page);
      });
    });
  }

  for (const role of LOYALTY_READ_ONLY_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test.beforeEach(async ({ page }) => {
        await gotoUat(page);
      });

      test('does not show the create loyalty program button', async ({ page }) => {
        await staffUnableToCreateLoyaltyProgram(page);
      });
    });
  }
});
