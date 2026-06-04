import { Page, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

const SELECTORS = {
  nav: {
    configuration: (page: Page) => page.getByRole('link', { name: 'Configuration' }),
    loyaltyPrograms: (page: Page) => page.getByRole('link', { name: 'Loyalty Programs' }),
  },

  list: {
    configHeading: (page: Page) => page.getByRole('heading', { name: 'Details' }),
    heading: (page: Page) => page.getByRole('heading', { name: 'Loyalty Programs' }),
    createButton: (page: Page) => page.getByRole('button', { name: 'Create' }),
  },

  // Pre-wizard: Merchant & Branches
  merchantBranches: {
    merchantDropdown: (page: Page) => page.getByRole('combobox').first(), // TODO: confirm selector
    branchesDropdown: (page: Page) => page.getByRole('combobox').nth(1), // TODO: confirm selector
    allBranchesToggle: (page: Page) => page.getByRole('checkbox', { name: 'All Branches' }),
    continueButton: (page: Page) => page.getByRole('button', { name: 'Continue' }),
  },

  // Pre-wizard: Build method
  buildMethod: {
    manualCard: (page: Page) => page.getByText('Manual Walk through each step'),
    buildMethodHeading: (page: Page) => page.getByText('How do you want to build this loyalty program?'),
  },

  // Step indicators
  steps: {
    programSetup: (page: Page) => page.getByText('Program Configuration'),
    generalDetails: (page: Page) => page.getByText('General Details').nth(2),
    rewardsConfiguration: (page: Page) => page.getByText('Reward Milestone'),
    termsConditions: (page: Page) => page.getByText('Terms Content *'),
    preview: (page: Page) => page.getByText('Review the loyalty program'),
  },

  buttons: {
    next: (page: Page) => page.getByRole('button', { name: 'Next', exact: true }),
    next4: (page: Page) => page.getByRole('button', { name: 'Next', exact: true }).nth(1), // same button, different step
    previous: (page: Page) => page.getByRole('button', { name: 'Previous' }),
    create: (page: Page) => page.getByRole('button', { name: 'Create', exact: true }),
  },

  // Step 1 — Program Setup
  step1: {
    programTypeDropdown: (page: Page) => page.getByRole('combobox').filter({ hasText: 'Visit-Based (Count Visits)' }),
    visitBasedOption: (page: Page) => page.getByRole('option', { name: 'Visit-Based (Count Visits)' }),
    transactionBasedOption: (page: Page) => page.getByRole('option', { name: 'Transaction-Based (Spending' }),
    cardTypeDropdown: (page: Page) => page.getByRole('combobox').filter({ hasText: 'Card (Stamp Card)' }),
    cardOption: (page: Page) => page.getByRole('option', { name: 'Card (Stamp Card)' }),
    ladderOption: (page: Page) => page.getByRole('option', { name: 'Ladder (Progress Bar)' }),
    visitsPerStamp: (page: Page) => page.getByRole('spinbutton').first(),
    amountPerStamp: (page: Page) => page.getByRole('spinbutton').first(), // same field, rendered conditionally
    visitsPerStampError: (page: Page) => page.getByText('Visits per stamp must be at least'),
  },

  // Step 2 — General Details
  step2: {
    programTitle: (page: Page) => page.getByRole('textbox').first(),
    description: (page: Page) => page.locator('textarea').first(),
    fullDescription: (page: Page) => page.locator('.tiptap').first(),
    keywordsInput: (page: Page) => page.getByRole('textbox', { name: 'Type keywords and press Enter' }),
    startDate: (page: Page) => page.getByRole('textbox', { name: 'YYYY-MM-DD' }).first(),
    endDate: (page: Page) => page.getByRole('textbox', { name: 'YYYY-MM-DD' }).nth(1),
  },

  // Step 3 — Rewards Configuration
  step3: {
    addRewardButton: (page: Page) => page.getByRole('button', { name: 'Add Reward', exact: true }),
    rewardMilestone: (page: Page) => page.getByRole('spinbutton').first(),
    rewardName: (page: Page) => page.getByRole('textbox').first(),
    rewardDescription: (page: Page) => page.locator('.tiptap').first(),
    rewardValidUntil: (page: Page) => page.getByRole('textbox', { name: 'YYYY-MM-DD' }),
    rewardQuantity: (page: Page) => page.getByRole('spinbutton').nth(1),
    nav: {
      next: (page: Page) => page.getByRole('button', { name: 'Next' }).first(),
      prev: (page: Page) => page.getByRole('button', { name: 'Prev' }).first(),
    },
  },

  // Step 4 — Terms & Conditions
  step4: {
    termsEditor: (page: Page) => page.locator('.tiptap'),
    resetButton: (page: Page) => page.getByRole('button', { name: 'Reset to Auto-generated' }),
  },

  // Step 5 — Preview
  step5: {
    previewCard: (page: Page) => page.locator('TODO'), // TODO: confirm selector
    createButton: (page: Page) => page.getByRole('button', { name: 'Create', exact: true }),
  },

  alerts: {
    validationError: (page: Page) => page.getByRole('alert', { name: 'Please fix the following' }), // TODO: confirm matches loyalty error shape
    success: (page: Page) => page.getByText('Loyalty program created successfully', { exact: true }),
  },
};

export { SELECTORS };

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export async function navigateToLoyaltyPrograms(page: Page): Promise<void> {
  await expect(SELECTORS.nav.configuration(page)).toBeVisible();
  await SELECTORS.nav.configuration(page).click();
  await expect(SELECTORS.list.configHeading(page)).toBeVisible();
  await SELECTORS.nav.loyaltyPrograms(page).click();
  await expect(SELECTORS.list.heading(page)).toBeVisible();
}

export async function navigateToCreateLoyaltyProgram(page: Page): Promise<void> {
  await navigateToLoyaltyPrograms(page);
  await expect(SELECTORS.list.createButton(page)).toBeVisible();
  await SELECTORS.list.createButton(page).click();
}

// ---------------------------------------------------------------------------
// Pre-wizard: Merchant & Branches
// ---------------------------------------------------------------------------

export async function selectMerchant(page: Page, merchant: string): Promise<void> {
  // TODO: implement once selector confirmed
  await SELECTORS.merchantBranches.merchantDropdown(page).selectOption(merchant);
}

export async function selectAllBranches(page: Page): Promise<void> {
  await SELECTORS.merchantBranches.allBranchesToggle(page).click();
}

export async function proceedFromMerchantBranches(page: Page): Promise<void> {
  await SELECTORS.merchantBranches.continueButton(page).click();
  await expect(SELECTORS.buildMethod.buildMethodHeading(page)).toBeVisible();
}

// ---------------------------------------------------------------------------
// Pre-wizard: Build method
// ---------------------------------------------------------------------------

export async function selectManualBuild(page: Page): Promise<void> {
  await SELECTORS.buildMethod.manualCard(page).click();
  await expect(SELECTORS.steps.programSetup(page)).toBeVisible();
}

// ---------------------------------------------------------------------------
// Step navigation
// ---------------------------------------------------------------------------

export async function proceedFromStep1ToStep2(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
  await expect(SELECTORS.steps.generalDetails(page)).toBeVisible();
}

export async function proceedFromStep2ToStep3(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
  await expect(SELECTORS.steps.rewardsConfiguration(page)).toBeVisible();
}

export async function proceedFromStep3ToStep4(page: Page): Promise<void> {
  await SELECTORS.buttons.next4(page).click();
  await expect(SELECTORS.steps.termsConditions(page)).toBeVisible();
}

export async function proceedFromStep4ToStep5(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
  await expect(SELECTORS.steps.preview(page)).toBeVisible();
}

export async function attemptProceedFromStep1(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
}

export async function attemptProceedFromStep2(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
}

export async function attemptProceedFromStep3(page: Page): Promise<void> {
  await SELECTORS.buttons.next4(page).click();
}

export async function attemptProceedFromStep4(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
}

export async function submitCreateLoyaltyProgram(page: Page): Promise<void> {
  await SELECTORS.step5.createButton(page).click();
}

// ---------------------------------------------------------------------------
// Step 1 interactions — Program Setup
// ---------------------------------------------------------------------------

export async function selectVisitBased(page: Page): Promise<void> {
  await SELECTORS.step1.programTypeDropdown(page).click();
  await SELECTORS.step1.visitBasedOption(page).click();
}

export async function selectTransactionBased(page: Page): Promise<void> {
  await SELECTORS.step1.programTypeDropdown(page).click();
  await SELECTORS.step1.transactionBasedOption(page).click();
}

export async function fillVisitsPerStamp(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step1.visitsPerStamp(page);
  await field.click();
  await field.fill(value);
}

export async function fillAmountPerStamp(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step1.amountPerStamp(page);
  await field.click();
  await field.fill(value);
}

// ---------------------------------------------------------------------------
// Step 2 interactions — General Details
// ---------------------------------------------------------------------------

export async function fillProgramTitle(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step2.programTitle(page);
  await field.click();
  await field.fill(value);
}

export async function fillProgramDescription(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step2.description(page);
  await field.click();
  await field.fill(value);
}

export async function addKeyword(page: Page, keyword: string): Promise<void> {
  const field = SELECTORS.step2.keywordsInput(page);
  await field.click();
  await field.fill(keyword);
  await field.press('Enter');
}

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

// ---------------------------------------------------------------------------
// Step 3 interactions — Rewards Configuration
// ---------------------------------------------------------------------------

export async function addReward(page: Page): Promise<void> {
  await SELECTORS.step3.addRewardButton(page).click();
  // Add Reward auto-navigates to the newly created reward page
}

export async function rewardPaginatorNext(page: Page): Promise<void> {
  await SELECTORS.step3.nav.next(page).click();
}

export async function rewardPaginatorPrev(page: Page): Promise<void> {
  await SELECTORS.step3.nav.prev(page).click();
}

export async function fillCurrentReward(
  page: Page,
  name: string,
  milestone: string,
  description: string,
  validUntil: string,
  quantity: string,
): Promise<void> {
  await fillRewardMilestone(page, milestone);
  await fillRewardName(page, name);
  await fillRewardDescription(page, description);
  await fillRewardValidUntil(page, validUntil);
  await fillRewardQuantity(page, quantity);
}

export async function fillRewardMilestone(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step3.rewardMilestone(page);
  await field.click();
  await field.fill(value);
}

export async function fillRewardName(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step3.rewardName(page);
  await field.click();
  await field.fill(value);
}

export async function fillRewardDescription(page: Page, value: string): Promise<void> {
  const editor = SELECTORS.step3.rewardDescription(page);
  await editor.click();
  await editor.fill(value);
}

export async function fillRewardValidUntil(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step3.rewardValidUntil(page);
  await field.click();
  await field.fill(value);
}

export async function fillRewardQuantity(page: Page, value: string): Promise<void> {
  const field = SELECTORS.step3.rewardQuantity(page);
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
  await SELECTORS.step4.resetButton(page).click();
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

export async function expectLoyaltyProgramCreatedSuccess(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.success(page)).toBeVisible();
}

export async function expectVisitsPerStampError(page: Page): Promise<void> {
  await expect(SELECTORS.step1.visitsPerStampError(page)).toBeVisible();
}

export async function expectValidationError(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.validationError(page)).toBeVisible();
}

export async function expectCreateButtonNotVisible(page: Page): Promise<void> {
  await expect(SELECTORS.list.createButton(page)).not.toBeVisible();
}

export async function expectAddRewardButtonDisabled(page: Page): Promise<void> {
  await expect(SELECTORS.step3.addRewardButton(page)).toBeDisabled();
}