import { Page, expect } from '@playwright/test';
import {
  navigateToCreateUser,
  proceedFromStep1ToStep2,
  proceedFromStep2ToStep3,
  submitCreateStaff,
  verifyUserCreatedInList,
  expectValidationError,
  expectNoValidationError,
  UserCreationForm,
  navigateToUserManagement,
  attemptProceedFromStep2,
} from './utils';

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

/**
 * Full happy-path user creation.
 * Returns credentials so the calling test can clean up or log in as the user.
 */
export async function createUserHappyPath(
  page: Page,
): Promise<{ email: string; password: string }> {
  await navigateToCreateUser(page);
  await proceedFromStep1ToStep2(page);

  const form = new UserCreationForm(page).withDefaults();
  const { email, password } = await form.fill();

  await proceedFromStep2ToStep3(page);
  await submitCreateStaff(page);
  await verifyUserCreatedInList(page, email!);

  return { email: email!, password: password! };
}

// ---------------------------------------------------------------------------
// Access-control smoke test
// ---------------------------------------------------------------------------

export async function staffUnableToCreate(page: Page): Promise<void> {
  await navigateToUserManagement(page);
  await expect(page.getByRole('button', { name: 'Create' })).not.toBeVisible();
}

// ---------------------------------------------------------------------------
// Shared setup: navigate to Step 2 ready to fill
// ---------------------------------------------------------------------------

async function reachStep2(page: Page): Promise<void> {
  await navigateToCreateUser(page);
  await proceedFromStep1ToStep2(page);
}

// ---------------------------------------------------------------------------
// Input validation flows
//
// Convention:
//   - Each function navigates fresh to Step 2, fills the form (one bad field),
//     attempts to proceed, and asserts the expected outcome.
//   - "invalid*" flows → expect a validation alert.
//   - "valid*" flows   → expect no validation alert (guard / boundary tests).
// ---------------------------------------------------------------------------

// ── First Name ──────────────────────────────────────────────────────────────

/** First Name left blank → should surface validation error */
export async function invalidFirstNameEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withFirstName('').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ── Email ───────────────────────────────────────────────────────────────────

export async function invalidEmailEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withEmail('').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

/** Missing @ symbol */
export async function invalidEmailMissingAt(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withEmail('notanemail.com').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

/** Missing domain */
export async function invalidEmailMissingDomain(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withEmail('user@').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

/** Missing local part */
export async function invalidEmailMissingLocal(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withEmail('@domain.com').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

/** Duplicate email (already registered) — requires a known existing email */
export async function invalidEmailDuplicate(page: Page): Promise<void> {
  // First creation — establish the duplicate
  const { email } = await createUserHappyPath(page);

  // Second creation — same email should fail
  await navigateToCreateUser(page);
  await proceedFromStep1ToStep2(page);
  await new UserCreationForm(page).withDefaults().withEmail(email).fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ── Phone ───────────────────────────────────────────────────────────────────

/** Non-numeric characters in phone */
export async function invalidPhoneNonNumeric(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPhone('abc-defg-hij').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

/** Too short — fewer digits than minimum */
export async function invalidPhoneTooShort(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPhone('123').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

/** Too long — more digits than maximum */
export async function invalidPhoneTooLong(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPhone('1'.repeat(16)).fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ── Role ────────────────────────────────────────────────────────────────────

/** No role selected → should surface validation error */
export async function invalidRoleNotSelected(page: Page): Promise<void> {
  await reachStep2(page);
  // Deliberately omit withRole() — withDefaults() sets it; we override by
  // building the form without a role field at all.
  await new UserCreationForm(page)
    .withFirstName('TestUser')
    .withLastName('AutoTest')
    .withEmail('')       // generates via withDefaults not called — so pass random directly
    .withPhone('')
    .withPassword('!Abcd1234')
    .withConfirmPassword('!Abcd1234')
    .fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ── Password ─────────────────────────────────────────────────────────────────

export async function invalidPasswordEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page).withDefaults().withPassword('').withConfirmPassword('').fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

/** Password too short (< 8 chars is a common minimum) */
export async function invalidPasswordTooShort(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page)
    .withDefaults()
    .withPassword('Ab1!')
    .withConfirmPassword('Ab1!')
    .fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

/** Password missing uppercase */
export async function invalidPasswordNoUppercase(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page)
    .withDefaults()
    .withPassword('!abcd1234')
    .withConfirmPassword('!abcd1234')
    .fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

/** Password missing lowercase */
export async function invalidPasswordNoLowercase(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page)
    .withDefaults()
    .withPassword('!ABCD1234')
    .withConfirmPassword('!ABCD1234')
    .fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

/** Password missing digit */
export async function invalidPasswordNoDigit(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page)
    .withDefaults()
    .withPassword('!Abcdefgh')
    .withConfirmPassword('!Abcdefgh')
    .fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

/** Password missing special character */
export async function invalidPasswordNoSpecialChar(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page)
    .withDefaults()
    .withPassword('Abcd12345')
    .withConfirmPassword('Abcd12345')
    .fill();
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ── Confirm Password ─────────────────────────────────────────────────────────

/** Confirm password does not match password */
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

// ── All fields empty (submit blank form) ─────────────────────────────────────

export async function invalidAllFieldsEmpty(page: Page): Promise<void> {
  await reachStep2(page);
  // Fill nothing — just try to proceed
  await attemptProceedFromStep2(page);
  await expectValidationError(page);
}

// ── Boundary / positive guard (should NOT error) ─────────────────────────────

/** Minimum acceptable password (8 chars, meets all rules) → no error */
export async function validPasswordBoundaryMinimum(page: Page): Promise<void> {
  await reachStep2(page);
  const minPassword = '!Abcd123'; // exactly 8 chars
  await new UserCreationForm(page)
    .withDefaults()
    .withPassword(minPassword)
    .withConfirmPassword(minPassword)
    .fill();
  await attemptProceedFromStep2(page);
  await expectNoValidationError(page);
}

/** Name with hyphen/apostrophe (O'Brien, Mary-Jane) → should be valid */
export async function validNameWithHyphenOrApostrophe(page: Page): Promise<void> {
  await reachStep2(page);
  await new UserCreationForm(page)
    .withDefaults()
    .withFirstName("Mary-Jane")
    .withLastName("O'Brien")
    .fill();
  await attemptProceedFromStep2(page);
  await expectNoValidationError(page);
}