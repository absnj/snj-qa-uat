import { Page, expect } from '@playwright/test';
import { generateRandomEmail, generateRandomPhoneNumber } from '../utils/testDataGenerators';

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

const SELECTORS = {
  nav: {
    logo: (page: Page) => page.getByRole('link', { name: 'Shop n Joy Logo' }),
    userManagement: (page: Page) => page.getByRole('link', { name: 'User Management User' }),
    merchantStaffs: (page: Page) => page.getByRole('link', { name: 'Merchant/Branch Staffs' }),
  },
  headings: {
    userDetails: (page: Page) => page.getByRole('heading', { name: 'User Details' }),
    createMerchantStaff: (page: Page) =>
      page.getByRole('heading', { name: 'Create Merchant Staff' }),
  },
  buttons: {
    create: (page: Page) => page.getByRole('button', { name: 'Create' }),
    next: (page: Page) => page.getByRole('button', { name: 'Next' }),
    createStaff: (page: Page) => page.getByRole('button', { name: 'Create Staff' }),
  },
  steps: {
    basicInformation: (page: Page) => page.getByText('Basic Information'),
    review: (page: Page) => page.getByText('Review', { exact: true }),
  },
  form: {
    firstName: (page: Page) =>
      page.getByText('First Name * Last Name').getByRole('textbox').first(),
    lastName: (page: Page) =>
      page.getByText('First Name * Last Name').getByRole('textbox').nth(1),
    email: (page: Page) => page.locator('input[type="email"]'),
    phone: (page: Page) => page.getByRole('textbox').nth(3),
    roleDropdown: (page: Page) =>
      page.getByRole('combobox').filter({ hasText: 'Select a role' }),
    roleOption: (page: Page, role: string) => page.getByRole('option', { name: role }),
    password: (page: Page) => page.getByRole('textbox').nth(4),
    confirmPassword: (page: Page) => page.getByRole('textbox').nth(5),
  },
  alerts: {
    success: (page: Page) => page.getByRole('alert', { name: 'Success' }),
    successMessage: (page: Page) =>
      page
        .getByRole('alert', { name: 'Success' })
        .getByText('Staff created successfully.', { exact: true }),
    validationError: (page: Page) =>
      page.getByRole('alert', { name: 'Please fix the following' }),
  },
};

export { SELECTORS };

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export async function navigateToUserManagement(page: Page): Promise<void> {
  await SELECTORS.nav.logo(page).click();
  await SELECTORS.nav.userManagement(page).click();
  await expect(SELECTORS.headings.userDetails(page)).toBeVisible();
}

export async function navigateToCreateUser(page: Page): Promise<void> {
  await navigateToUserManagement(page);
  await SELECTORS.nav.merchantStaffs(page).click();
  await SELECTORS.buttons.create(page).click();
  await expect(SELECTORS.headings.createMerchantStaff(page)).toBeVisible();
}

// ---------------------------------------------------------------------------
// Step navigation
// ---------------------------------------------------------------------------

export async function proceedFromStep1ToStep2(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
  await expect(SELECTORS.steps.basicInformation(page)).toBeVisible();
}

export async function proceedFromStep2ToStep3(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
  await expect(SELECTORS.steps.review(page)).toBeVisible();
}

/**
 * Used in validation tests — clicks Next but expects to stay on Step 2.
 * Does NOT assert Step 3 is reached.
 */
export async function attemptProceedFromStep2(page: Page): Promise<void> {
  await SELECTORS.buttons.next(page).click();
}

export async function submitCreateStaff(page: Page): Promise<void> {
  await SELECTORS.buttons.createStaff(page).click();
}

// ---------------------------------------------------------------------------
// Field interactions
// ---------------------------------------------------------------------------

export async function fillFirstName(page: Page, value: string): Promise<void> {
  const field = SELECTORS.form.firstName(page);
  await field.click();
  await field.fill(value);
}

export async function fillLastName(page: Page, value: string): Promise<void> {
  const field = SELECTORS.form.lastName(page);
  await field.click();
  await field.fill(value);
}

export async function fillEmail(page: Page, value: string): Promise<void> {
  const field = SELECTORS.form.email(page);
  await field.click();
  await field.fill(value);
}

export async function fillPhoneNumber(page: Page, value: string): Promise<void> {
  const field = SELECTORS.form.phone(page);
  await field.click();
  await field.fill(value);
}

export async function selectRole(page: Page, role: string): Promise<void> {
  await SELECTORS.form.roleDropdown(page).click();
  await SELECTORS.form.roleOption(page, role).click();
}

export async function fillPassword(page: Page, value: string): Promise<void> {
  const field = SELECTORS.form.password(page);
  await field.click();
  await field.fill(value);
}

export async function fillConfirmPassword(page: Page, value: string): Promise<void> {
  const field = SELECTORS.form.confirmPassword(page);
  await field.click();
  await field.fill(value);
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

export async function expectUserCreatedSuccess(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.success(page)).toBeVisible();
  await expect(SELECTORS.alerts.successMessage(page)).toBeVisible();
}

export async function expectValidationError(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.validationError(page)).toBeVisible();
}

export async function expectNoValidationError(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.validationError(page)).not.toBeVisible();
}

// ---------------------------------------------------------------------------
// UserCreationForm — fluent builder
// ---------------------------------------------------------------------------

export type FormData = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
};

const VALID_DEFAULTS: Required<Omit<FormData, 'email' | 'phone'>> = {
  firstName: 'TestUser',
  lastName: 'AutoTest',
  role: 'branch-staff',
  password: '!Abcd1234',
  confirmPassword: '!Abcd1234',
};

export class UserCreationForm {
  private data: FormData = {};

  constructor(private readonly page: Page) {}

  withFirstName(v: string)      { this.data.firstName       = v; return this; }
  withLastName(v: string)       { this.data.lastName        = v; return this; }
  withEmail(v: string)          { this.data.email           = v; return this; }
  withPhone(v: string)          { this.data.phone           = v; return this; }
  withRole(v: string)           { this.data.role            = v; return this; }
  withPassword(v: string)       { this.data.password        = v; return this; }
  withConfirmPassword(v: string){ this.data.confirmPassword = v; return this; }

  /**
   * Fills valid defaults for every field not explicitly set.
   * Email and phone are generated fresh per call so each test gets unique data.
   */
  withDefaults() {
    this.data = {
      firstName:       this.data.firstName       ?? VALID_DEFAULTS.firstName,
      lastName:        this.data.lastName        ?? VALID_DEFAULTS.lastName,
      email:           this.data.email           ?? generateRandomEmail(),
      phone:           this.data.phone           ?? generateRandomPhoneNumber(),
      role:            this.data.role            ?? VALID_DEFAULTS.role,
      password:        this.data.password        ?? VALID_DEFAULTS.password,
      confirmPassword: this.data.confirmPassword ?? VALID_DEFAULTS.confirmPassword,
    };
    return this;
  }

  /**
   * Fills only the fields that have been set. Unset fields are skipped,
   * allowing deliberate omission for "missing required field" tests.
   */
  async fill(): Promise<FormData> {
    const { page, data } = this;
    if (data.firstName       !== undefined) await fillFirstName(page, data.firstName);
    if (data.lastName        !== undefined) await fillLastName(page, data.lastName);
    if (data.email           !== undefined) await fillEmail(page, data.email);
    if (data.phone           !== undefined) await fillPhoneNumber(page, data.phone);
    if (data.role            !== undefined) await selectRole(page, data.role);
    if (data.password        !== undefined) await fillPassword(page, data.password);
    if (data.confirmPassword !== undefined) await fillConfirmPassword(page, data.confirmPassword);
    return data;
  }

  get filledData(): FormData {
    return { ...this.data };
  }
}