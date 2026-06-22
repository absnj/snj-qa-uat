import { test, expect, type Page } from '@playwright/test';
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
  branchSelection: BranchSelection;
  generalDetailsStep: GeneralDetailsStep;
  dateTimeStep: DateTimeStep;
  amountStep: AmountStep;
  tncStep: TncStep;
  previewStep: PreviewStep;
};

const formTest = test.extend<DealFormFixtures>({
  branchSelection: async ({ page }, use) => {
    const branchSelection = new BranchSelection(page);
    await branchSelection.goto();
    await branchSelection.waitForReady();
    await use(branchSelection);
  },

  generalDetailsStep: async ({ branchSelection }, use) => {
    const buildOptions = await branchSelection.next();
    await buildOptions.waitForReady();

    const generalDetailsStep = await buildOptions.buildManual();
    await generalDetailsStep.waitForReady();
    await use(generalDetailsStep);
  },

  dateTimeStep: async ({ generalDetailsStep }, use) => {
    await generalDetailsStep.fill(validDeal());

    const dateTimeStep = await generalDetailsStep.next();
    await dateTimeStep.waitForReady();
    await use(dateTimeStep);
  },

  amountStep: async ({ dateTimeStep }, use) => {
    await dateTimeStep.fill(validDeal());

    const amountStep = await dateTimeStep.next();
    await amountStep.waitForReady();
    await use(amountStep);
  },

  tncStep: async ({ amountStep }, use) => {
    await amountStep.fill(validDeal());

    const tncStep = await amountStep.next();
    await tncStep.waitForReady();
    await use(tncStep);
  },

  previewStep: async ({ tncStep }, use) => {
    const dealData = validDeal();
    await tncStep.fill({ terms: dealData.terms });

    const previewStep = await tncStep.next();
    await previewStep.waitForReady();
    await use(previewStep);
  },
});

function validDeal(overrides: Partial<DealData> = {}): DealData {
  return {
    title: generateDealTitle(),
    desc: 'Test deal description',
    fullDesc: 'Full description for an automated UAT deal.',
    keywords: ['uat', 'deal', 'test'],
    startDate: '2026-07-01',
    endDate: '2026-07-31',
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
  await configOverview.dealsTab.click();

  const dealsPage = new DealsPage(page);
  await dealsPage.waitForReady();
  return dealsPage;
}

async function expectValidationError(page: Page): Promise<void> {
  await expect(page.getByRole('alert', { name: 'Please fix the following' })).toBeVisible();
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
        await branchSelection.waitForReady();

        const dealData = validDeal();

        const buildOptions = await branchSelection.next();
        await buildOptions.waitForReady();

        const generalDetailsStep = await buildOptions.buildManual();
        await generalDetailsStep.waitForReady();
        await generalDetailsStep.fill(dealData);

        const dateTimeStep = await generalDetailsStep.next();
        await dateTimeStep.waitForReady();
        await dateTimeStep.fill(dealData);

        const amountStep = await dateTimeStep.next();
        await amountStep.waitForReady();
        await amountStep.fill(dealData);

        const tncStep = await amountStep.next();
        await tncStep.waitForReady();
        await tncStep.fill({ terms: dealData.terms });

        const previewStep = await tncStep.next();
        await previewStep.waitForReady();
        await previewStep.submit();
        await previewStep.verifyDealCreatedSuccess();
      });
    });
  }

  for (const role of DEAL_CREATOR_ROLES) {
    formTest.describe(`${role.label} validation ${role.tag}`, () => {
      formTest('rejects an empty deal title', async ({ page, generalDetailsStep }) => {
        await generalDetailsStep.fill(validDeal({ title: '' }));
        await generalDetailsStep.next();
        await expectValidationError(page);
      });

      formTest('rejects a deal title over 50 characters', async ({ page, generalDetailsStep }) => {
        await generalDetailsStep.fill(validDeal({ title: 'a'.repeat(51) }));
        await generalDetailsStep.next();
        await expectValidationError(page);
      });

      formTest('rejects an empty description', async ({ page, generalDetailsStep }) => {
        await generalDetailsStep.fill(validDeal({ desc: '' }));
        await generalDetailsStep.next();
        await expectValidationError(page);
      });

      formTest('rejects a description over 100 characters', async ({ page, generalDetailsStep }) => {
        await generalDetailsStep.fill(validDeal({ desc: 'a'.repeat(101) }));
        await generalDetailsStep.next();
        await expectValidationError(page);
      });

      formTest('rejects an empty start date', async ({ page, dateTimeStep }) => {
        await dateTimeStep.fill(validDeal({ startDate: '' }));
        await dateTimeStep.next();
        await expectValidationError(page);
      });

      formTest('rejects an empty end date', async ({ page, dateTimeStep }) => {
        await dateTimeStep.fill(validDeal({ endDate: '' }));
        await dateTimeStep.next();
        await expectValidationError(page);
      });

      formTest('rejects an end date before the start date', async ({ page, dateTimeStep }) => {
        await dateTimeStep.fill(
          validDeal({
            startDate: '2026-07-31',
            endDate: '2026-07-01',
          }),
        );
        await dateTimeStep.next();
        await expectValidationError(page);
        await expect(page.getByText('End date must be after start')).toBeVisible();
      });

      formTest('rejects an end time before the start time', async ({ page, dateTimeStep }) => {
        await dateTimeStep.fill(
          validDeal({
            startDate: '2026-07-01',
            endDate: '2026-07-01',
            startHour: '23',
            startMin: '58',
            endHour: '09',
            endMin: '00',
          }),
        );
        await dateTimeStep.next();
        await expectValidationError(page);
        await expect(page.getByText(/End (date|time) must be after start/i)).toBeVisible();
      });

      formTest('rejects a zero deal value', async ({ page, amountStep }) => {
        await amountStep.fill(validDeal({ dealValue: '0' }));
        await amountStep.next();
        await expectValidationError(page);
        await expect(page.getByText('Deal value must be greater')).toBeVisible();
      });

      formTest('rejects an empty deal value', async ({ page, amountStep }) => {
        await amountStep.fill(validDeal({ dealValue: '' }));
        await amountStep.next();
        await expectValidationError(page);
        await expect(page.getByText('Deal value must be greater')).toBeVisible();
      });

      formTest('rejects a negative deal value', async ({ page, amountStep }) => {
        await amountStep.fill(validDeal({ dealValue: '-1' }));
        await amountStep.next();
        await expectValidationError(page);
        await expect(page.getByText('Deal value must be greater')).toBeVisible();
      });

      formTest('rejects a zero quantity', async ({ page, amountStep }) => {
        await amountStep.fill(validDeal({ currentQuantity: '0' }));
        await amountStep.next();
        await expectValidationError(page);
        await expect(page.getByText('Quantity must be greater than')).toBeVisible();
      });

      formTest('rejects a negative quantity', async ({ page, amountStep }) => {
        await amountStep.fill(validDeal({ currentQuantity: '-1' }));
        await amountStep.next();
        await expectValidationError(page);
        await expect(page.getByText('Quantity must be greater than')).toBeVisible();
      });

      formTest('rejects empty terms and conditions', async ({ page, tncStep }) => {
        await tncStep.clearTermsAndConditions();
        await tncStep.next();
        await expectValidationError(page);
        await expect(page.getByText('Terms & Conditions are required', { exact: true })).toBeVisible();
      });

      formTest('rejects a deal value percentage over 100', async ({ page, amountStep }) => {
        await amountStep.fill(validDeal({ dealValue: '101' }));
        await amountStep.next();
        await expectValidationError(page);
        await expect(
          page.getByText('Percentage deal value must be between 0 and 100', { exact: true }),
        ).toBeVisible();
      });
    });
  }
});
