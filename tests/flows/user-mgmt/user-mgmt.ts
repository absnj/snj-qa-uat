import { Page } from '@playwright/test';
import {
  navigateToUserManagement,
  clickCreateUserButton,
  proceedFromStep1ToStep2,
  fillFirstName,
  fillLastName,
  fillEmail,
  fillPhoneNumber,
  selectRole,
  fillPassword,
  fillConfirmPassword,
  proceedFromStep2ToStep3,
  submitCreateStaff,
  verifyUserCreatedInList,
} from './utils';
import { generateRandomEmail, generateRandomPhoneNumber } from '../utils/testDataGenerators';

/**
 * Happy path flow: Create a user through all 3 steps
 * Step 1: Navigate to User Management
 * Step 2: Fill user details (First Name, Last Name, Email, Phone, Role, Password)
 * Step 3: Review and confirm creation
 */
export async function createUserHappyPath(
  page: Page,
): Promise<{ email: string; password: string }> {
  // Test data
  const firstName = 'TestUser';
  const lastName = 'AutoTest';
  const email = generateRandomEmail();
  const phoneNumber = generateRandomPhoneNumber();
  const password = '!Abcd1234';
  const role = 'branch-staff';

  // Step 1: Navigate to User Management and click Create
  await navigateToUserManagement(page);
  await clickCreateUserButton(page);
  await proceedFromStep1ToStep2(page);

  // Step 2: Fill user details
  await fillFirstName(page, firstName);
  await fillLastName(page, lastName);
  await fillEmail(page, email);
  await fillPhoneNumber(page, phoneNumber);
  await selectRole(page, role);
  await fillPassword(page, password);
  await fillConfirmPassword(page, password);
  await proceedFromStep2ToStep3(page);

  // Step 3: Review and submit
  await submitCreateStaff(page);

  // Verify user created in list
  await verifyUserCreatedInList(page, email);

  return { email, password };
}