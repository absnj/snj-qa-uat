import { test, type Page } from '@playwright/test';
import { HomePage } from '@pages/home/HomePage';
import { DealsPage } from '@pages/configuration/deals/DealsPage';
import { BranchSelection } from '@pages/configuration/deals/create/BranchSelection';
import { GeneralDetailsStep } from '@pages/configuration/deals/create/manual/GeneralDetailsStep';
import { DateTimeStep } from '@pages/configuration/deals/create/manual/DateTimeStep';
import { AmountStep } from '@pages/configuration/deals/create/manual/AmountStep';
import { TncStep } from '@pages/configuration/deals/create/manual/TncStep';
import { PreviewStep } from '@pages/configuration/deals/create/manual/PreviewStep';
import { generateDealTitle } from '../../testDataGenerators';
import {
  DEAL_CREATOR_ROLES,
  DEAL_READ_ONLY_ROLES,
} from '../helpers/roles';

type DealData = {
  title: string;
  desc: string;
  fullDesc: string;
  keywords: string[];
  startDate: string;
  endDate: string;
  startHour: string;
  startMin: string;
  endHour: string;
  endMin: string;
  dealValue: string;
  minimumSpend: string;
  currentQuantity: string;
  terms: string;
};

type DealFormFixtures = {
  dealData: DealData;
  branchSelection: BranchSelection;
  generalDetailsStep: GeneralDetailsStep;
  dateTimeStep: DateTimeStep;
  amountStep: AmountStep;
  tncStep: TncStep;
  previewStep: PreviewStep;
};

const formTest = test.extend<DealFormFixtures>({
  dealData: async ({}, use) => {
    await use(validDeal());
  },

  branchSelection: async ({ page }, use) => {
    const branchSelection = new BranchSelection(page);
    await branchSelection.goto();
    await use(branchSelection);
  },

  generalDetailsStep: async ({ branchSelection }, use) => {
    const buildOptions = await branchSelection.next();
    const generalDetailsStep = await buildOptions.buildManual();
    await use(generalDetailsStep);
  },

  dateTimeStep: async ({ dealData, generalDetailsStep }, use) => {
    await generalDetailsStep.fill(dealData);
    const dateTimeStep = await generalDetailsStep.next();
    await use(dateTimeStep);
  },

  amountStep: async ({ dealData, dateTimeStep }, use) => {
    await dateTimeStep.fill(dealData);
    const amountStep = await dateTimeStep.next();
    await use(amountStep);
  },

  tncStep: async ({ dealData, amountStep }, use) => {
    await amountStep.fill(dealData);
    const tncStep = await amountStep.next();
    await use(tncStep);
  },

  previewStep: async ({ dealData, tncStep }, use) => {
    await tncStep.fill({ terms: dealData.terms });
    const previewStep = await tncStep.next();
    await use(previewStep);
  },
});

function futureDate(daysFromNow: number): string {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function validDeal(overrides: Partial<DealData> = {}): DealData {
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
        const generalDetailsStep = await buildOptions.buildManual();
        await generalDetailsStep.fill(dealData);

        const dateTimeStep = await generalDetailsStep.next();
        await dateTimeStep.fill(dealData);

        const amountStep = await dateTimeStep.next();
        await amountStep.fill(dealData);

        const tncStep = await amountStep.next();
        await tncStep.fill({ terms: dealData.terms });

        const previewStep = await tncStep.next();
        await previewStep.submitAndExpectSuccess();
      });
    });
  }

  for (const role of DEAL_CREATOR_ROLES) {
    formTest.describe(`${role.label} validation ${role.tag}`, () => {
      formTest('rejects an empty deal title', async ({ dealData, generalDetailsStep }) => {
        await generalDetailsStep.fill({ ...dealData, title: '' });
        await generalDetailsStep.nextExpectingValidationError();
        await generalDetailsStep.expectTitleValidationError();
      });

      formTest('rejects a deal title over 50 characters', async ({ dealData, generalDetailsStep }) => {
        await generalDetailsStep.fill({ ...dealData, title: 'a'.repeat(51) });
        await generalDetailsStep.nextExpectingValidationError();
        await generalDetailsStep.expectTitleValidationError();
      });

      formTest('rejects an empty description', async ({ dealData, generalDetailsStep }) => {
        await generalDetailsStep.fill({ ...dealData, desc: '' });
        await generalDetailsStep.nextExpectingValidationError();
        await generalDetailsStep.expectDescriptionValidationError();
      });

      formTest('rejects a description over 100 characters', async ({ dealData, generalDetailsStep }) => {
        await generalDetailsStep.fill({ ...dealData, desc: 'a'.repeat(101) });
        await generalDetailsStep.nextExpectingValidationError();
        await generalDetailsStep.expectDescriptionValidationError();
      });

      formTest('rejects an empty start date', async ({ dealData, dateTimeStep }) => {
        await dateTimeStep.fill({ ...dealData, startDate: '' });
        await dateTimeStep.nextExpectingValidationError();
        await dateTimeStep.expectStartDateValidationError();
      });

      formTest('rejects an empty end date', async ({ dealData, dateTimeStep }) => {
        await dateTimeStep.fill({ ...dealData, endDate: '' });
        await dateTimeStep.nextExpectingValidationError();
        await dateTimeStep.expectEndDateValidationError();
      });

      formTest('rejects an end date before the start date', async ({ dealData, dateTimeStep }) => {
        await dateTimeStep.fill(
          {
            ...dealData,
            startDate: futureDate(30),
            endDate: futureDate(7),
          },
        );
        await dateTimeStep.nextExpectingValidationError();
        await dateTimeStep.expectEndDateBeforeStartError();
      });

      formTest('rejects an end time before the start time', async ({ dealData, dateTimeStep }) => {
        await dateTimeStep.fill(
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
        await dateTimeStep.nextExpectingValidationError();
        await dateTimeStep.expectEndTimeBeforeStartError();
      });

      formTest('rejects a zero deal value', async ({ amountStep }) => {
        await amountStep.fillDealValue('0');
        await amountStep.nextExpectingValidationError();
        await amountStep.expectDealValueValidationError();
      });

      formTest('rejects an empty deal value', async ({ amountStep }) => {
        await amountStep.fillDealValue('');
        await amountStep.nextExpectingValidationError();
        await amountStep.expectDealValueValidationError();
      });

      formTest('rejects a negative deal value', async ({ amountStep }) => {
        await amountStep.fillDealValue('-1');
        await amountStep.nextExpectingValidationError();
        await amountStep.expectDealValueValidationError();
      });

      formTest('rejects a zero quantity', async ({ amountStep }) => {
        await amountStep.toggleUnlimitedQuantity();
        await amountStep.fillCurrentQuantity('0');
        await amountStep.nextExpectingValidationError();
        await amountStep.expectQuantityValidationError();
      });

      formTest('rejects a negative quantity', async ({ amountStep }) => {
        await amountStep.toggleUnlimitedQuantity();
        await amountStep.fillCurrentQuantity('-1');
        await amountStep.nextExpectingValidationError();
        await amountStep.expectQuantityValidationError();
      });

      formTest('rejects empty terms and conditions', async ({ tncStep }) => {
        await tncStep.clearTermsAndConditions();
        await tncStep.nextExpectingValidationError();
        await tncStep.expectTermsRequiredError();
      });

      formTest('rejects a deal value percentage over 100', async ({ amountStep }) => {
        await amountStep.fillDealValue('101');
        await amountStep.nextExpectingValidationError();
        await amountStep.expectPercentageDealValueValidationError();
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
