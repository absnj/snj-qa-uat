import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { SalesCrmBasePage, exactText } from './SalesCrmBasePage';

/** The four headline metrics on Track → Merchant Relationship → Overview. */
export type CrmMetric =
  | 'Avg. close/win time'
  | 'Close won contacts'
  | 'Overdue contacts'
  | 'High/Urgent pipeline';

/** Tabs of the overview dashboard. */
export type CrmOverviewTab =
  | 'Overview'
  | 'Close/Win Distribution'
  | 'Priority Mix'
  | 'Overdue List';

/** Read-only pipeline dashboard at `/track/crm`. */
export class CrmOverviewPage extends SalesCrmBasePage {
  private readonly heading: Locator;
  private readonly agentFilter: Locator;
  private readonly tabs: Locator;
  private readonly metricCards: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = this.page.getByRole('heading', { name: 'CRM Contact Overview', level: 1 });
    this.agentFilter = this.formGroup('Agent').getByRole('combobox');
    this.tabs = this.page.getByRole('button');
    this.metricCards = this.page.getByRole('button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/track/crm');
    await this.waitForReady();
  }

  override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.heading).toBeVisible();
  }

  // Parameterised locators

  /** Tab strip entries are plain buttons whose only text is the tab name. */
  private tab(name: CrmOverviewTab): Locator {
    return this.tabs.filter({ hasText: exactText(name) });
  }

  /** Each metric renders as a button whose accessible name is "View <metric>". */
  private metricCard(metric: CrmMetric): Locator {
    return this.metricCards.filter({ hasText: metric });
  }

  // Actions

  async openTab(name: CrmOverviewTab): Promise<void> {
    await this.tab(name).click();
  }

  async openMetric(metric: CrmMetric): Promise<void> {
    await this.metricCard(metric).click();
  }

  async filterByAgent(agentName: string): Promise<void> {
    await this.agentFilter.selectOption({ label: agentName });
  }

  // Assertions

  async expectMetricVisible(metric: CrmMetric): Promise<void> {
    await expect(this.metricCard(metric)).toBeVisible();
  }

  async expectMetricValue(metric: CrmMetric, value: string): Promise<void> {
    await expect(this.metricCard(metric)).toContainText(value);
  }
}
