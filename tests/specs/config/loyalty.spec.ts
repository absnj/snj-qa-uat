import { test } from '@playwright/test';
import { HomePage } from '@pages/home/HomePage';
import { LoyaltyPage } from '@pages/configuration/loyalty/LoyaltyPage';
import { LoyaltyBuilder } from '@pages/configuration/loyalty/create/LoyaltyBuilder';
import {
  DEFAULT_PROGRAM_CONFIGURATION,
  LoyaltyStudio,
  MAXIMUM_REWARDS,
  type LoyaltyGeneralDetailsData,
  type RewardData,
} from '@pages/configuration/loyalty/create/manual/LoyaltyStudio';
import {
  LOYALTY_CREATOR_ROLES,
  LOYALTY_READ_ONLY_ROLES,
} from '../helpers/roles';

const VALID_TERMS = 'Valid automated loyalty terms and conditions.';

type LoyaltyFixtures = {
  loyaltyData: LoyaltyGeneralDetailsData;
  rewardData: RewardData;
  loyaltyPage: LoyaltyPage;
  openStudio: LoyaltyStudio;
  studio: LoyaltyStudio;
};

const formTest = test.extend<LoyaltyFixtures>({
  loyaltyData: async ({}, use) => {
    await use(LoyaltyStudio.validGeneralDetails());
  },

  rewardData: async ({}, use) => {
    await use(LoyaltyStudio.validReward());
  },

  loyaltyPage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.goto();

    const configOverview = await home.goToConfiguration();
    const loyaltyPage = await configOverview.goToLoyaltyPrograms();
    await use(loyaltyPage);
  },

  openStudio: async ({ page }, use) => {
    const builder = new LoyaltyBuilder(page);
    await builder.goto();
    const studio = await builder.buildManual();
    await use(studio);
  },

  studio: async ({ openStudio, loyaltyData, rewardData }, use) => {
    await openStudio.fillProgramConfiguration(DEFAULT_PROGRAM_CONFIGURATION);
    await openStudio.fillGeneralDetails(loyaltyData);
    await openStudio.fillTerms({ terms: VALID_TERMS });
    await openStudio.openRewardsSection();
    await openStudio.fillReward(1, rewardData);

    await use(openStudio);
  },
});

test.describe('Configuration - Loyalty Programs', () => {
  for (const role of LOYALTY_CREATOR_ROLES) {
    formTest.describe(`${role.label} ${role.tag}`, () => {
      formTest('creates a visit-based program with one reward', async ({ studio }) => {
        await studio.submitAndExpectSuccess();
      });

      formTest(
        'creates a spend-based program with one reward',
        async ({ loyaltyData, rewardData, openStudio }) => {
          await openStudio.fillProgramConfiguration({ earnType: 'Spend', perStamp: '10' });
          await openStudio.fillGeneralDetails(loyaltyData);
          await openStudio.fillTerms({ terms: VALID_TERMS });
          await openStudio.openRewardsSection();
          await openStudio.fillReward(1, rewardData);

          await openStudio.submitAndExpectSuccess();
        },
      );

      formTest(
        'creates a visit-based program with five rewards',
        async ({ rewardData, studio }) => {
          await studio.fillRewards(rewardData, MAXIMUM_REWARDS);

          await studio.submitAndExpectSuccess();
        },
      );

      formTest(
        'disables Add reward at the five reward maximum',
        async ({ studio }) => {
          await studio.addRewardsUntilMaximum();
          await studio.expectRewardCount(MAXIMUM_REWARDS);
          await studio.expectAddRewardDisabled();
        },
      );

      formTest(
        'rejects a zero visits-per-stamp value',
        async ({ studio }) => {
          await studio.openDetailsSection();
          await studio.fillPerStamp('0');
          await studio.submitExpectingValidationError();
          await studio.expectPerStampValidationError();
        },
      );

      formTest(
        'rejects a zero spend-per-stamp value',
        async ({ studio }) => {
          await studio.openDetailsSection();
          await studio.selectEarnType('Spend');
          await studio.fillPerStamp('0');
          await studio.submitExpectingValidationError();
          await studio.expectPerStampValidationError();
        },
      );

      formTest('rejects an empty program title', async ({ studio }) => {
        await studio.openDetailsSection();
        await studio.fillProgramTitle('');
        await studio.submitExpectingValidationError();
        await studio.expectTitleValidationError();
      });

      formTest(
        'rejects a program title over 50 characters',
        async ({ studio }) => {
          await studio.openDetailsSection();
          await studio.fillProgramTitle('a'.repeat(51));
          await studio.submitExpectingValidationError();
          await studio.expectTitleValidationError();
        },
      );

      formTest(
        'rejects an empty program description',
        async ({ studio }) => {
          await studio.openDetailsSection();
          await studio.fillDescription('');
          await studio.submitExpectingValidationError();
          await studio.expectDescriptionValidationError();
        },
      );

      formTest(
        'rejects a program description over 100 characters',
        async ({ studio }) => {
          await studio.openDetailsSection();
          await studio.fillDescription('a'.repeat(101));
          await studio.submitExpectingValidationError();
          await studio.expectDescriptionValidationError();
        },
      );

      formTest(
        'rejects empty terms and conditions',
        async ({ studio }) => {
          await studio.openDetailsSection();
          await studio.clearTermsAndConditions();
          await studio.submitExpectingValidationError();
          await studio.expectTermsRequiredError();
        },
      );

      formTest(
        'rejects an empty reward name',
        async ({ rewardData, studio }) => {
          await studio.fillRewardExcept(1, rewardData, 'name');
          await studio.submitExpectingValidationError();
          await studio.expectRewardNameValidationError(1);
        },
      );

      formTest(
        'rejects an empty reward description',
        async ({ rewardData, studio }) => {
          await studio.fillRewardExcept(1, rewardData, 'description');
          await studio.submitExpectingValidationError();
          await studio.expectRewardDescriptionValidationError(1);
        },
      );

      formTest(
        'rejects an empty reward valid-until date',
        async ({ rewardData, studio }) => {
          await studio.fillRewardExcept(1, rewardData, 'validUntil');
          await studio.submitExpectingValidationError();
          await studio.expectRewardValidUntilValidationError(1);
        },
      );

      formTest(
        'accepts an empty reward quantity',
        async ({ rewardData, studio }) => {
          await studio.fillRewardExcept(1, rewardData, 'quantity');
          await studio.submitAndExpectSuccess();
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
