import type { Page, Locator } from '@playwright/test';
import { BasePage } from '@core/BasePage';
import type { ContactListPage, ContactScope } from './ContactListPage';
import type { CrmOverviewPage } from './CrmOverviewPage';

/**
 * The CRM renders lists, tab strips and dropdown items as generic elements
 * whose only distinguishing feature is their text, so text filtering is
 * unavoidable. `hasText` with a plain string is a substring match, which
 * over-matches ("Category" also hitting "Sub-Category"), so these anchor it.
 */
function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function exactText(value: string): RegExp {
  return new RegExp(`^\\s*${escapeForRegExp(value)}\\s*$`);
}

export function startsWithText(value: string): RegExp {
  return new RegExp(`^\\s*${escapeForRegExp(value)}`);
}

/**
 * Shared chrome for Track → Merchant Relationship (the sales CRM): the Track
 * sidebar plus the form-control factories the CRM needs everywhere.
 *
 * These screens are Vue + radix-vue and give their inputs no `id`, `name`,
 * `aria-label` or `<label for>` — `getByLabel` reaches nothing. Every control
 * is instead wrapped in a `.form-group` carrying a `<label>`, and that wrapper
 * is the only stable, non-styling hook the markup offers. `formGroup()` scopes
 * to it and the typed helpers read the control out by role, keeping the
 * accessible-name contract in one place instead of spread across specs.
 */
export abstract class SalesCrmBasePage extends BasePage {
  private readonly myPerformanceLink: Locator;
  private readonly overviewLink: Locator;
  private readonly myContactsLink: Locator;
  private readonly assignedContactsLink: Locator;
  private readonly unassignedContactsLink: Locator;

  /** Base for the label-scoped control factories. */
  protected readonly formGroups: Locator;
  /** Options of an open radix `Select` (the form dropdowns). */
  protected readonly selectOptions: Locator;
  /** Items of an open radix `DropdownMenu` (the list-page filter dropdowns). */
  protected readonly menuOptions: Locator;

  /**
   * A sales agent may only open a contact where they are the sales owner or
   * the merchant success owner; anything else answers with this toast and
   * stays on the list.
   */
  readonly accessDeniedAlert: Locator;

  constructor(page: Page) {
    super(page);

    this.myPerformanceLink = this.page.getByRole('link', { name: 'My Performance' });
    this.overviewLink = this.page.getByRole('link', { name: 'Overview', exact: true });
    this.myContactsLink = this.page.getByRole('link', { name: 'My Contacts', exact: true });
    this.assignedContactsLink = this.page.getByRole('link', { name: 'Assigned Contacts', exact: true });
    this.unassignedContactsLink = this.page.getByRole('link', { name: 'Unassigned Contacts', exact: true });

    this.formGroups = this.page.locator('.form-group');
    this.selectOptions = this.page.getByRole('option');
    this.menuOptions = this.page.getByRole('menuitemcheckbox');

    this.accessDeniedAlert = this.page.getByRole('alert', { name: 'Access Denied' });
  }

  // Sidebar navigation

  async goToCrmOverview(): Promise<CrmOverviewPage> {
    await this.overviewLink.click();
    const { CrmOverviewPage } = await import('./CrmOverviewPage');
    const overview = new CrmOverviewPage(this.page);
    await overview.waitForReady();
    return overview;
  }

  async goToMyContacts(): Promise<ContactListPage> {
    return this.goToContacts(this.myContactsLink, 'my');
  }

  async goToAssignedContacts(): Promise<ContactListPage> {
    return this.goToContacts(this.assignedContactsLink, 'assigned');
  }

  async goToUnassignedContacts(): Promise<ContactListPage> {
    return this.goToContacts(this.unassignedContactsLink, 'unassigned');
  }

  async clickMyPerformance(): Promise<void> {
    await this.myPerformanceLink.click();
  }

  private async goToContacts(link: Locator, scope: ContactScope): Promise<ContactListPage> {
    await link.click();
    const { ContactListPage } = await import('./ContactListPage');
    const contacts = new ContactListPage(this.page, scope);
    await contacts.waitForReady();
    return contacts;
  }

  // Label-scoped control factories
  //
  // Call these from a subclass *constructor* to name a control once; never
  // build a locator inside an action method.

  /**
   * The `.form-group` whose `label` starts with `label`. Prefix-anchored so
   * "Category" does not also match "Sub-Category", and so a trailing required
   * marker `*` or help button inside the label is tolerated.
   */
  protected formGroup(label: string): Locator {
    return this.formGroups.filter({
      has: this.page.locator('label').filter({ hasText: startsWithText(label) }),
    });
  }

  protected textField(label: string): Locator {
    return this.formGroup(label).getByRole('textbox');
  }

  protected numberField(label: string): Locator {
    return this.formGroup(label).getByRole('spinbutton');
  }

  /**
   * The clickable trigger of a radix select/dropdown. Each control renders both
   * a trigger button and a hidden native `<select>` mirror, and both expose
   * `role=combobox` — the `button` qualifier picks the one a user can operate.
   */
  protected selectTrigger(label: string): Locator {
    return this.formGroup(label).locator('button[role="combobox"]');
  }

  // Control interactions

  /** Open a radix `Select` and pick an option by its visible text. */
  protected async chooseSelectOption(trigger: Locator, option: string): Promise<void> {
    await trigger.click();
    await this.selectOptions.filter({ hasText: exactText(option) }).click();
  }

  /** Open a list-page filter dropdown and pick one of its checkbox items. */
  protected async chooseMenuOption(trigger: Locator, option: string): Promise<void> {
    await trigger.click();
    await this.menuOptions.filter({ hasText: exactText(option) }).click();
  }
}
