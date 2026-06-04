import { test } from '@playwright/test';
import {
  createUserHappyPath,
  invalidAllFieldsEmpty,
  invalidConfirmPasswordEmpty,
  invalidConfirmPasswordMismatch,
  invalidEmailDuplicate,
  invalidEmailEmpty,
  invalidEmailMissingAt,
  invalidEmailMissingDomain,
  invalidEmailMissingLocal,
  invalidFirstNameEmpty,
  invalidPasswordEmpty,
  invalidPasswordNoDigit,
  invalidPasswordNoLowercase,
  invalidPasswordNoSpecialChar,
  invalidPasswordNoUppercase,
  invalidPasswordTooShort,
  invalidPhoneNonNumeric,
  invalidPhoneTooLong,
  invalidPhoneTooShort,
  invalidRoleNotSelected,
  staffUnableToCreate,
  validNameWithHyphenOrApostrophe,
  validPasswordBoundaryMinimum,
} from '../flows';
import {
  gotoUat,
  USER_MANAGEMENT_ADMIN_ROLES,
  USER_MANAGEMENT_STAFF_ROLES,
} from './helpers/roles';

test.describe('User Management', () => {
  for (const role of USER_MANAGEMENT_ADMIN_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test.beforeEach(async ({ page }) => {
        await gotoUat(page);
      });

      test('creates a user successfully', async ({ page }) => {
        await createUserHappyPath(page);
      });

      test('rejects an empty first name', async ({ page }) => {
        await invalidFirstNameEmpty(page);
      });

      test('rejects an empty email', async ({ page }) => {
        await invalidEmailEmpty(page);
      });

      test('rejects an email missing @', async ({ page }) => {
        await invalidEmailMissingAt(page);
      });

      test('rejects an email missing domain', async ({ page }) => {
        await invalidEmailMissingDomain(page);
      });

      test('rejects an email missing local part', async ({ page }) => {
        await invalidEmailMissingLocal(page);
      });

      test('rejects a duplicate email', async ({ page }) => {
        await invalidEmailDuplicate(page);
      });

      test('rejects a non-numeric phone number', async ({ page }) => {
        await invalidPhoneNonNumeric(page);
      });

      test('rejects a short phone number', async ({ page }) => {
        await invalidPhoneTooShort(page);
      });

      test('rejects a long phone number', async ({ page }) => {
        await invalidPhoneTooLong(page);
      });

      test('rejects a missing role selection', async ({ page }) => {
        await invalidRoleNotSelected(page);
      });

      test('rejects an empty password', async ({ page }) => {
        await invalidPasswordEmpty(page);
      });

      test('rejects a short password', async ({ page }) => {
        await invalidPasswordTooShort(page);
      });

      test('rejects a password missing uppercase', async ({ page }) => {
        await invalidPasswordNoUppercase(page);
      });

      test('rejects a password missing lowercase', async ({ page }) => {
        await invalidPasswordNoLowercase(page);
      });

      test('rejects a password missing digit', async ({ page }) => {
        await invalidPasswordNoDigit(page);
      });

      test('rejects a password missing special character', async ({ page }) => {
        await invalidPasswordNoSpecialChar(page);
      });

      test('rejects a confirm password mismatch', async ({ page }) => {
        await invalidConfirmPasswordMismatch(page);
      });

      test('rejects an empty confirm password', async ({ page }) => {
        await invalidConfirmPasswordEmpty(page);
      });

      test('rejects all fields empty', async ({ page }) => {
        await invalidAllFieldsEmpty(page);
      });

      test('accepts the minimum valid password length', async ({ page }) => {
        await validPasswordBoundaryMinimum(page);
      });

      test('accepts a name with hyphen or apostrophe', async ({ page }) => {
        await validNameWithHyphenOrApostrophe(page);
      });
    });
  }

  for (const role of USER_MANAGEMENT_STAFF_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test.beforeEach(async ({ page }) => {
        await gotoUat(page);
      });

      test('does not show the create staff option', async ({ page }) => {
        await staffUnableToCreate(page);
      });
    });
  }
});
