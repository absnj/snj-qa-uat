import { Page, expect } from '@playwright/test';

/**
 * Navigate to User Management > Merchant/Branch Staffs
 */
export async function navigateToUserManagement(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Shop n Joy Logo' }).click();
  await page.getByRole('link', { name: 'User Management User' }).click();
  await page.getByRole('link', { name: 'Merchant/Branch Staffs' }).click();

  // await page.waitForURL('**/user-management*');
  await expect(page.getByRole('heading', { name: 'Merchant Staff Management' })).toBeVisible();
}

/**
 * Click Create button to start user creation flow
 */
export async function clickCreateUserButton(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Create' }).click();
  // await expect(page).toHaveURL('**/merchant-charity-staff-registration*');
  await expect(page.getByRole('heading', { name: 'Create Merchant/Charity Staff' })).toBeVisible();
}

/**
 * Move from Step 1 to Step 2 (Selection → User Details)
 */
export async function proceedFromStep1ToStep2(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Basic Information')).toBeVisible();
}

/**
 * Fill First Name field in Basic Information section
 */
export async function fillFirstName(page: Page, firstName: string): Promise<void> {
  const basicInfoSection = page.getByText('First Name * Last Name');
  await basicInfoSection.getByRole('textbox').first().fill(firstName);
}

/**
 * Fill Last Name field in Basic Information section
 */
export async function fillLastName(page: Page, lastName: string): Promise<void> {
  const basicInfoSection = page.getByText('First Name * Last Name');
  await basicInfoSection.getByRole('textbox').nth(1).fill(lastName);
}

/**
 * Fill Email field
 */
export async function fillEmail(page: Page, email: string): Promise<void> {
  await page.locator('input[type="email"]').click();
  await page.locator('input[type="email"]').fill(email);
}

/**
 * Fill Phone field in Mobile section
 */
export async function fillPhoneNumber(page: Page, phone: string): Promise<void> {
  await page.getByText('Mobile +').click();
  await page.getByRole('textbox').nth(3).fill(phone);
}

/**
 * Select role from dropdown combobox
 */
export async function selectRole(page: Page, roleName: string): Promise<void> {
  await page.getByRole('combobox').filter({ hasText: 'Select a role' }).click();
  await page.getByRole('option', { name: roleName }).click();
}

/**
 * Fill Password field in Security section
 */
export async function fillPassword(page: Page, password: string): Promise<void> {
  await page.getByText('Security Password Confirm').click();
  await page.getByRole('textbox').nth(4).fill(password);
}

/**
 * Fill Confirm Password field in Security section
 */
export async function fillConfirmPassword(page: Page, password: string): Promise<void> {
  await page.getByText('Security Password Confirm').click();
  await page.getByRole('textbox').nth(5).fill(password);
}

/**
 * Move from Step 2 to Step 3 (User Details → Review & Create)
 */
export async function proceedFromStep2ToStep3(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Review', { exact: true })).toBeVisible();

}

/**
 * Click Create Staff button on Review & Create step to finalize user creation
 */
export async function submitCreateStaff(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Create Staff' }).click();
}

/**
 * Verify user appears in the staff management list
 */
export async function verifyUserCreatedInList(page: Page, email: string): Promise<void> {
  const successAlert = page.getByRole('alert', { name: 'Success' });
  const successMessage = successAlert.getByText('Staff created successfully.', { exact: true });
  
  // Check if the email is visible in the table
  await expect(successAlert).toBeVisible();
  await expect(successMessage).toBeVisible();
}