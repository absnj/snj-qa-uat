import { test } from '@playwright/test';
import * as flows from '../flows';

test.describe('UAT matrix role: Merchant Admin', () => {

  test.describe('Feature tests', () => {
    test.beforeEach(async ({ page }) => {
      await flows.loginAs(page, 'MERCHANT_ADMIN');
    });

    test('Merchant Admin creates user - success [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: User created and visible in list

      await flows.createUserHappyPath(page);
    });

    test('First name empty - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidFirstNameEmpty(page);
    });

    test('Email empty - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidEmailEmpty(page);
    });

    test('Email missing @ symbol - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidEmailMissingAt(page);
    });

    test('Email missing domain - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidEmailMissingDomain(page);
    });

    test('Email missing local part - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidEmailMissingLocal(page);
    });

    test('Duplicate email - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidEmailDuplicate(page);
    });

    test('Phone non-numeric - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidPhoneNonNumeric(page);
    });

    test('Phone too short - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidPhoneTooShort(page);
    });

    test('Phone too long - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidPhoneTooLong(page);
    });

    test('No role selected - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidRoleNotSelected(page);
    });

    test('Password empty - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidPasswordEmpty(page);
    });

    test('Password too short - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidPasswordTooShort(page);
    });

    test('Password missing uppercase - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidPasswordNoUppercase(page);
    });

    test('Password missing lowercase - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidPasswordNoLowercase(page);
    });

    test('Password missing digit - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidPasswordNoDigit(page);
    });

    test('Password missing special character - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidPasswordNoSpecialChar(page);
    });

    test('Confirm password mismatch - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidConfirmPasswordMismatch(page);
    });

    test('Confirm password empty - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidConfirmPasswordEmpty(page);
    });

    test('All fields empty - creation fails [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: Show validation error

      await flows.invalidAllFieldsEmpty(page);
    });

    test('Password at minimum length - creation succeeds [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: No validation error

      await flows.validPasswordBoundaryMinimum(page);
    });

    test('Name with hyphen or apostrophe - creation succeeds [User Management | create]', async ({ page, context }) => {
      // Role: Merchant Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: No validation error

      await flows.validNameWithHyphenOrApostrophe(page);
    });

  });

});
