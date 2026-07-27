import { test } from '@playwright/test';
import { HomePage } from '@pages/home/HomePage';
import { LoyaltyPage } from '@pages/configuration/loyalty/LoyaltyPage';
import { LoyaltyBranchSelection } from '@pages/configuration/loyalty/create/LoyaltyBranchSelection';
import {
  DEFAULT_PROGRAM_CONFIGURATION,
  LoyaltyDetailsStep,
  type LoyaltyGeneralDetailsData,
  type RewardData,
} from '@pages/configuration/loyalty/create/manual/LoyaltyDetailsStep';
import {
  LOYALTY_CREATOR_ROLES,
  LOYALTY_READ_ONLY_ROLES,
} from '../helpers/roles';

type LoyaltyFixtures = {
  loyaltyData: LoyaltyGeneralDetailsData;
  rewardData: RewardData;
  loyaltyPage: LoyaltyPage;
  openDetailsStep: LoyaltyDetailsStep;
  detailsStep: LoyaltyDetailsStep;
};

const formTest = test.extend<LoyaltyFixtures>({
  loyaltyData: async ({}, use) => {
    await use(LoyaltyDetailsStep.validGeneralDetails());
  },

  rewardData: async ({}, use) => {
    await use(LoyaltyDetailsStep.validReward());
  },

  loyaltyPage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.goto();

    const configOverview = await home.goToConfiguration();
    const loyaltyPage = await configOverview.goToLoyaltyPrograms();
    await use(loyaltyPage);
  },

  openDetailsStep: async ({ page }, use) => {
    const branchSelection = new LoyaltyBranchSelection(page);
    await branchSelection.goto();
    const buildOptions = await branchSelection.next();
    const detailsStep = await buildOptions.buildManual();
    await use(detailsStep);
  },

  detailsStep: async ({ openDetailsStep, loyaltyData, rewardData }, use) => {
    await openDetailsStep.fillProgramConfiguration(DEFAULT_PROGRAM_CONFIGURATION);
    await openDetailsStep.fillGeneralDetails(loyaltyData);
    await openDetailsStep.fillCurrentReward(rewardData);
    await openDetailsStep.fillTerms({ terms: 'Valid automated loyalty terms and conditions.' });

    await use(openDetailsStep);
  },
});

test.describe('Configuration - Loyalty Programs', () => {
  for (const role of LOYALTY_CREATOR_ROLES) {
    formTest.describe(`${role.label} ${role.tag}`, () => {
      formTest('creates a visit-based program with one reward', async ({ detailsStep }) => {
        const designStep = await detailsStep.next();
        await designStep.submitAndExpectSuccess();
      });

      formTest(
        'creates a transaction-based program with one reward',
        async ({ loyaltyData, rewardData, openDetailsStep }) => {
          await openDetailsStep.selectProgramType('Transaction-Based (Spending');
          await openDetailsStep.fillAmountPerStamp('10');
          await openDetailsStep.fillGeneralDetails(loyaltyData);
          await openDetailsStep.fillCurrentReward(rewardData);
          await openDetailsStep.fillTerms({ terms: 'Valid automated loyalty terms and conditions.' });

          const designStep = await openDetailsStep.next();
          await designStep.submitAndExpectSuccess();
        },
      );

      formTest(
        'creates a visit-based program with five rewards',
        async ({ rewardData, detailsStep }) => {
          await detailsStep.fillRewards(rewardData, 5);

          const designStep = await detailsStep.next();
          await designStep.submitAndExpectSuccess();
        },
      );

      formTest(
        'disables Add Reward at the five reward maximum',
        async ({ detailsStep }) => {
          await detailsStep.addRewardsUntilMaximum();
          await detailsStep.expectAddRewardDisabled();
        },
      );

      formTest(
        'rejects an empty visits-per-stamp value',
        async ({ openDetailsStep }) => {
          await openDetailsStep.fillProgramConfiguration({
            ...DEFAULT_PROGRAM_CONFIGURATION,
            visitsPerStamp: '0',
          });
          await openDetailsStep.expectVisitsPerStampValidationError();
        },
      );

      formTest(
        'rejects an empty transaction amount-per-stamp value',
        async ({ openDetailsStep }) => {
          await openDetailsStep.selectProgramType('Transaction-Based (Spending');
          await openDetailsStep.fillAmountPerStamp('0');
          await openDetailsStep.expectAmountPerStampValidationError();
        },
      );

      formTest('rejects an empty program title', async ({ loyaltyData, detailsStep }) => {
        await detailsStep.fillProgramTitle('');
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectTitleValidationError();
      });

      formTest(
        'rejects a program title over 50 characters',
        async ({ detailsStep }) => {
          await detailsStep.fillProgramTitle('a'.repeat(51));
          await detailsStep.nextExpectingValidationError();
          await detailsStep.expectTitleValidationError();
        },
      );

      formTest(
        'rejects an empty program description',
        async ({ detailsStep }) => {
          await detailsStep.fillDescription('');
          await detailsStep.nextExpectingValidationError();
          await detailsStep.expectDescriptionValidationError();
        },
      );

      formTest(
        'rejects a program description over 100 characters',
        async ({ detailsStep }) => {
          await detailsStep.fillDescription('a'.repeat(101));
          await detailsStep.nextExpectingValidationError();
          await detailsStep.expectDescriptionValidationError();
        },
      );

      formTest(
        'rejects an empty reward milestone',
        async ({ rewardData, detailsStep }) => {
          await detailsStep.fillCurrentRewardExcept(rewardData, 'milestone');
          await detailsStep.nextExpectingValidationError();
          await detailsStep.expectRewardMilestoneValidationError();
        },
      );

      formTest(
        'rejects an empty reward name',
        async ({ rewardData, detailsStep }) => {
          await detailsStep.fillCurrentRewardExcept(rewardData, 'name');
          await detailsStep.nextExpectingValidationError();
          await detailsStep.expectRewardNameValidationError();
        },
      );

      formTest(
        'rejects an empty reward valid-until date',
        async ({ rewardData, detailsStep }) => {
          await detailsStep.fillCurrentRewardExcept(rewardData, 'validUntil');
          await detailsStep.nextExpectingValidationError();
          await detailsStep.expectRewardValidUntilValidationError();
        },
      );

      formTest(
        'accepts an empty reward quantity',
        async ({ rewardData, detailsStep }) => {
          await detailsStep.fillCurrentRewardExcept(rewardData, 'quantity');
          const designStep = await detailsStep.next();
          await designStep.submitAndExpectSuccess();
        },
      );
    });
  }

  for (const role of LOYALTY_READ_ONLY_ROLES) {
    formTest.describe(`${role.label} ${role.tag}`, () => {
      formTest('does not show the create loyalty program button', async ({ loyaltyPage }) => {
        await loyaltyPage.expectCreateLoyaltyUnavailable();
      });
    });
  }
});
