import { Page } from '@playwright/test';
import { UserManagementBasePage } from './UserManagementBasePage';
import { generateRandomEmail, generateRandomPhoneNumber } from '../../testDataGenerators';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserFormData = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
};

// ---------------------------------------------------------------------------
// Page class
// ---------------------------------------------------------------------------

export class CreateUserPage extends UserManagementBasePage {
  // Step indicators
  private readonly basicInformationStep = this.page.getByText('Basic Information', { exact: true });

  // Navigation buttons
  private readonly nextButton        = this.page.getByRole('button', { name: 'Next' });
  private readonly createStaffButton = this.page.getByRole('button', { name: 'Create Staff' });

  // Form fields (step 2)
  private readonly firstNameField = this.page
    .getByText('First Name * Last Name')
    .getByRole('textbox')
    .first();
  private readonly lastNameField = this.page
    .getByText('First Name * Last Name')
    .getByRole('textbox')
    .nth(1);
  private readonly emailField           = this.page.locator('input[type="email"]');
  private readonly phoneField           = this.page.getByRole('textbox').nth(3);
  private readonly roleDropdown         = this.page.getByRole('combobox').filter({ hasText: 'Select a role' });
  private readonly passwordField        = this.page.getByRole('textbox').nth(4);
  private readonly confirmPasswordField = this.page.getByRole('textbox').nth(5);

  // Alerts — readonly so specs can assert on them directly
  readonly successAlert     = this.page.getByRole('alert', { name: 'Success' });
  readonly validationAlert  = this.page.getByRole('alert', { name: 'Please fix the following' });

  private readonly createMerchantStaffHeading = this.page.getByRole('heading', {
    name: 'Create Merchant Staff',
  });

  constructor(page: Page) {
    super(page);
  }

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  /** Step 1 → Step 2: advances past the role-selection step. */
  async proceedFromStep1(): Promise<void> {
    await this.nextButton.click();
    await this.basicInformationStep.waitFor({ state: 'visible' });
  }

  /**
   * Step 2 → Step 3: advances past the form.
   * Only call this when the form is valid — it waits for the Review step indicator.
   */
  async proceedFromStep2(): Promise<void> {
    await this.nextButton.click();
    await this.page.getByText('Review', { exact: true }).waitFor({ state: 'visible' });
  }

  /**
   * Clicks Next on step 2 without waiting for step 3.
   * Used by validation tests that expect to remain on step 2.
   */
  async attemptProceedFromStep2(): Promise<void> {
    await this.nextButton.click();
  }

  async submitCreateStaff(): Promise<void> {
    await this.createStaffButton.click();
  }

  // ---------------------------------------------------------------------------
  // Individual field fills
  // ---------------------------------------------------------------------------

  async fillFirstName(value: string): Promise<void> {
    await this.firstNameField.click();
    await this.firstNameField.fill(value);
  }

  async fillLastName(value: string): Promise<void> {
    await this.lastNameField.click();
    await this.lastNameField.fill(value);
  }

  async fillEmail(value: string): Promise<void> {
    await this.emailField.click();
    await this.emailField.fill(value);
  }

  async fillPhone(value: string): Promise<void> {
    await this.phoneField.click();
    await this.phoneField.fill(value);
  }

  async selectRole(role: string): Promise<void> {
    await this.roleDropdown.click();
    await this.page.getByRole('option', { name: role }).click();
  }

  async fillPassword(value: string): Promise<void> {
    await this.passwordField.click();
    await this.passwordField.fill(value);
  }

  async fillConfirmPassword(value: string): Promise<void> {
    await this.confirmPasswordField.click();
    await this.confirmPasswordField.fill(value);
  }

  // ---------------------------------------------------------------------------
  // Phone field assertion helper (phone rejects non-numeric silently)
  // ---------------------------------------------------------------------------

  get phoneFieldLocator() {
    return this.phoneField;
  }

  // ---------------------------------------------------------------------------
  // Fluent form builder
  // ---------------------------------------------------------------------------

  form(): UserFormBuilder {
    return new UserFormBuilder(this);
  }
}

// ---------------------------------------------------------------------------
// UserFormBuilder — fluent builder scoped to CreateUserPage
// ---------------------------------------------------------------------------

const VALID_DEFAULTS = {
  firstName:       'TestUser',
  lastName:        'AutoTest',
  role:            'branch-staff',
  password:        '!Abcd1234',
  confirmPassword: '!Abcd1234',
} as const;

export class UserFormBuilder {
  private data: UserFormData = {};

  constructor(private readonly createUserPage: CreateUserPage) {}

  withFirstName(v: string)       { this.data.firstName       = v; return this; }
  withLastName(v: string)        { this.data.lastName        = v; return this; }
  withEmail(v: string)           { this.data.email           = v; return this; }
  withPhone(v: string)           { this.data.phone           = v; return this; }
  withRole(v: string)            { this.data.role            = v; return this; }
  withPassword(v: string)        { this.data.password        = v; return this; }
  withConfirmPassword(v: string) { this.data.confirmPassword = v; return this; }

  /**
   * Fills valid defaults for every field not explicitly overridden.
   * Email and phone are generated fresh each call for test isolation.
   */
  withDefaults(): this {
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
   * Fills only the fields that have been explicitly set.
   * Unset fields are skipped, allowing deliberate omission in "missing required field" tests.
   */
  async fill(): Promise<UserFormData> {
    const { createUserPage: p, data } = this;
    if (data.firstName       !== undefined) await p.fillFirstName(data.firstName);
    if (data.lastName        !== undefined) await p.fillLastName(data.lastName);
    if (data.email           !== undefined) await p.fillEmail(data.email);
    if (data.phone           !== undefined) await p.fillPhone(data.phone);
    if (data.role            !== undefined) await p.selectRole(data.role);
    if (data.password        !== undefined) await p.fillPassword(data.password);
    if (data.confirmPassword !== undefined) await p.fillConfirmPassword(data.confirmPassword);
    return { ...this.data };
  }
}