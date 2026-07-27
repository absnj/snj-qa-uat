import { test, type Page } from '@playwright/test';
import { HomePage } from '@pages/home/HomePage';
import { DealsPage } from '@pages/configuration/deals/DealsPage';
import { BranchSelection } from '@pages/configuration/deals/create/BranchSelection';
import { DealDetailsStep, type DealDetailsData } from '@pages/configuration/deals/create/manual/DealDetailsStep';
import { generateDealTitle } from '../../testDataGenerators';
import {
  DEAL_CREATOR_ROLES,
  DEAL_READ_ONLY_ROLES,
} from '../helpers/roles';

type DealFormFixtures = {
  dealData: DealDetailsData;
  detailsStep: DealDetailsStep;
};

const formTest = test.extend<DealFormFixtures>({
  dealData: async ({}, use) => {
    await use(validDeal());
  },

  detailsStep: async ({ page }, use) => {
    const branchSelection = new BranchSelection(page);
    await branchSelection.goto();
    const buildOptions = await branchSelection.next();
    const detailsStep = await buildOptions.buildManual();
    await use(detailsStep);
  },
});

function futureDate(daysFromNow: number): string {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function validDeal(overrides: Partial<DealDetailsData> = {}): DealDetailsData {
  return {
    title: generateDealTitle(),
    desc: 'Test deal description',
    fullDesc: 'Full description for an automated UAT deal.',
    keywords: ['uat', 'deal', 'test'],
    startDate: futureDate(7),
    endDate: futureDate(30),
    startHour: '09',
    startMin: '00',
    endHour: '23',
    endMin: '59',
    dealValue: '20',
    minimumSpend: '50',
    currentQuantity: '10',
    terms: 'Valid automated terms and conditions.',
    ...overrides,
  };
}

async function navigateToDeals(page: Page): Promise<DealsPage> {
  const home = new HomePage(page);
  await home.goto();

  const configOverview = await home.goToConfiguration();
  return configOverview.goToDeals();
}

test.describe('Configuration - Deals', () => {
  for (const role of DEAL_CREATOR_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test('shows the deal list', async ({ page }) => {
        await navigateToDeals(page);
      });

      test('creates a deal successfully', async ({ page }) => {
        const dealsPage = await navigateToDeals(page);
        const branchSelection = await dealsPage.openCreateDealForm();

        const dealData = validDeal();

        const buildOptions = await branchSelection.next();
        const detailsStep = await buildOptions.buildManual();
        await detailsStep.fill(dealData);

        const designStep = await detailsStep.next();
        await designStep.submitAndExpectSuccess();
      });
    });
  }

  for (const role of DEAL_CREATOR_ROLES) {
    formTest.describe(`${role.label} validation ${role.tag}`, () => {
      formTest('rejects an empty deal title', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, title: '' });
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectTitleValidationError();
      });

      formTest('rejects a deal title over 50 characters', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, title: 'a'.repeat(51) });
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectTitleValidationError();
      });

      formTest('rejects an empty description', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, desc: '' });
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectDescriptionValidationError();
      });

      formTest('rejects a description over 100 characters', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, desc: 'a'.repeat(101) });
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectDescriptionValidationError();
      });

      formTest('rejects an empty start date', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, startDate: '' });
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectStartDateValidationError();
      });

      formTest('rejects an empty end date', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, endDate: '' });
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectEndDateValidationError();
      });

      formTest('rejects an end date before the start date', async ({ dealData, detailsStep }) => {
        await detailsStep.fill(
          {
            ...dealData,
            startDate: futureDate(30),
            endDate: futureDate(7),
          },
        );
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectEndDateBeforeStartError();
      });

      formTest('rejects an end time before the start time', async ({ dealData, detailsStep }) => {
        await detailsStep.fill(
          {
            ...dealData,
            startDate: dealData.startDate,
            endDate: dealData.startDate,
            startHour: '23',
            startMin: '58',
            endHour: '09',
            endMin: '00',
          },
        );
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectEndTimeBeforeStartError();
      });

      formTest('rejects a zero deal value', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, dealValue: '0' });
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectDealValueValidationError();
      });

      formTest('rejects an empty deal value', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, dealValue: '' });
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectDealValueValidationError();
      });

      formTest('rejects a negative deal value', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, dealValue: '-1' });
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectDealValueValidationError();
      });

      formTest('rejects a zero quantity', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, currentQuantity: '0' });
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectQuantityValidationError();
      });

      formTest('rejects a negative quantity', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, currentQuantity: '-1' });
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectQuantityValidationError();
      });

      formTest('rejects empty terms and conditions', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, terms: undefined });
        await detailsStep.clearTermsAndConditions();
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectTermsRequiredError();
      });

      formTest('rejects a deal value percentage over 100', async ({ dealData, detailsStep }) => {
        await detailsStep.fill({ ...dealData, dealValue: '101' });
        await detailsStep.nextExpectingValidationError();
        await detailsStep.expectPercentageDealValueValidationError();
      });
    });
  }

  for (const role of DEAL_READ_ONLY_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test('shows the deal list', async ({ page }) => {
        await navigateToDeals(page);
      });

      test('does not show the create deal button', async ({ page }) => {
        const dealsPage = await navigateToDeals(page);
        await dealsPage.expectCreateDealUnavailable();
      });
    });
  }
});
