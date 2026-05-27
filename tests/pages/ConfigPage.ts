import { Page, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

const SELECTORS = {
  nav: {
    configuration: (page: Page) => page.getByRole('link', { name: 'Configuration' }),
    deals: (page: Page) => page.getByRole('link', { name: 'Deals' }),
  },

  list: {
    configPage: (page: Page) => page.getByText('Configuration'), // config module on home page
    configHeading: (page: Page) => page.getByRole('heading', { name: 'Details' }), // heading on config page
    heading: (page: Page) => page.getByRole('heading', { name: 'Deal Approval' }), // heading on deal list page
    createButton: (page: Page) => page.getByRole('button', { name: 'Create' }), // create button on deal page 
    buildOptionsPage: (page: Page) => page.getByText('How do you want to build this'), // appears after clicking Create button
    dealRow: (page: Page, title: string) => page.getByRole('row').filter({ hasText: title }), // 
  },

  steps: {
    generalDetails: (page: Page) => page.locator('form').getByText('General Details'),
    dateTimeSettings: (page: Page) => page.locator('form').getByText('Date & Time Settings'),
    amountCurrency: (page: Page) => page.locator('form').getByText('Amount & Currency'),
    termsConditions: (page: Page) => page.locator('form').getByText('Terms & Conditions'),
    preview: (page: Page) => page.locator('form').getByText('Preview', { exact: true }),
  },

  buttons: {
    next: (page: Page) => page.getByRole('button', { name: 'Next', exact: true }),
    previous: (page: Page) => page.getByRole('button', { name: 'Previous' }),
    createDeal: (page: Page) => page.getByRole('button', { name: 'Create Deal' }),
    continue: (page: Page) => page.getByRole('button', { name: 'Continue' }),
    createManual: (page: Page) => page.getByRole('button', { name: 'Manual Walk through each step' }),
    resetTnC: (page: Page) => page.getByRole('button', { name: 'Reset to Auto-generated' }),
  },

  // Step 1 — General Details
  step1: {
    dealTitle: (page: Page) => page.getByRole('textbox').first(),
    description: (page: Page) => page.locator('textarea'),
    fullDescription: (page: Page) => page.getByPlaceholder('Type something...'),
    keywordsInput: (page: Page) => page.getByRole('textbox', { name: 'Type keywords and press Enter' }),
    keywordTag: (page: Page, keyword: string) =>
      page.locator('').filter({ hasText: keyword }),        // TODO
    keywordLimitMessage: (page: Page) => page.getByText('Maximum 7 keywords allowed'),
  },

  // Step 2 — Date & Time Settings
  step2: {
    startDate: (page: Page) => page.getByRole('textbox', { name: 'YYYY-MM-DD' }).first(),
    endDate: (page: Page) => page.getByRole('textbox', { name: 'YYYY-MM-DD' }).nth(1),
    startTime: (page: Page) => page.getByRole('button', { name: ':00' }),
    endTime: (page: Page) => page.getByRole('button', { name: ':59' }),
    hour: (page: Page, value: string) => page.getByRole('combobox').first().selectOption(value),
    min: (page: Page, value: string) => page.getByRole('combobox').nth(1).selectOption(value),
    dateRangeError: (page: Page) => page.getByRole('alert', { name: 'Please fix the following' }),
    dateRangeErrorMessage: (page: Page) => page.getByText('• End date', { exact: true }),
  },

  // Step 3 — Amount & Currency
  step3: {
    dealValueTypeToggle: (page: Page) => page.getByRole('combobox').filter({ hasText: '%' }),
    dealValueInput: (page: Page) => page.getByRole('spinbutton').first(),
    currency: (page: Page) => page.locator(''),            // TODO
    minimumSpend: (page: Page) => page.getByText('Minimum Spend Minimum amount').getByRole('spinbutton'),
    unlimitedQuantityToggle: (page: Page) => page.getByRole('switch'),
    currentQuantity: (page: Page) => page.getByRole('spinbutton').nth(2),
  },

  // Step 4 — Terms & Conditions
  step4: {
    termsEditor: (page: Page) => page.locator('.tiptap'),
  },

  // Step 5 — Preview (read-only)
  step5: {
    previewCard: (page: Page) => page.locator('form').getByText('Preview', { exact: true }), // TODO: confirm selector
  },

  alerts: {
    validationError: (page: Page) =>
      page.getByRole('alert', { name: 'Please fix the following' }),
    success: (page: Page) =>
      page.getByText('Deal created successfully', { exact: true }),
    dateRangeError: (page: Page) => page.getByText('End date must be after start'),
    dateTimeRangeError: (page: Page) => page.getByText(/End (date|time) must be after start/i),
    dealValueError: (page: Page) => page.getByText('Deal value must be greater'),
    quantityError: (page: Page) => page.getByText('Quantity must be greater than'),
    minimumSpendError: (page: Page) => page.locator(''),   // TODO
  },
};

export { SELECTORS };

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export async function navigateToDeals(page: Page): Promise<void> {
  await expect(SELECTORS.nav.configuration(page)).toBeVisible();
  await SELECTORS.nav.configuration(page).click();
  await expect(SELECTORS.list.configHeading(page)).toBeVisible();
  await SELECTORS.nav.deals(page).click();
  await expect(SELECTORS.list.heading(page)).toBeVisible();
}

export async function openCreateDealForm(page: Page): Promise<void> {
  await expect(SELECTORS.list.createButton(page)).toBeVisible();
  await SELECTORS.list.createButton(page).click();
  await SELECTORS.buttons.continue(page).click();
  await expect(SELECTORS.list.buildOptionsPage(page)).toBeVisible();
  await SELECTORS.buttons.createManual(page).click();
  await expect(SELECTORS.steps.generalDetails(page)).toBeVisible();
}

export async function navigateToCreateDeal(page: Page): Promise<void> {
  await navigateToDeals(page);
  await openCreateDealForm(page);
}

// ---------------------------------------------------------------------------
// Step navigation
// ---------------------------------------------------------------------------

export async function proceedFromStep1ToStep2(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
  await expect(SELECTORS.steps.dateTimeSettings(page)).toBeVisible();
}

export async function proceedFromStep2ToStep3(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
  await expect(SELECTORS.steps.amountCurrency(page)).toBeVisible();
}

export async function proceedFromStep3ToStep4(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
  await expect(SELECTORS.steps.termsConditions(page)).toBeVisible();
}

export async function proceedFromStep4ToStep5(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
  await expect(SELECTORS.steps.preview(page)).toBeVisible();
}

// Used in validation tests — clicks Next but expects to stay on current step
export async function attemptProceedFromStep1(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
}

export async function attemptProceedFromStep2(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
}

export async function attemptProceedFromStep3(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
}

export async function submitCreateDeal(page: Page): Promise<void> {
  await SELECTORS.buttons.createDeal(page).click();
}

// ---------------------------------------------------------------------------
// Step 1 interactions — General Details
// ---------------------------------------------------------------------------

export async function fillDealTitle(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step1.dealTitle(page);
  await field.click();
  await field.fill(value);
}

export async function fillDescription(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step1.description(page);
  await field.click();
  await field.fill(value);
}

export async function fillFullDescription(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step1.fullDescription(page);
  await field.click();
  await field.fill(value);
}

export async function addKeyword(page: Page, keyword: string): Promise<void> {
  const field = SELECTORS.step1.keywordsInput(page);
  await field.click();
  await field.fill(keyword);
  await field.press('Enter');
}

export async function addKeywords(page: Page, keywords: string[]): Promise<void> {
  for (const keyword of keywords) {
    await addKeyword(page, keyword);
  }
}

// ---------------------------------------------------------------------------
// Step 2 interactions — Date & Time Settings
// ---------------------------------------------------------------------------

export async function fillStartDate(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step2.startDate(page);
  await field.click();
  await field.fill(value);
}

export async function fillEndDate(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step2.endDate(page);
  await field.click();
  await field.fill(value);
}

export async function fillStartTime(page: Page, hr: string, min: string): Promise<void> {
  const field = SELECTORS.step2.startTime(page);
  await field.click();
  await SELECTORS.step2.hour(page, hr);
  await SELECTORS.step2.min(page, min);
}

export async function fillEndTime(page: Page, hr: string, min: string): Promise<void> {
  const field = SELECTORS.step2.endTime(page);
  await field.click();
  await SELECTORS.step2.hour(page, hr);
  await SELECTORS.step2.min(page, min);
}

// ---------------------------------------------------------------------------
// Step 3 interactions — Amount & Currency
// ---------------------------------------------------------------------------

export async function fillDealValue(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step3.dealValueInput(page);
  await field.click();
  await field.fill(value);
}

export async function fillMinimumSpend(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step3.minimumSpend(page);
  await field.click();
  await field.fill(value);
}

export async function toggleUnlimitedQuantity(page: Page): Promise<void> {
  await SELECTORS.step3.unlimitedQuantityToggle(page).click();
}

export async function fillCurrentQuantity(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step3.currentQuantity(page);
  await field.click();
  await field.fill(value);
}

// ---------------------------------------------------------------------------
// Step 4 interactions — Terms & Conditions
// ---------------------------------------------------------------------------

export async function clearTermsAndConditions(page: Page): Promise<void> {
  const editor = SELECTORS.step4.termsEditor(page);
  await editor.click();
  await page.keyboard.press('Meta+a');
  await page.keyboard.press('Backspace');
}

export async function resetTermsAndConditions(page: Page): Promise<void> {
  await SELECTORS.buttons.resetTnC(page).click();
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

export async function expectDealCreatedSuccess(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.success(page)).toBeVisible();
}

export async function expectValidationError(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.validationError(page)).toBeVisible();
}

export async function expectDateRangeError(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.dateRangeError(page)).toBeVisible();
}

export async function expectDateTimeRangeError(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.dateTimeRangeError(page)).toBeVisible();
}

export async function expectDealValueError(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.dealValueError(page)).toBeVisible();
}

export async function expectQuantityError(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.quantityError(page)).toBeVisible();
}

export async function expectMinimumSpendError(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.minimumSpendError(page)).toBeVisible();
}

export async function expectDealInList(page: Page, title: string): Promise<void> {
  await expect(SELECTORS.list.dealRow(page, title)).toBeVisible();
}

export async function expectCreateButtonNotVisible(page: Page): Promise<void> {
  await expect(SELECTORS.list.createButton(page)).not.toBeVisible();
}
