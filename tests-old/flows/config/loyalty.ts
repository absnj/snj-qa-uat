import { Page } from '@playwright/test';
import { generateLoyaltyProgramTitle } from '../utils/testDataGenerators';
import {
  navigateToLoyaltyPrograms,
  navigateToCreateLoyaltyProgram,
  selectMerchant,
  selectAllBranches,
  proceedFromMerchantBranches,
  selectManualBuild,
  selectVisitBased,
  selectTransactionBased,
  fillVisitsPerStamp,
  expectVisitsPerStampError,
  fillAmountPerStamp,
  proceedFromStep1ToStep2,
  attemptProceedFromStep1,
  fillProgramTitle,
  fillProgramDescription,
  proceedFromStep2ToStep3,
  attemptProceedFromStep2,
  addReward,
  fillCurrentReward,
  fillRewardMilestone,
  fillRewardName,
  fillRewardDescription,
  fillRewardValidUntil,
  fillRewardQuantity,
  rewardPaginatorNext,
  rewardPaginatorPrev,
  proceedFromStep3ToStep4,
  attemptProceedFromStep3,
  proceedFromStep4ToStep5,
  submitCreateLoyaltyProgram,
  expectLoyaltyProgramCreatedSuccess,
  expectValidationError,
  expectCreateButtonNotVisible,
  expectAddRewardButtonDisabled,
  fillEndDate,
} from '../../pages/config/LoyaltyPage';
import { fillStartDate } from '../../pages/config/DealsPage';

// ---------------------------------------------------------------------------
// Test data defaults
// ---------------------------------------------------------------------------

const DEFAULTS = {
  programTitle: () => generateLoyaltyProgramTitle(),
  description: 'Test loyalty program description',
  visitsPerStamp: '1',
  amountPerStamp: '10',
  rewardMilestone: '10',
  rewardName: 'Test Reward',
  rewardDescription: 'Test reward description',
  rewardValidUntil: '2026-12-31',
  rewardQuantity: '1000',
};

// ---------------------------------------------------------------------------
// Shared setup helpers
// ---------------------------------------------------------------------------

async function completeMerchantBranchesScreen(page: Page): Promise<void> {
  // TODO: confirm whether merchant is pre-filled or requires explicit selection: some conditionals to enforce this perhaps.
  await proceedFromMerchantBranches(page);
}

async function fillStep1VisitBased(page: Page): Promise<void> {
  await selectVisitBased(page);
  await fillVisitsPerStamp(page, DEFAULTS.visitsPerStamp);
}

async function fillStep1TransactionBased(page: Page): Promise<void> {
  await selectTransactionBased(page);
  await fillAmountPerStamp(page, DEFAULTS.amountPerStamp);
}

async function fillStep2Defaults(page: Page): Promise<void> {
  await fillProgramTitle(page, DEFAULTS.programTitle());
  await fillProgramDescription(page, DEFAULTS.description);
  await fillStartDate(page, '2024-01-01');
  await fillEndDate(page, '2024-12-31');
}

async function fillOneReward(page: Page): Promise<void> {
  // Reward 1 is present by default on step 3 entry — no Add Reward needed
  await fillCurrentReward(
    page,
    DEFAULTS.rewardName,
    DEFAULTS.rewardMilestone,
    DEFAULTS.rewardDescription,
    DEFAULTS.rewardValidUntil,
    DEFAULTS.rewardQuantity,
  );
}

async function fillFiveRewards(page: Page): Promise<void> {
  // Step 1: create all 5 reward slots first by clicking Add Reward 4 times.
  // Each click auto-navigates to the newly created reward page.
  // We are now on reward 5 after the 4th click.
  for (let i = 0; i < 4; i++) {
    await addReward(page);
  }

  // Step 2: navigate back to reward 1 via Prev x4
  for (let i = 0; i < 4; i++) {
    await rewardPaginatorPrev(page);
  }

  // Step 3: fill each reward in order, navigating forward via paginator Next
  for (let i = 1; i <= 5; i++) {
    await fillCurrentReward(
      page,
      `${DEFAULTS.rewardName} ${i}`,
      DEFAULTS.rewardMilestone,
      DEFAULTS.rewardDescription,
      DEFAULTS.rewardValidUntil,
      DEFAULTS.rewardQuantity,
    );
    if (i < 5) {
      await rewardPaginatorNext(page);
    }
  }
}

// ---------------------------------------------------------------------------
// Reach-step helpers
// ---------------------------------------------------------------------------

async function reachStep1(page: Page): Promise<void> {
  await navigateToCreateLoyaltyProgram(page);
  await completeMerchantBranchesScreen(page);
  await selectManualBuild(page);
}

async function reachStep2VisitBased(page: Page): Promise<void> {
  await reachStep1(page);
  await fillStep1VisitBased(page);
  await proceedFromStep1ToStep2(page);
}

async function reachStep3VisitBased(page: Page): Promise<void> {
  await reachStep2VisitBased(page);
  await fillStep2Defaults(page);
  await proceedFromStep2ToStep3(page);
}

async function reachStep4VisitBased(page: Page): Promise<void> {
  await reachStep3VisitBased(page);
  await fillOneReward(page);
  await proceedFromStep3ToStep4(page);
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

export async function createLoyaltyProgramVisitBased1Reward(page: Page): Promise<void> {
  await reachStep1(page);
  await fillStep1VisitBased(page);
  await proceedFromStep1ToStep2(page);
  await fillStep2Defaults(page);
  await proceedFromStep2ToStep3(page);
  await fillOneReward(page);
  await proceedFromStep3ToStep4(page);
  await proceedFromStep4ToStep5(page);
  await submitCreateLoyaltyProgram(page);
  await expectLoyaltyProgramCreatedSuccess(page);
}

export async function createLoyaltyProgramTransactionBased1Reward(page: Page): Promise<void> {
  await reachStep1(page);
  await fillStep1TransactionBased(page);
  await proceedFromStep1ToStep2(page);
  await fillStep2Defaults(page);
  await proceedFromStep2ToStep3(page);
  await fillOneReward(page);
  await proceedFromStep3ToStep4(page);
  await proceedFromStep4ToStep5(page);
  await submitCreateLoyaltyProgram(page);
  await expectLoyaltyProgramCreatedSuccess(page);
}

export async function createLoyaltyProgramVisitBased5Rewards(page: Page): Promise<void> {
  await reachStep1(page);
  await fillStep1VisitBased(page);
  await proceedFromStep1ToStep2(page);
  await fillStep2Defaults(page);
  await proceedFromStep2ToStep3(page);
  await fillFiveRewards(page);
  await proceedFromStep3ToStep4(page);
  await proceedFromStep4ToStep5(page);
  await submitCreateLoyaltyProgram(page);
  await expectLoyaltyProgramCreatedSuccess(page);
}

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

export async function staffUnableToCreateLoyaltyProgram(page: Page): Promise<void> {
  await navigateToLoyaltyPrograms(page);
  await expectCreateButtonNotVisible(page);
}

// ---------------------------------------------------------------------------
// Reward limit
// ---------------------------------------------------------------------------

export async function addRewardButtonDisabledAtMax(page: Page): Promise<void> {
  await reachStep3VisitBased(page);
  // Create all 5 reward slots
  for (let i = 0; i < 4; i++) {
    await addReward(page);
  }
  // Now at 5/5 — Add Reward should be disabled
  await expectAddRewardButtonDisabled(page);
}

// ---------------------------------------------------------------------------
// Step 1 validation — Program Setup
// ---------------------------------------------------------------------------

export async function invalidVisitsPerStampEmpty(page: Page): Promise<void> {
  await reachStep1(page);
  await selectVisitBased(page);
  await fillAmountPerStamp(page, '0');
  await attemptProceedFromStep1(page);
  await expectVisitsPerStampError(page);
}

export async function invalidAmountPerStampEmpty(page: Page): Promise<void> {
  await reachStep1(page);
  await selectTransactionBased(page);
  await fillAmountPerStamp(page, '0');
  await attemptProceedFromStep1(page);
  await expectValidationError(page);
}

// ---------------------------------------------------------------------------
// Step 2 validation — General Details
// ---------------------------------------------------------------------------

export async function invalidLoyaltyTitleEmpty(page: Page): Promise<void> {
  await reachStep2VisitBased(page);
  await fillProgramDescription(page, DEFAULTS.description);
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidLoyaltyTitleTooLong(page: Page): Promise<void> {
  await reachStep2VisitBased(page);
  await fillProgramTitle(page, 'a'.repeat(51)); // exceeds 50 char limit
  await fillProgramDescription(page, DEFAULTS.description);
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidLoyaltyDescriptionEmpty(page: Page): Promise<void> {
  await reachStep2VisitBased(page);
  await fillProgramTitle(page, DEFAULTS.programTitle());
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidLoyaltyDescriptionTooLong(page: Page): Promise<void> {
  await reachStep2VisitBased(page);
  await fillProgramTitle(page, DEFAULTS.programTitle());
  await fillProgramDescription(page, 'a'.repeat(101)); // exceeds 100 char limit
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ---------------------------------------------------------------------------
// Step 3 validation — Rewards Configuration
// ---------------------------------------------------------------------------

export async function invalidRewardMilestoneEmpty(page: Page): Promise<void> {
  await reachStep3VisitBased(page);
  await fillRewardName(page, DEFAULTS.rewardName);
  await fillRewardDescription(page, DEFAULTS.rewardDescription);
  await fillRewardValidUntil(page, DEFAULTS.rewardValidUntil);
  await fillRewardQuantity(page, DEFAULTS.rewardQuantity);
  // Leave milestone empty
  await attemptProceedFromStep3(page);
  await expectValidationError(page);
}

export async function invalidRewardNameEmpty(page: Page): Promise<void> {
  await reachStep3VisitBased(page);
  await fillRewardMilestone(page, DEFAULTS.rewardMilestone);
  await fillRewardDescription(page, DEFAULTS.rewardDescription);
  await fillRewardValidUntil(page, DEFAULTS.rewardValidUntil);
  await fillRewardQuantity(page, DEFAULTS.rewardQuantity);
  // Leave reward name empty
  await attemptProceedFromStep3(page);
  await expectValidationError(page);
}

export async function invalidRewardValidUntilEmpty(page: Page): Promise<void> {
  await reachStep3VisitBased(page);
  await fillRewardMilestone(page, DEFAULTS.rewardMilestone);
  await fillRewardName(page, DEFAULTS.rewardName);
  await fillRewardDescription(page, DEFAULTS.rewardDescription);
  await fillRewardQuantity(page, DEFAULTS.rewardQuantity);
  // Leave valid until empty
  await attemptProceedFromStep3(page);
  await expectValidationError(page);
}

export async function invalidRewardQuantityEmpty(page: Page): Promise<void> {
  await reachStep3VisitBased(page);
  await fillRewardMilestone(page, DEFAULTS.rewardMilestone);
  await fillRewardName(page, DEFAULTS.rewardName);
  await fillRewardDescription(page, DEFAULTS.rewardDescription);
  await fillRewardValidUntil(page, DEFAULTS.rewardValidUntil);
  // Leave quantity empty
  await attemptProceedFromStep3(page);
  await expectValidationError(page);
}