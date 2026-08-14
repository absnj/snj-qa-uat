import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { SalesCrmBasePage, startsWithText } from './SalesCrmBasePage';

export type ContactSource = 'Website' | 'Referral' | 'Social media' | 'Networking' | 'Cold call';

export type LeadBusinessData = {
  /** Required. The working name the pipeline shows for this opportunity. */
  name: string;
  /** Required; the form defaults it to Referral. */
  source?: ContactSource;
  /** Required. */
  category: string;
  /** Required, but the field only renders once a category is chosen. */
  subCategory: string;
  uen?: string;
  branches?: string;
  /** Business email and phone are an either/or pair — at least one is required. */
  email?: string;
  /** Local part only; the +65 country code is fixed alongside the field. */
  phone?: string;
  /**
   * Required. Typing here opens a places-autocomplete list; picking a
   * suggestion fills City and Postal Code.
   */
  addressSearch?: string;
  addressSuggestion?: string;
  city?: string;
  state?: string;
  floor?: string;
  unitNo?: string;
  postalCode?: string;
};

export type ContactPersonData = {
  firstName: string;
  lastName?: string;
  /** Required. Free text, e.g. "Owner". */
  role: string;
  workEmail?: string;
  mobile?: string;
  /** Defaults to on. */
  decisionMaker?: boolean;
};

/**
 * "Capture a lead" at `/track/crm/contact/create-lead`.
 *
 * A created lead is assigned to the signed-in agent automatically and enters
 * the pipeline in Lead status. There is no delete in this UI — a lead can only
 * be closed as Lost or Archived — so `submit()` is deliberately absent until a
 * cleanup capability exists. Everything here stops short of creating a record.
 *
 * Invalid submits surface twice: an inline `span.form-error` under each
 * offending `.form-group`, and a toast listing every offending field by name.
 */
export class CaptureLeadPage extends SalesCrmBasePage {
  private readonly sectionLabel: Locator;
  private readonly backButton: Locator;

  private readonly nameInput: Locator;
  private readonly sourceTrigger: Locator;
  private readonly categoryTrigger: Locator;
  private readonly subCategoryTrigger: Locator;
  private readonly uenInput: Locator;
  private readonly uenSearchButton: Locator;
  private readonly branchesInput: Locator;
  private readonly emailInput: Locator;
  private readonly phoneInput: Locator;
  private readonly countryTrigger: Locator;

  private readonly addressSearchInput: Locator;
  private readonly addressSuggestions: Locator;
  private readonly cityInput: Locator;
  private readonly stateInput: Locator;
  private readonly floorInput: Locator;
  private readonly unitNoInput: Locator;
  private readonly postalCodeInput: Locator;

  private readonly addFirstPersonButton: Locator;
  private readonly addAnotherPersonButton: Locator;
  private readonly personCards: Locator;

  private readonly ownerNotice: Locator;
  private readonly createLeadButton: Locator;
  private readonly validationSummary: Locator;

  constructor(page: Page) {
    super(page);

    // This page carries no heading element at all — the "Capture a lead" <h1>
    // was removed from the app between 2026-07-31 and 2026-08-03 — so readiness
    // anchors on the first section label and the submit button instead.
    this.sectionLabel = this.page.getByText('Business lead', { exact: true });
    this.backButton = this.page.getByRole('button', { name: 'Back' });

    this.nameInput = this.textField('Lead / working name');
    this.sourceTrigger = this.selectTrigger('Contact source');
    this.categoryTrigger = this.selectTrigger('Category');
    this.subCategoryTrigger = this.selectTrigger('Sub-Category');
    this.uenInput = this.textField('UEN / Business registration number');
    this.uenSearchButton = this.page.getByRole('button', { name: 'Search and auto-fill' });
    this.branchesInput = this.numberField('Number of branches');
    this.emailInput = this.textField('Business email');
    this.phoneInput = this.textField('Business phone');
    this.countryTrigger = this.selectTrigger('Country / region');

    this.addressSearchInput = this.page.getByRole('textbox', { name: 'Enter address or landmark...' });
    // Suggestions render as plain clickable divs inside the Address group with
    // no list/option roles, so they are matched by their visible text.
    this.addressSuggestions = this.formGroup('Address').getByText(/, Singapore/);
    this.cityInput = this.page.getByRole('textbox', { name: 'City' });
    this.stateInput = this.page.getByRole('textbox', { name: 'State' });
    this.floorInput = this.page.getByRole('textbox', { name: 'Floor' });
    this.unitNoInput = this.page.getByRole('textbox', { name: 'Unit No' });
    this.postalCodeInput = this.page.getByRole('textbox', { name: 'Postal code' });

    this.addFirstPersonButton = this.page.getByRole('button', { name: 'Add a contact person' });
    this.addAnotherPersonButton = this.page.getByRole('button', { name: 'Add another person' });
    this.personCards = this.page.locator('.person-card');

    this.ownerNotice = this.page.getByText('This lead is assigned to you automatically.');
    this.createLeadButton = this.page.getByRole('button', { name: 'Create lead' });
    this.validationSummary = this.page.getByRole('alert', { name: 'Please fix the following fields' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/track/crm/contact/create-lead');
    await this.waitForReady();
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.sectionLabel).toBeVisible();
    await expect(this.createLeadButton).toBeVisible();
  }

  // Parameterised locators

  /** The inline error message rendered under a field's `.form-group`. */
  private fieldError(label: string): Locator {
    return this.formGroup(label).locator('span.form-error');
  }

  /** Contact-person rows repeat the same labels, so each is scoped to its card. */
  private personCard(index: number): Locator {
    return this.personCards.filter({ hasText: `Person ${index}` });
  }

  private personField(index: number, label: string): Locator {
    return this.personCard(index)
      .locator('.form-group')
      .filter({ has: this.page.locator('label').filter({ hasText: startsWithText(label) }) })
      .getByRole('textbox');
  }

  // Business details

  async fillBusinessDetails(data: LeadBusinessData): Promise<void> {
    await this.nameInput.fill(data.name);

    if (data.source) {
      await this.chooseSelectOption(this.sourceTrigger, data.source);
    }

    if (data.category) {
      await this.selectCategory(data.category, data.subCategory);
    }

    if (data.uen) {
      await this.uenInput.fill(data.uen);
    }
    if (data.branches) {
      await this.branchesInput.fill(data.branches);
    }
    if (data.email) {
      await this.emailInput.fill(data.email);
    }
    if (data.phone) {
      await this.phoneInput.fill(data.phone);
    }
    if (data.addressSearch) {
      await this.pickAddress(data.addressSearch, data.addressSuggestion);
    }
    if (data.city) {
      await this.cityInput.fill(data.city);
    }
    if (data.state) {
      await this.stateInput.fill(data.state);
    }
    if (data.floor) {
      await this.floorInput.fill(data.floor);
    }
    if (data.unitNo) {
      await this.unitNoInput.fill(data.unitNo);
    }
    if (data.postalCode) {
      await this.postalCodeInput.fill(data.postalCode);
    }
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  /** Sub-Category only mounts once a category is chosen, and is then required. */
  async selectCategory(category: string, subCategory?: string): Promise<void> {
    await this.chooseSelectOption(this.categoryTrigger, category);
    await expect(this.subCategoryTrigger).toBeVisible();
    if (subCategory) {
      await this.chooseSelectOption(this.subCategoryTrigger, subCategory);
    }
  }

  async selectCountry(country: string): Promise<void> {
    await this.chooseSelectOption(this.countryTrigger, country);
  }

  /**
   * Types into the address autocomplete and takes a suggestion, which fills
   * City and Postal Code from the matched place. Defaults to the first
   * suggestion when none is named.
   */
  async pickAddress(search: string, suggestion?: string): Promise<void> {
    await this.addressSearchInput.fill(search);
    const option = suggestion
      ? this.addressSuggestions.filter({ hasText: suggestion })
      : this.addressSuggestions.first();
    await option.click();
  }

  /**
   * Runs the UEN lookup, which extracts a business profile and fills what it
   * finds. The button reads "Extracting profile..." while it runs; an unknown
   * UEN completes silently and leaves the form untouched.
   */
  async searchUenAndAutoFill(uen: string): Promise<void> {
    await this.uenInput.fill(uen);
    await expect(this.uenSearchButton).toBeEnabled();
    await this.uenSearchButton.click();
    await expect(this.uenSearchButton).toHaveText('Search and auto-fill');
  }

  // Contact people

  /** A lead can be created from business details alone; people are optional. */
  async addContactPerson(data: ContactPersonData): Promise<void> {
    const existing = await this.personCards.count();
    await (existing === 0 ? this.addFirstPersonButton : this.addAnotherPersonButton).click();

    const index = existing + 1;
    await expect(this.personCard(index)).toBeVisible();

    await this.personField(index, 'First name').fill(data.firstName);
    if (data.lastName) {
      await this.personField(index, 'Last name').fill(data.lastName);
    }
    await this.personField(index, 'Role / title').fill(data.role);
    if (data.workEmail) {
      await this.personField(index, 'Work email').fill(data.workEmail);
    }
    if (data.mobile) {
      await this.personField(index, 'Mobile').fill(data.mobile);
    }
    if (data.decisionMaker === false) {
      await this.personCard(index).getByRole('switch').click();
    }
  }

  async removeContactPerson(index: number): Promise<void> {
    await this.personCard(index).getByRole('button', { name: 'Remove' }).click();
  }

  async cancel(): Promise<void> {
    await this.backButton.click();
  }

  // Validation
  //
  // There is no successful-submit method on purpose — see the class comment.

  async submitExpectingValidationError(): Promise<void> {
    await this.createLeadButton.click();
    await expect(this.validationSummary).toBeVisible();
  }

  /** The toast names every offending field, e.g. "Merchant name", "Category". */
  async expectValidationSummaryLists(field: string): Promise<void> {
    await expect(this.validationSummary).toContainText(field);
  }

  async expectFieldError(label: string, message: string): Promise<void> {
    await expect(this.fieldError(label)).toHaveText(message);
  }

  async expectNoFieldError(label: string): Promise<void> {
    await expect(this.fieldError(label)).toHaveCount(0);
  }

  // Assertions

  async expectAssignedToSelfNotice(): Promise<void> {
    await expect(this.ownerNotice).toBeVisible();
  }

  async expectSubCategoryHidden(): Promise<void> {
    await expect(this.subCategoryTrigger).toHaveCount(0);
  }

  async expectSubCategoryVisible(): Promise<void> {
    await expect(this.subCategoryTrigger).toBeVisible();
  }

  async expectCity(value: string | RegExp): Promise<void> {
    await expect(this.cityInput).toHaveValue(value);
  }

  async expectPostalCodeFilled(): Promise<void> {
    await expect(this.postalCodeInput).not.toHaveValue('');
  }

  async expectUen(value: string): Promise<void> {
    await expect(this.uenInput).toHaveValue(value);
  }

  async expectNameEmpty(): Promise<void> {
    await expect(this.nameInput).toHaveValue('');
  }

  async expectContactPersonCount(count: number): Promise<void> {
    await expect(this.personCards).toHaveCount(count);
  }
}
