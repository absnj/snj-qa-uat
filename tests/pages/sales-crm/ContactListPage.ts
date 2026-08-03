import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { SalesCrmBasePage, exactText } from './SalesCrmBasePage';
import { CaptureLeadPage } from './CaptureLeadPage';

/** Pipeline statuses, in the order the kanban renders them. */
export type ContactStatus =
  | 'Lead'
  | 'Qualified'
  | 'Proposing'
  | 'Close Won'
  | 'Onboarding'
  | 'Setup'
  | 'Live'
  | 'Close Lost'
  | 'Archived';

export const CONTACT_STATUSES: ContactStatus[] = [
  'Lead',
  'Qualified',
  'Proposing',
  'Close Won',
  'Onboarding',
  'Setup',
  'Live',
  'Close Lost',
  'Archived',
];

export type ContactPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export const CONTACT_PRIORITIES: ContactPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

export type ContactTier = 'Standard' | 'Premium' | 'Up And Coming';
export type ContactType = 'Merchant' | 'Charity';
export type ContactView = 'List' | 'Kanban' | 'Map';
export type Involvement = 'Sales' | 'Merchant Success' | 'Both';

/**
 * Which of the three contact lists this instance is pointed at. They are the
 * same "Contact Management" component at different scopes, so one class serves
 * all three; only the route and a couple of filters differ.
 */
export type ContactScope = 'my' | 'assigned' | 'unassigned';

const SCOPE_PATHS: Record<ContactScope, string> = {
  my: '/track/crm/contact/my-contacts',
  assigned: '/track/crm/contact/assigned-contacts',
  unassigned: '/track/crm/contact/unassigned-contacts',
};

/**
 * Track → Merchant Relationship → My / Assigned / Unassigned Contacts.
 *
 * Every scope supports `?view=list|kanban|map`; kanban is the default. Only
 * contacts the signed-in agent owns can actually be opened — see
 * `openContactExpectingAccessDenied`.
 *
 * Scope-specific filters (`filterByInvolvement` on `my`, the owner filters on
 * `assigned`) throw if called against a scope that does not render them.
 */
export class ContactListPage extends SalesCrmBasePage {
  private readonly heading: Locator;

  private readonly listViewButton: Locator;
  private readonly kanbanViewButton: Locator;
  private readonly mapViewButton: Locator;

  private readonly searchBox: Locator;
  private readonly createButton: Locator;

  private readonly statusFilter: Locator;
  private readonly priorityFilter: Locator;
  private readonly tierFilter: Locator;
  private readonly categoryFilter: Locator;
  private readonly subCategoryFilter: Locator;
  private readonly typeFilter: Locator;
  private readonly lastContactedFilter: Locator;
  private readonly involvementFilter: Locator;
  private readonly salesOwnerFilter: Locator;
  private readonly merchantSuccessOwnerFilter: Locator;

  /** List view: each `<tr>` carries `role=button` and opens the contact. */
  private readonly rows: Locator;
  /** The rows (list) and cards (kanban) that open a contact. */
  private readonly contactTargets: Locator;
  /** Map view: one marker button per plotted contact. */
  private readonly mapMarkers: Locator;
  private readonly table: Locator;
  private readonly mapRegion: Locator;

  private readonly backToStatusesButton: Locator;
  private readonly paginationSummary: Locator;
  private readonly perPageSelect: Locator;
  private readonly nextPageButton: Locator;
  private readonly previousPageButton: Locator;

  constructor(page: Page, private readonly scope: ContactScope) {
    super(page);

    this.heading = this.page.getByRole('heading', { name: 'Contact Management', level: 1 });

    this.listViewButton = this.page.getByRole('button', { name: 'List view' });
    this.kanbanViewButton = this.page.getByRole('button', { name: 'Kanban view' });
    this.mapViewButton = this.page.getByRole('button', { name: 'Map view' });

    this.searchBox = this.page.getByRole('searchbox', { name: 'Search' });
    this.createButton = this.page.getByRole('button', { name: 'Create', exact: true });

    this.statusFilter = this.selectTrigger('Filter by Status');
    this.priorityFilter = this.selectTrigger('Filter by Priority');
    this.tierFilter = this.selectTrigger('Filter by Tier');
    this.categoryFilter = this.selectTrigger('Filter by Category');
    this.subCategoryFilter = this.selectTrigger('Filter by Sub-Category');
    this.typeFilter = this.selectTrigger('Filter by Type');
    this.lastContactedFilter = this.formGroup('Filter by Last Contacted').getByRole('combobox');
    this.involvementFilter = this.formGroup('Filter by Involvement').getByRole('combobox');
    this.salesOwnerFilter = this.selectTrigger('Filter by Sales');
    this.merchantSuccessOwnerFilter = this.selectTrigger('Filter by Merchant Success');

    this.rows = this.page.locator('table tbody tr');
    this.contactTargets = this.page.getByRole('button');
    this.mapMarkers = this.page.getByRole('button', { name: /^View .+ on map$/ });
    this.table = this.page.getByRole('table');
    this.mapRegion = this.page.getByRole('region', { name: 'Map' });

    this.backToStatusesButton = this.page.getByRole('button', { name: 'Back to statuses' });
    this.paginationSummary = this.page
      .getByRole('navigation', { name: 'Pagination' })
      .getByRole('paragraph');
    this.perPageSelect = this.page.getByRole('combobox', { name: /^Items per page/ });
    this.nextPageButton = this.page.getByRole('button', { name: 'Next page' });
    this.previousPageButton = this.page.getByRole('button', { name: 'Previous page' });
  }

  async goto(view: ContactView = 'Kanban'): Promise<void> {
    await this.page.goto(`${SCOPE_PATHS[this.scope]}?view=${view.toLowerCase()}`);
    await this.waitForReady();
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.heading).toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Parameterised locators
  // ---------------------------------------------------------------------------

  /**
   * A contact's row (list view) or card (kanban view). Both expose
   * `role=button` with the merchant name in their text, so one factory serves
   * either view.
   */
  private contact(merchantName: string): Locator {
    return this.contactTargets.filter({ hasText: merchantName });
  }

  /** Kanban columns are `<article aria-label="<status>">`. */
  private statusColumn(status: ContactStatus): Locator {
    return this.page.getByRole('article', { name: exactText(status) });
  }

  private subprocessesButton(status: ContactStatus): Locator {
    return this.page.getByRole('button', { name: `Open ${status} subprocesses` });
  }

  private mapMarker(merchantName: string): Locator {
    return this.page.getByRole('button', { name: `View ${merchantName} on map` });
  }

  // ---------------------------------------------------------------------------
  // View switching
  // ---------------------------------------------------------------------------

  async switchToListView(): Promise<void> {
    await this.listViewButton.click();
    await expect(this.listViewButton).toHaveAttribute('aria-pressed', 'true');
  }

  async switchToKanbanView(): Promise<void> {
    await this.kanbanViewButton.click();
    await expect(this.kanbanViewButton).toHaveAttribute('aria-pressed', 'true');
  }

  async switchToMapView(): Promise<void> {
    await this.mapViewButton.click();
    await expect(this.mapViewButton).toHaveAttribute('aria-pressed', 'true');
  }

  // ---------------------------------------------------------------------------
  // Search and filters
  // ---------------------------------------------------------------------------

  async search(term: string): Promise<void> {
    await this.searchBox.fill(term);
  }

  /**
   * Narrows the list to one contact and waits for it. Use this before acting on
   * a named contact so a spec never depends on which page it happens to land
   * on — the list has no documented ordering contract.
   */
  async findContact(merchantName: string): Promise<void> {
    await this.search(merchantName);
    await expect(this.contact(merchantName)).toBeVisible();
  }

  async filterByStatus(status: ContactStatus): Promise<void> {
    await this.chooseMenuOption(this.statusFilter, status);
  }

  async filterByPriority(priority: ContactPriority): Promise<void> {
    await this.chooseMenuOption(this.priorityFilter, priority);
  }

  async filterByTier(tier: ContactTier): Promise<void> {
    await this.chooseMenuOption(this.tierFilter, tier);
  }

  async filterByType(type: ContactType): Promise<void> {
    await this.chooseMenuOption(this.typeFilter, type);
  }

  /** Sub-Category stays disabled until a category is chosen. */
  async filterByCategory(category: string, subCategory?: string): Promise<void> {
    await this.chooseMenuOption(this.categoryFilter, category);
    if (subCategory) {
      await expect(this.subCategoryFilter).toBeEnabled();
      await this.chooseMenuOption(this.subCategoryFilter, subCategory);
    }
  }

  /** My Contacts only. */
  async filterByInvolvement(involvement: Involvement): Promise<void> {
    await this.involvementFilter.selectOption({ label: involvement });
  }

  /** Assigned Contacts only. */
  async filterBySalesOwner(agentName: string): Promise<void> {
    await this.chooseMenuOption(this.salesOwnerFilter, agentName);
  }

  /** Assigned Contacts only. */
  async filterByMerchantSuccessOwner(agentName: string): Promise<void> {
    await this.chooseMenuOption(this.merchantSuccessOwnerFilter, agentName);
  }

  /** Opens a filter dropdown without choosing anything, to inspect its options. */
  async openStatusFilter(): Promise<void> {
    await this.statusFilter.click();
  }

  async openPriorityFilter(): Promise<void> {
    await this.priorityFilter.click();
  }

  // ---------------------------------------------------------------------------
  // Navigation out
  // ---------------------------------------------------------------------------

  async openCreateLeadForm(): Promise<CaptureLeadPage> {
    await this.createButton.click();
    const captureLead = new CaptureLeadPage(this.page);
    await captureLead.waitForReady();
    return captureLead;
  }

  /**
   * Clicking a contact the agent does not own is refused: an Access Denied
   * toast appears and the list stays put.
   *
   * There is deliberately no `openContact()` counterpart yet — nothing in the
   * read-only suite owns a contact to open, and the detail page has no page
   * object. Add both together when an owned-contact scenario lands.
   */
  async openContactExpectingAccessDenied(merchantName: string): Promise<void> {
    await this.contact(merchantName).click();
    await expect(this.accessDeniedAlert).toBeVisible();
    await expect(this.heading).toBeVisible();
  }

  /** Regroups the kanban from pipeline statuses into that status's subprocesses. */
  async openSubprocessesFor(status: ContactStatus): Promise<void> {
    await this.subprocessesButton(status).click();
    await expect(this.backToStatusesButton).toBeVisible();
  }

  async backToStatuses(): Promise<void> {
    await this.backToStatusesButton.click();
    await expect(this.backToStatusesButton).toBeHidden();
  }

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  async setPageSize(size: '10' | '20' | '50' | '100' | '500' | '1000'): Promise<void> {
    await this.perPageSelect.selectOption(size);
  }

  async goToNextPage(): Promise<void> {
    await this.nextPageButton.click();
  }

  async goToPreviousPage(): Promise<void> {
    await this.previousPageButton.click();
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  async expectContactVisible(merchantName: string): Promise<void> {
    await expect(this.contact(merchantName)).toBeVisible();
  }

  async expectContactAbsent(merchantName: string): Promise<void> {
    await expect(this.contact(merchantName)).toHaveCount(0);
  }

  async expectStatusColumnVisible(status: ContactStatus): Promise<void> {
    await expect(this.statusColumn(status)).toBeVisible();
  }

  async expectViewControlsVisible(): Promise<void> {
    await expect(this.listViewButton).toBeVisible();
    await expect(this.kanbanViewButton).toBeVisible();
    await expect(this.mapViewButton).toBeVisible();
  }

  async expectTableVisible(): Promise<void> {
    await expect(this.table).toBeVisible();
  }

  async expectSubCategoryFilterDisabled(): Promise<void> {
    await expect(this.subCategoryFilter).toBeDisabled();
  }

  /** Asserts the open dropdown offers exactly these items, "All …" aside. */
  async expectFilterOptions(options: string[]): Promise<void> {
    for (const option of options) {
      await expect(this.menuOptions.filter({ hasText: exactText(option) })).toBeVisible();
    }
  }

  async expectInfoActionDisabled(merchantName: string): Promise<void> {
    await expect(this.contact(merchantName).getByRole('button', { name: 'Info' })).toBeDisabled();
  }

  async expectRowCount(count: number): Promise<void> {
    await expect(this.rows).toHaveCount(count);
  }

  async expectResultSummary(summary: string | RegExp): Promise<void> {
    await expect(this.paginationSummary).toHaveText(summary);
  }

  async expectMapMarkerVisible(merchantName: string): Promise<void> {
    await expect(this.mapMarker(merchantName)).toBeVisible();
  }

  async expectMapVisible(): Promise<void> {
    await expect(this.mapRegion).toBeVisible();
  }
}
