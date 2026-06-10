import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home/HomePage';
import { CreateUserPage } from '../../pages/user-mgmt/staffs/CreateUserPage';
import { StaffsPage } from '../../pages/user-mgmt/StaffsPage';
import {
  gotoUat,
  USER_MANAGEMENT_ADMIN_ROLES,
  USER_MANAGEMENT_STAFF_ROLES,
} from '../helpers/roles';

// ---------------------------------------------------------------------------
// Shared setup helper — navigates to step 2 of the create-user flow
// ---------------------------------------------------------------------------

async function reachStep2(createUser: CreateUserPage): Promise<void> {
  await createUser.proceedFromStep1();
}

// ---------------------------------------------------------------------------
// Admin roles — full create-user suite
// ---------------------------------------------------------------------------

test.describe('User Management', () => {
  for (const role of USER_MANAGEMENT_ADMIN_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {

      test.beforeEach(async ({ page }) => {
        const home = new HomePage(page);
        await home.goto();
      });

      test('creates a user successfully', async ({ page }) => {
        const home = new HomePage(page);
        const myDetails = await home.goToUserManagement(); // navigating to user management lands on My Details page
        const merchantStaffs = await myDetails.goToMerchantStaffs();
        const createUser = await merchantStaffs.openCreateUser();
        await reachStep2(createUser);
        const { email } = await createUser.form().withDefaults().fill();
        await createUser.proceedFromStep2();
        await createUser.submitCreateStaff();
        await expect(createUser.successAlert).toBeVisible();
      });

      // --- First Name ---

      test('rejects an empty first name', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withFirstName('').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test.skip('rejects a first name with special characters', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withFirstName('Test@123!').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test.skip('rejects a first name that is too long', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withFirstName('A'.repeat(101)).fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      // --- Email ---

      test('rejects an empty email', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withEmail('').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test('rejects an email missing @', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withEmail('notanemail.com').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test('rejects an email missing domain', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withEmail('user@').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test('rejects an email missing local part', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withEmail('@domain.com').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test('rejects a duplicate email', async ({ page }) => {
        // First pass — create the user and capture their email
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        const { email } = await createUser.form().withDefaults().fill();
        await createUser.proceedFromStep2();
        await createUser.submitCreateStaff();
        await expect(createUser.successAlert).toBeVisible();

        // Second pass — attempt to reuse the same email
        const createUser2 = await navigateToCreateUser(page);
        await reachStep2(createUser2);
        await createUser2.form().withDefaults().withEmail(email!).fill();
        await createUser2.proceedFromStep2();
        await createUser2.submitCreateStaff();
        await expect(createUser2.validationAlert).toBeVisible();
      });

      // --- Phone ---

      test('rejects a non-numeric phone number', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withPhone('abc-defg-hij').fill();
        await expect(createUser.phoneFieldLocator).toHaveValue('');
      });

      test('rejects a phone number that is too short', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withPhone('123').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test('rejects a phone number that is too long', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withPhone('1'.repeat(16)).fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      // --- Role ---

      test('rejects when no role is selected', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form()
          .withFirstName('TestUser')
          .withLastName('AutoTest')
          .withEmail('')
          .withPhone('')
          .withPassword('!Abcd1234')
          .withConfirmPassword('!Abcd1234')
          .fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      // --- Password ---

      test('rejects an empty password', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withPassword('').withConfirmPassword('').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test('rejects a password that is too short', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withPassword('Ab1!').withConfirmPassword('Ab1!').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test('rejects a password missing uppercase', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withPassword('!abcd1234').withConfirmPassword('!abcd1234').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test('rejects a password missing lowercase', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withPassword('!ABCD1234').withConfirmPassword('!ABCD1234').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test('rejects a password missing a digit', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withPassword('!Abcdefgh').withConfirmPassword('!Abcdefgh').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test('rejects a password missing a special character', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withPassword('Abcd12345').withConfirmPassword('Abcd12345').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      // --- Confirm password ---

      test('rejects a confirm password mismatch', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withPassword('!Abcd1234').withConfirmPassword('!Abcd5678').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      test('rejects an empty confirm password', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form().withDefaults().withPassword('!Abcd1234').withConfirmPassword('').fill();
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      // --- Blanket ---

      test('rejects all fields empty', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.attemptProceedFromStep2();
        await expect(createUser.validationAlert).toBeVisible();
      });

      // --- Boundary / positive guards ---

      test('accepts the minimum valid password length', async ({ page }) => {
        const createUser  = await navigateToCreateUser(page);
        const minPassword = '!Abcd123'; // exactly 8 chars, meets all rules
        await reachStep2(createUser);
        await createUser.form()
          .withDefaults()
          .withPassword(minPassword)
          .withConfirmPassword(minPassword)
          .fill();
        await createUser.proceedFromStep2();
        await expect(createUser.validationAlert).not.toBeVisible();
      });

      test('accepts a name with a hyphen or apostrophe', async ({ page }) => {
        const createUser = await navigateToCreateUser(page);
        await reachStep2(createUser);
        await createUser.form()
          .withDefaults()
          .withFirstName("Mary-Jane")
          .withLastName("O'Brien")
          .fill();
        await createUser.proceedFromStep2();
        await expect(createUser.validationAlert).not.toBeVisible();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Staff roles — access control only
  // ---------------------------------------------------------------------------

  for (const role of USER_MANAGEMENT_STAFF_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test.beforeEach(async ({ page }) => {
        await gotoUat(page);
      });

      test('does not show the create staff option', async ({ page }) => {
        const home           = new HomePage(page);
        const userManagement = await home.goToUserManagement();
        await expect(userManagement.merchantStaffsLink).not.toBeVisible();
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Spec-local helper — DRY navigation to the create-user form
// ---------------------------------------------------------------------------

async function navigateToCreateUser(page: import('@playwright/test').Page): Promise<CreateUserPage> {
  const home = new HomePage(page);
  const myDetails = await home.goToUserManagement();
  const merchantStaffs = await myDetails.goToMerchantStaffs();
  const createUser = await merchantStaffs.openCreateUser();
  return createUser;
}
