import { test, expect } from '@playwright/test';
import { HomePage } from '@pages/home/HomePage';
import { SelectionStep } from '@pages/user-mgmt/staffs/create/steps/SelectionStep';
import {
  generateRandomEmail,
  generateRandomPhoneNumber,
} from '../../testDataGenerators';
import {
  USER_MANAGEMENT_ADMIN_ROLES,
  USER_MANAGEMENT_STAFF_ROLES,
} from '../helpers/roles';

type UserData = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
  phone: string;
};

const formTest = test.extend<{ selectionStep: SelectionStep }>({
  selectionStep: async ({ page }, use) => {
    const createUserForm = new SelectionStep(page);
    createUserForm.goto();

    await createUserForm.waitForReady();
    await use(createUserForm);
  },
});

function validUser(overrides: Partial<UserData> = {}): UserData {
  return {
    firstName: 'TestUser',
    lastName: 'AutoTest',
    email: generateRandomEmail(),
    role: 'branch-admin',
    password: '!Abcd1234',
    confirmPassword: '!Abcd1234',
    phone: generateRandomPhoneNumber(),
    ...overrides,
  };
}

async function goToBasicInfoStep(selectionStep: SelectionStep) {
  const basicInfoStep = await selectionStep.next();
  await basicInfoStep.waitForReady();
  return basicInfoStep;
}

async function expectBasicInfoValidation(
  selectionStep: SelectionStep,
  userData?: UserData,
): Promise<void> {
  const basicInfoStep = await goToBasicInfoStep(selectionStep);
  if (userData) await basicInfoStep.fill(userData);
  await basicInfoStep.next();
  await expect(basicInfoStep.validationError).toBeVisible();
}

// Admin roles - happy path

test.describe('User Management - Create User', () => {
  for (const role of USER_MANAGEMENT_ADMIN_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test('creates a user successfully', async ({ page }) => {
        const home = new HomePage(page);
        await home.goto();

        const userMgmt = await home.goToUserManagement();
        const merchantStaffs = await userMgmt.goToMerchantStaffs();
        const selectionStep = await merchantStaffs.openCreateStaffForm();
        await selectionStep.waitForReady();

        const basicInfoStep = await selectionStep.next();
        await basicInfoStep.waitForReady();
        await basicInfoStep.fill(validUser());

        const reviewStep = await basicInfoStep.next();
        await reviewStep.waitForReady();
        await reviewStep.submit();

        await expect(reviewStep.successAlert).toBeVisible();
      });
    });
  }
});

// Admin roles - basic-info validation

formTest.describe('User Management - Create User Validation', () => {
  for (const role of USER_MANAGEMENT_ADMIN_ROLES) {
    formTest.describe(`${role.label} ${role.tag}`, () => {
      formTest('rejects an empty first name', async ({ selectionStep }) => {
        await expectBasicInfoValidation(selectionStep, validUser({ firstName: '' }));
      });

      formTest('rejects an empty email', async ({ selectionStep }) => {
        await expectBasicInfoValidation(selectionStep, validUser({ email: '' }));
      });

      formTest('rejects an email missing @', async ({ selectionStep }) => {
        await expectBasicInfoValidation(selectionStep, validUser({ email: 'notanemail.com' }));
      });

      formTest('rejects an email missing domain', async ({ selectionStep }) => {
        await expectBasicInfoValidation(selectionStep, validUser({ email: 'user@' }));
      });

      formTest('rejects an email missing local part', async ({ selectionStep }) => {
        await expectBasicInfoValidation(selectionStep, validUser({ email: '@domain.com' }));
      });

      formTest.skip('rejects a duplicate email', async () => {
        // Requires a review-submit validation locator or a dedicated flow helper for
        // reopening the create-user form after the first successful submission.
      });

      formTest('rejects a non-numeric phone number', async ({ selectionStep }) => {
        const basicInfoStep = await goToBasicInfoStep(selectionStep);
        await basicInfoStep.fill(validUser({ phone: 'abc-defg-hij' }));
        await expect(basicInfoStep.phoneInput).toHaveValue('');
      });

      formTest('rejects a phone number that is too short', async ({ selectionStep }) => {
        await expectBasicInfoValidation(selectionStep, validUser({ phone: '123' }));
      });

      formTest('rejects a phone number that is too long', async ({ selectionStep }) => {
        await expectBasicInfoValidation(selectionStep, validUser({ phone: '1'.repeat(16) }));
      });

      formTest.skip('rejects when no role is selected', async ({ selectionStep }) => {
        const basicInfoStep = await goToBasicInfoStep(selectionStep);
        // TODO: Figure out how to do this.
      });

      formTest('rejects an empty password', async ({ selectionStep }) => {
        await expectBasicInfoValidation(
          selectionStep,
          validUser({ password: '', confirmPassword: '' }),
        );
      });

      formTest('rejects a password that is too short', async ({ selectionStep }) => {
        await expectBasicInfoValidation(
          selectionStep,
          validUser({ password: 'Ab1!', confirmPassword: 'Ab1!' }),
        );
      });

      formTest('rejects a password missing uppercase', async ({ selectionStep }) => {
        await expectBasicInfoValidation(
          selectionStep,
          validUser({ password: '!abcd1234', confirmPassword: '!abcd1234' }),
        );
      });

      formTest('rejects a password missing lowercase', async ({ selectionStep }) => {
        await expectBasicInfoValidation(
          selectionStep,
          validUser({ password: '!ABCD1234', confirmPassword: '!ABCD1234' }),
        );
      });

      formTest('rejects a password missing a digit', async ({ selectionStep }) => {
        await expectBasicInfoValidation(
          selectionStep,
          validUser({ password: '!Abcdefgh', confirmPassword: '!Abcdefgh' }),
        );
      });

      formTest('rejects a password missing a special character', async ({ selectionStep }) => {
        await expectBasicInfoValidation(
          selectionStep,
          validUser({ password: 'Abcd12345', confirmPassword: 'Abcd12345' }),
        );
      });

      formTest('rejects a confirm password mismatch', async ({ selectionStep }) => {
        await expectBasicInfoValidation(
          selectionStep,
          validUser({ password: '!Abcd1234', confirmPassword: '!Abcd5678' }),
        );
      });

      formTest('rejects an empty confirm password', async ({ selectionStep }) => {
        await expectBasicInfoValidation(
          selectionStep,
          validUser({ password: '!Abcd1234', confirmPassword: '' }),
        );
      });

      formTest('rejects all fields empty', async ({ selectionStep }) => {
        await expectBasicInfoValidation(selectionStep);
      });

      formTest('accepts the minimum valid password length', async ({ selectionStep }) => {
        const basicInfoStep = await goToBasicInfoStep(selectionStep);
        const minPassword = '!Abcd123';

        await basicInfoStep.fill(
          validUser({
            password: minPassword,
            confirmPassword: minPassword,
          }),
        );

        const reviewStep = await basicInfoStep.next();
        await reviewStep.waitForReady();
        await expect(basicInfoStep.validationError).not.toBeVisible();
      });

      formTest('accepts a name with a hyphen or apostrophe', async ({ selectionStep }) => {
        const basicInfoStep = await goToBasicInfoStep(selectionStep);

        await basicInfoStep.fill(
          validUser({
            firstName: 'Mary-Jane',
            lastName: "O'Brien",
          }),
        );

        const reviewStep = await basicInfoStep.next();
        await reviewStep.waitForReady();
        await expect(basicInfoStep.validationError).not.toBeVisible();
      });
    });
  }
});

// Staff roles - access control only

test.describe('User Management - Access Control', () => {
  for (const role of USER_MANAGEMENT_STAFF_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test('does not show the create staff option', async ({ page }) => {
        const home = new HomePage(page);
        await home.goto();

        const userManagement = await home.goToUserManagement();
        await expect(userManagement.merchantStaffsLink).not.toBeVisible();
      });
    });
  }
});