import { Page } from '@playwright/test';
import {
  navigateToCreateUser,
  proceedFromStep1ToStep2,
  proceedFromStep2ToStep3,
  attemptProceedFromStep2,
  submitCreateStaff,
  expectUserCreatedSuccess,
  expectValidationError,
  expectNoValidationError,
  UserCreationForm,
  navigateToUserManagement,
  expectPhoneFieldEmpty,
} from '../../pages/UserMgmtPage';

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

async function reachStep2(page: Page): Promise<void> {
  await navigateToCreateUser(page);
  await proceedFromStep1ToStep2(page);
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

export async function createUserHappyPath(
  page: Page,
): Promise<{ email: string; password: string }> {
  await reachStep2(page);
  const { email, password } = await new UserCreationForm(page).withDefaults().fill();
  await proceedFromStep2ToStep3(page);
  await submitCreateStaff(page);
  await expectUserCreatedSuccess(page);
  return { email: email!, password: password! };
}

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

export async function staffUnableToCreate(page: Page): Promise<void> {
  await navigateToUserManagement(page);
  // Staff roles should not see the Create button at all
  // navigateToCreateUser will fail before here if the button is present,
  // so we assert it's absent at the Merchant/Branch Staffs level
  const { expect } = await import('@playwright/test');
  await expect(page.getByRole('button', { name: 'Create' })).not.toBeVisible();
}

// ---------------------------------------------------------------------------
// First Name validation
// ---------------------------------------------------------------------------

export async function invalidFirstNameEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withFirstName('').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidFirstNameSpecialChars(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withFirstName('Test@123!').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidFirstNameTooLong(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withFirstName('A'.repeat(101)).fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ---------------------------------------------------------------------------
// Last Name validation
// ---------------------------------------------------------------------------

export async function invalidLastNameEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withLastName('').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidLastNameSpecialChars(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withLastName('Last#Name$').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

export async function invalidEmailEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withEmail('').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidEmailMissingAt(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withEmail('notanemail.com').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidEmailMissingDomain(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withEmail('user@').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidEmailMissingLocal(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withEmail('@domain.com').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidEmailDuplicate(page: Page): Promise<void> {
  // First creation — establish the duplicate
  const { email } = await createUserHappyPath(page);

  // Second creation — same email should be rejected
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withEmail(email).fill();
  await proceedFromStep2ToStep3(page);
  await submitCreateStaff(page);
  await expectValidationError(page);
}

// ---------------------------------------------------------------------------
// Phone validation
// ---------------------------------------------------------------------------

export async function invalidPhoneEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPhone('').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidPhoneNonNumeric(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPhone('abc-defg-hij').fill();
  await expectPhoneFieldEmpty(page);
}

export async function invalidPhoneTooShort(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPhone('123').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidPhoneTooLong(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPhone('1'.repeat(16)).fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ---------------------------------------------------------------------------
// Role validation
// ---------------------------------------------------------------------------

export async function invalidRoleNotSelected(page: Page): Promise<void> {
  await reachStep2(page);
  // Explicitly omit role — withDefaults() is not called
  await new UserCreationForm(page)
    .withFirstName('TestUser')
    .withLastName('AutoTest')
    .withEmail('')
    .withPhone('')
    .withPassword('!Abcd1234')
    .withConfirmPassword('!Abcd1234')
    .fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ---------------------------------------------------------------------------
// Password validation
// ---------------------------------------------------------------------------

export async function invalidPasswordEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPassword('').withConfirmPassword('').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidPasswordTooShort(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPassword('Ab1!').withConfirmPassword('Ab1!').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidPasswordNoUppercase(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPassword('!abcd1234').withConfirmPassword('!abcd1234').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidPasswordNoLowercase(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPassword('!ABCD1234').withConfirmPassword('!ABCD1234').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidPasswordNoDigit(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPassword('!Abcdefgh').withConfirmPassword('!Abcdefgh').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidPasswordNoSpecialChar(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPassword('Abcd12345').withConfirmPassword('Abcd12345').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ---------------------------------------------------------------------------
// Confirm password validation
// ---------------------------------------------------------------------------

export async function invalidConfirmPasswordMismatch(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page)
    .withDefaults()
    .withPassword('!Abcd1234')
    .withConfirmPassword('!Abcd5678')
    .fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

export async function invalidConfirmPasswordEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page)
    .withDefaults()
    .withPassword('!Abcd1234')
    .withConfirmPassword('')
    .fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ---------------------------------------------------------------------------
// Blanket
// ---------------------------------------------------------------------------

export async function invalidAllFieldsEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ---------------------------------------------------------------------------
// Boundary / positive guards
// ---------------------------------------------------------------------------

export async function validPasswordBoundaryMinimum(page: Page): Promise<void> {
  await reachStep2(page);
  const minPassword = '!Abcd123'; // exactly 8 chars, meets all rules
  await new UserCreationForm(page)
    .withDefaults()
    .withPassword(minPassword)
    .withConfirmPassword(minPassword)
    .fill();
  await proceedFromStep2ToStep3(page);
  await expectNoValidationError(page);
}

export async function validNameWithHyphenOrApostrophe(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page)
    .withDefaults()
    .withFirstName("Mary-Jane")
    .withLastName("O'Brien")
    .fill();
  await proceedFromStep2ToStep3(page);
  await expectNoValidationError(page);
}