import { Page } from '@playwright/test';
import { generateDealTitle } from '../utils/testDataGenerators';
import {
  navigateToDeals,
  navigateToCreateDeal,
  proceedFromStep1ToStep2,
  proceedFromStep2ToStep3,
  proceedFromStep3ToStep4,
  proceedFromStep4ToStep5,
  attemptProceedFromStep1,
  attemptProceedFromStep2,
  attemptProceedFromStep3,
  attemptProceedFromStep4,
  submitCreateDeal,
  fillDealTitle,
  fillDescription,
  fillStartDate,
  fillEndDate,
  fillStartTime,
  fillEndTime,
  fillDealValue,
  fillMinimumSpend,
  toggleUnlimitedQuantity,
  fillCurrentQuantity,
  clearTermsAndConditions,
  expectDealCreatedSuccess,
  expectValidationError,
  expectDateRangeError,
  expectDateTimeRangeError,
  expectDealValueError,
  expectQuantityError,
  expectCreateButtonNotVisible,
  expectTermsError,
  expectDealValueExceedError,
} from '../../pages/config/DealsPage';

// ---------------------------------------------------------------------------
// Test data defaults
// ---------------------------------------------------------------------------

const DEFAULTS = {
  title: generateDealTitle(),
  description: 'Test deal description',
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  startHour: '09',
  startMin: '00',
  endHour: '23',
  endMin: '59',
  dealValue: '20',
  quantity: '10',
};

// ---------------------------------------------------------------------------
// Shared setup helpers
// ---------------------------------------------------------------------------

async function fillStep1Defaults(page: Page): Promise<void> {
  await fillDealTitle(page, DEFAULTS.title);
  await fillDescription(page, DEFAULTS.description);
}

async function fillStep2Defaults(page: Page): Promise<void> {
  await fillStartDate(page, DEFAULTS.startDate);
  await fillEndDate(page, DEFAULTS.endDate);
  await fillStartTime(page, DEFAULTS.startHour, DEFAULTS.startMin);
  await fillEndTime(page, DEFAULTS.endHour, DEFAULTS.endMin);
}

async function fillStep3Defaults(page: Page): Promise<void> {
  await fillDealValue(page, DEFAULTS.dealValue);
  await toggleUnlimitedQuantity(page);
  await fillCurrentQuantity(page, DEFAULTS.quantity);
}

async function reachStep1(page: Page): Promise<void> {
  await navigateToCreateDeal(page);
}

async function reachStep2(page: Page): Promise<void> {
  await reachStep1(page);
  await fillStep1Defaults(page);
  await proceedFromStep1ToStep2(page);
}

async function reachStep3(page: Page): Promise<void> {
  await reachStep2(page);
  await fillStep2Defaults(page);
  await proceedFromStep2ToStep3(page);
}

async function reachStep4(page: Page): Promise<void> {
  await reachStep3(page);
  await fillStep3Defaults(page);
  await proceedFromStep3ToStep4(page);
}

async function reachStep5(page: Page): Promise<void> {
  await reachStep4(page);
  await proceedFromStep4ToStep5(page);
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

export async function createDealHappyPath(page: Page): Promise<void> {
  await reachStep1(page);
  await fillStep1Defaults(page);
  await proceedFromStep1ToStep2(page);
  await fillStep2Defaults(page);
  await proceedFromStep2ToStep3(page);
  await fillStep3Defaults(page);
  await proceedFromStep3ToStep4(page);
  await proceedFromStep4ToStep5(page);
  await submitCreateDeal(page);
  await expectDealCreatedSuccess(page);
}

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

export async function viewDealList(page: Page): Promise<void> {
  await navigateToDeals(page);
}

export async function staffUnableToCreateDeal(page: Page): Promise<void> {
  await navigateToDeals(page);
  await expectCreateButtonNotVisible(page);
}

// ---------------------------------------------------------------------------
// Step 1 validation — General Details
// ---------------------------------------------------------------------------

export async function invalidDealTitleEmpty(page: Page): Promise<void> {
  await reachStep1(page);
  await fillDescription(page, DEFAULTS.description);
  await attemptProceedFromStep1(page);
  await expectValidationError(page);
}

export async function invalidDealTitleTooLong(page: Page): Promise<void> {
  await reachStep1(page);
  await fillDealTitle(page, 'a'.repeat(51)); // exceeds 50 char limit
  await fillDescription(page, DEFAULTS.description);
  await attemptProceedFromStep1(page);
  await expectValidationError(page);
}

export async function invalidDescriptionEmpty(page: Page): Promise<void> {
  await reachStep1(page);
  await fillDealTitle(page, DEFAULTS.title);
  await attemptProceedFromStep1(page);
  await expectValidationError(page);
}

export async function invalidDescriptionTooLong(page: Page): Promise<void> {
  await reachStep1(page);
  await fillDealTitle(page, DEFAULTS.title);
  await fillDescription(page, 'a'.repeat(101)); // exceeds 100 char limit
  await attemptProceedFromStep1(page);
  await expectValidationError(page);
}

// ---------------------------------------------------------------------------
// Step 2 validation — Date & Time Settings
// ---------------------------------------------------------------------------

export async function invalidStartDateEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await fillEndDate(page, DEFAULTS.endDate);
  await fillStartTime(page, DEFAULTS.startHour, DEFAULTS.startMin);
  await fillEndTime(page, DEFAULTS.endHour, DEFAULTS.endMin);
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidEndDateEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await fillStartDate(page, DEFAULTS.startDate);
  await fillStartTime(page, DEFAULTS.startHour, DEFAULTS.startMin);
  await fillEndTime(page, DEFAULTS.endHour, DEFAULTS.endMin);
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidEndDateBeforeStartDate(page: Page): Promise<void> {
  await reachStep2(page);
  await fillStartDate(page, '2026-06-30');
  await fillEndDate(page, '2026-06-01'); // end before start
  await fillStartTime(page, DEFAULTS.startHour, DEFAULTS.startMin);
  await fillEndTime(page, DEFAULTS.endHour, DEFAULTS.endMin);
  await attemptProceedFromStep2(page);
  await expectDateRangeError(page);
}

export async function invalidEndTimeBeforeStartTime(page: Page): Promise<void> {
  await reachStep2(page);
  await fillStartDate(page, DEFAULTS.startDate);
  await fillEndDate(page, DEFAULTS.startDate);
  await fillStartTime(page, '23', '58');
  await fillEndTime(page, '09', '00'); // end before start on the same date
  await attemptProceedFromStep2(page);
  await expectDateTimeRangeError(page);
}

export async function invalidStartTimeEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await fillStartDate(page, DEFAULTS.startDate);
  await fillEndDate(page, DEFAULTS.endDate);
  await fillEndTime(page, DEFAULTS.endHour, DEFAULTS.endMin);
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidEndTimeEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await fillStartDate(page, DEFAULTS.startDate);
  await fillEndDate(page, DEFAULTS.endDate);
  await fillStartTime(page, DEFAULTS.startHour, DEFAULTS.startMin);
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ---------------------------------------------------------------------------
// Step 3 validation — Amount & Currency
// ---------------------------------------------------------------------------

export async function invalidDealValueZero(page: Page): Promise<void> {
  await reachStep3(page);
  await fillDealValue(page, '0');
  await toggleUnlimitedQuantity(page);
  await fillCurrentQuantity(page, DEFAULTS.quantity);
  await attemptProceedFromStep3(page);
  await expectDealValueError(page);
}

export async function invalidDealValueEmpty(page: Page): Promise<void> {
  await reachStep3(page);
  await fillDealValue(page, '');
  await toggleUnlimitedQuantity(page);
  await fillCurrentQuantity(page, DEFAULTS.quantity);
  await attemptProceedFromStep3(page);
  await expectValidationError(page);
  await expectDealValueError(page);
}

export async function invalidDealValueNegative(page: Page): Promise<void> {
  await reachStep3(page);
  await fillDealValue(page, '-1');
  await toggleUnlimitedQuantity(page);
  await fillCurrentQuantity(page, DEFAULTS.quantity);
  await attemptProceedFromStep3(page);
  await expectValidationError(page);
  await expectDealValueError(page);
}

export async function invalidQuantityZero(page: Page): Promise<void> {
  await reachStep3(page);
  await fillDealValue(page, DEFAULTS.dealValue);
  await toggleUnlimitedQuantity(page);
  await fillCurrentQuantity(page, '0');
  await attemptProceedFromStep3(page);
  await expectValidationError(page);
  await expectQuantityError(page);
}

export async function invalidQuantityNegative(page: Page): Promise<void> {
  await reachStep3(page);
  await fillDealValue(page, DEFAULTS.dealValue);
  await toggleUnlimitedQuantity(page);
  await fillCurrentQuantity(page, '-1');
  await attemptProceedFromStep3(page);
  await expectValidationError(page);
  await expectQuantityError(page);
}

  export async function dealValueExceedsOneHundredPercent(page: Page): Promise<void> {
  await reachStep3(page);
  await fillDealValue(page, '101'); // % type, exceeds 100
  await toggleUnlimitedQuantity(page);
  await fillCurrentQuantity(page, DEFAULTS.quantity);
  await attemptProceedFromStep3(page);
  await expectDealValueExceedError(page);

}

// ---------------------------------------------------------------------------
// Step 4 Terms and Conditions validation
// ---------------------------------------------------------------------------

export async function emptyTermsAndConditionsNotAllowed(page: Page): Promise<void> {
  await reachStep4(page);
  await clearTermsAndConditions(page);
  await attemptProceedFromStep4(page);
  await expectTermsError(page);
}