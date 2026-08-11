import { test, type Page } from '@playwright/test';
import { HomePage } from '@pages/home/HomePage';
import { DealsPage } from '@pages/configuration/deals/DealsPage';
import { DealBuilder } from '@pages/configuration/deals/create/DealBuilder';
import { DealStudio, type DealDetailsData } from '@pages/configuration/deals/create/manual/DealStudio';
import { generateDealTitle } from '../../testDataGenerators';
import {
  DEAL_CREATOR_ROLES,
  DEAL_READ_ONLY_ROLES,
} from '../helpers/roles';

type DealFormFixtures = {
  dealData: DealDetailsData;
  studio: DealStudio;
};

const formTest = test.extend<DealFormFixtures>({
  dealData: async ({}, use) => {
    await use(validDeal());
  },

  studio: async ({ page }, use) => {
    const builder = new DealBuilder(page);
    await builder.goto();
    const studio = await builder.buildManual();
    await use(studio);
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
        const builder = await dealsPage.openCreateDealForm();
        const studio = await builder.buildManual();

        await studio.fill(validDeal());
        await studio.submitAndExpectSuccess();
      });
    });
  }

  for (const role of DEAL_CREATOR_ROLES) {
    formTest.describe(`${role.label} validation ${role.tag}`, () => {
      formTest('rejects an empty deal title', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, title: '' });
        await studio.submitExpectingValidationError();
        await studio.expectTitleValidationError();
      });

      formTest('rejects a deal title over 50 characters', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, title: 'a'.repeat(51) });
        await studio.submitExpectingValidationError();
        await studio.expectTitleValidationError();
      });

      formTest('rejects an empty description', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, desc: '' });
        await studio.submitExpectingValidationError();
        await studio.expectDescriptionValidationError();
      });

      formTest('rejects a description over 100 characters', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, desc: 'a'.repeat(101) });
        await studio.submitExpectingValidationError();
        await studio.expectDescriptionValidationError();
      });

      formTest('rejects an empty start date', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, startDate: '' });
        await studio.submitExpectingValidationError();
        await studio.expectStartDateValidationError();
      });

      formTest('rejects an empty end date', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, endDate: '' });
        await studio.submitExpectingValidationError();
        await studio.expectEndDateValidationError();
      });

      formTest('rejects an end date before the start date', async ({ dealData, studio }) => {
        await studio.fill(
          {
            ...dealData,
            startDate: futureDate(30),
            endDate: futureDate(7),
          },
        );
        await studio.submitExpectingValidationError();
        await studio.expectEndDateValidationError();
      });

      formTest('rejects an end time before the start time', async ({ dealData, studio }) => {
        await studio.fill(
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
        await studio.submitExpectingValidationError();
        await studio.expectEndDateValidationError();
      });

      formTest('rejects a zero deal value', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, dealValue: '0' });
        await studio.submitExpectingValidationError();
        await studio.expectDealValueValidationError();
      });

      formTest('rejects an empty deal value', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, dealValue: '' });
        await studio.submitExpectingValidationError();
        await studio.expectDealValueValidationError();
      });

      formTest('rejects a negative deal value', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, dealValue: '-1' });
        await studio.submitExpectingValidationError();
        await studio.expectDealValueValidationError();
      });

      formTest('rejects a zero quantity', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, currentQuantity: '0' });
        await studio.submitExpectingValidationError();
        await studio.expectQuantityValidationError();
      });

      formTest('rejects a negative quantity', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, currentQuantity: '-1' });
        await studio.submitExpectingValidationError();
        await studio.expectQuantityValidationError();
      });

      formTest('rejects empty terms and conditions', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, terms: undefined });
        await studio.clearTermsAndConditions();
        await studio.submitExpectingValidationError();
        await studio.expectTermsRequiredError();
      });

      formTest('rejects a deal value percentage over 100', async ({ dealData, studio }) => {
        await studio.fill({ ...dealData, dealValue: '101' });
        await studio.submitExpectingValidationError();
        await studio.expectDealValueValidationError();
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
