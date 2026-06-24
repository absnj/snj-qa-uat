import { test } from '@playwright/test';
import { HomePage } from '@pages/home/HomePage';
import { LoyaltyPage } from '@pages/configuration/loyalty/LoyaltyPage';
import { LoyaltyBranchSelection } from '@pages/configuration/loyalty/create/LoyaltyBranchSelection';
import {
  DEFAULT_PROGRAM_CONFIGURATION,
  ProgramConfigurationStep,
} from '@pages/configuration/loyalty/create/manual/ProgramConfigurationStep';
import {
  LoyaltyGeneralDetailsStep,
  type LoyaltyGeneralDetailsData,
} from '@pages/configuration/loyalty/create/manual/LoyaltyGeneralDetailsStep';
import {
  RewardsConfigurationStep,
  type RewardData,
} from '@pages/configuration/loyalty/create/manual/RewardsConfigurationStep';
import { LoyaltyTncStep } from '@pages/configuration/loyalty/create/manual/LoyaltyTncStep';
import { LoyaltyPreviewStep } from '@pages/configuration/loyalty/create/manual/LoyaltyPreviewStep';
import {
  LOYALTY_CREATOR_ROLES,
  LOYALTY_READ_ONLY_ROLES,
} from '../helpers/roles';

type LoyaltyFixtures = {
  loyaltyData: LoyaltyGeneralDetailsData;
  rewardData: RewardData;
  loyaltyPage: LoyaltyPage;
  branchSelection: LoyaltyBranchSelection;
  programConfigurationStep: ProgramConfigurationStep;
  generalDetailsStep: LoyaltyGeneralDetailsStep;
  rewardsConfigurationStep: RewardsConfigurationStep;
  tncStep: LoyaltyTncStep;
  previewStep: LoyaltyPreviewStep;
};

const formTest = test.extend<LoyaltyFixtures>({
  loyaltyData: async ({}, use) => {
    await use(LoyaltyGeneralDetailsStep.validData());
  },

  rewardData: async ({}, use) => {
    await use(RewardsConfigurationStep.validData());
  },

  loyaltyPage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.goto();

    const configOverview = await home.goToConfiguration();
    const loyaltyPage = await configOverview.goToLoyaltyPrograms();
    await use(loyaltyPage);
  },

  branchSelection: async ({ page }, use) => {
    const branchSelection = new LoyaltyBranchSelection(page);
    await branchSelection.goto(); 
    await use(branchSelection);
  },

  programConfigurationStep: async ({ branchSelection }, use) => {
    const buildOptions = await branchSelection.next();
    const programConfigurationStep = await buildOptions.buildManual();
    await use(programConfigurationStep);
  },

  generalDetailsStep: async ({ programConfigurationStep }, use) => {
    await programConfigurationStep.fill(DEFAULT_PROGRAM_CONFIGURATION);
    const generalDetailsStep = await programConfigurationStep.next();
    await use(generalDetailsStep);
  },

  rewardsConfigurationStep: async ({ loyaltyData, generalDetailsStep }, use) => {
    await generalDetailsStep.fill(loyaltyData);
    const rewardsConfigurationStep = await generalDetailsStep.next();
    await use(rewardsConfigurationStep);
  },

  tncStep: async ({ rewardData, rewardsConfigurationStep }, use) => {
    await rewardsConfigurationStep.fillCurrentReward(rewardData);
    const tncStep = await rewardsConfigurationStep.next();
    await use(tncStep);
  },

  previewStep: async ({ tncStep }, use) => {
    await tncStep.fill({ terms: 'Valid automated loyalty terms and conditions.' });
    const previewStep = await tncStep.next();
    await use(previewStep);
  },
});

test.describe('Configuration - Loyalty Programs', () => {
  for (const role of LOYALTY_CREATOR_ROLES) {
    formTest.describe(`${role.label} ${role.tag}`, () => {
      formTest('creates a visit-based program with one reward', async ({ previewStep }) => {
        await previewStep.submitAndExpectSuccess();
      });

      formTest(
        'creates a transaction-based program with one reward',
        async ({ loyaltyData, rewardData, programConfigurationStep }) => {
          await programConfigurationStep.selectProgramType('Transaction-Based (Spending');
          await programConfigurationStep.selectDisplayType(DEFAULT_PROGRAM_CONFIGURATION.displayType);
          await programConfigurationStep.fillAmountPerStamp('10');

          const generalDetailsStep = await programConfigurationStep.next();
          await generalDetailsStep.fill(loyaltyData);

          const rewardsConfigurationStep = await generalDetailsStep.next();
          await rewardsConfigurationStep.fillCurrentReward(rewardData);

          const tncStep = await rewardsConfigurationStep.next();
          await tncStep.fill({ terms: 'Valid automated loyalty terms and conditions.' });

          const previewStep = await tncStep.next();
          await previewStep.submitAndExpectSuccess();
        },
      );

      formTest(
        'creates a visit-based program with five rewards',
        async ({ rewardData, rewardsConfigurationStep }) => {
          await rewardsConfigurationStep.fillRewards(rewardData, 5);

          const tncStep = await rewardsConfigurationStep.next();
          await tncStep.fill({ terms: 'Valid automated loyalty terms and conditions.' });

          const previewStep = await tncStep.next();
          await previewStep.submitAndExpectSuccess();
        },
      );

      formTest(
        'disables Add Reward at the five reward maximum',
        async ({ rewardsConfigurationStep }) => {
          await rewardsConfigurationStep.addRewardsUntilMaximum();
          await rewardsConfigurationStep.expectAddRewardDisabled();
        },
      );

      formTest(
        'rejects an empty visits-per-stamp value',
        async ({ programConfigurationStep }) => {
          await programConfigurationStep.fill({
            ...DEFAULT_PROGRAM_CONFIGURATION,
            visitsPerStamp: '0',
          });
          await programConfigurationStep.expectVisitsPerStampValidationError();
        },
      );

      formTest(
        'rejects an empty transaction amount-per-stamp value',
        async ({ programConfigurationStep }) => {
          await programConfigurationStep.selectProgramType('Transaction-Based (Spending');
          await programConfigurationStep.selectDisplayType(DEFAULT_PROGRAM_CONFIGURATION.displayType);
          await programConfigurationStep.fillAmountPerStamp('0');
          await programConfigurationStep.expectAmountPerStampValidationError();
        },
      );

      formTest('rejects an empty program title', async ({ loyaltyData, generalDetailsStep }) => {
        await generalDetailsStep.fill({ ...loyaltyData, title: '' });
        await generalDetailsStep.nextExpectingValidationError();
        await generalDetailsStep.expectTitleValidationError();
      });

      formTest(
        'rejects a program title over 50 characters',
        async ({ loyaltyData, generalDetailsStep }) => {
          await generalDetailsStep.fill({ ...loyaltyData, title: 'a'.repeat(51) });
          await generalDetailsStep.nextExpectingValidationError();
          await generalDetailsStep.expectTitleValidationError();
        },
      );

      formTest(
        'rejects an empty program description',
        async ({ loyaltyData, generalDetailsStep }) => {
          await generalDetailsStep.fill({ ...loyaltyData, description: '' });
          await generalDetailsStep.nextExpectingValidationError();
          await generalDetailsStep.expectDescriptionValidationError();
        },
      );

      formTest(
        'rejects a program description over 100 characters',
        async ({ loyaltyData, generalDetailsStep }) => {
          await generalDetailsStep.fill({ ...loyaltyData, description: 'a'.repeat(101) });
          await generalDetailsStep.nextExpectingValidationError();
          await generalDetailsStep.expectDescriptionValidationError();
        },
      );

      formTest(
        'rejects an empty reward milestone',
        async ({ rewardData, rewardsConfigurationStep }) => {
          await rewardsConfigurationStep.fillCurrentRewardExcept(rewardData, 'milestone');
          await rewardsConfigurationStep.nextExpectingValidationError();
          await rewardsConfigurationStep.expectRewardMilestoneValidationError();
        },
      );

      formTest(
        'rejects an empty reward name',
        async ({ rewardData, rewardsConfigurationStep }) => {
          await rewardsConfigurationStep.fillCurrentRewardExcept(rewardData, 'name');
          await rewardsConfigurationStep.nextExpectingValidationError();
          await rewardsConfigurationStep.expectRewardNameValidationError();
        },
      );

      formTest(
        'rejects an empty reward valid-until date',
        async ({ rewardData, rewardsConfigurationStep }) => {
          await rewardsConfigurationStep.fillCurrentRewardExcept(rewardData, 'validUntil');
          await rewardsConfigurationStep.nextExpectingValidationError();
          await rewardsConfigurationStep.expectRewardValidUntilValidationError();
        },
      );

      formTest(
        'rejects an empty reward quantity',
        async ({ rewardData, rewardsConfigurationStep }) => {
          await rewardsConfigurationStep.fillCurrentRewardExcept(rewardData, 'quantity');
          await rewardsConfigurationStep.nextExpectingValidationError();
          await rewardsConfigurationStep.expectRewardQuantityValidationError();
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
