import type { Page, Locator, FrameLocator } from '@playwright/test';
import { expect } from '@playwright/test';
import { SalesCrmBasePage, exactText } from './SalesCrmBasePage';

/** The four headline metrics on Track → Merchant Relationship → Overview. */
export type CrmMetric =
  | 'Merchant Acquisition Status'
  | 'Merchant Acquisition Gauge'
  | 'Merchant Acquisition Velocity'
  | 'Source of Signed Merchant Lead';

/** Read-only pipeline dashboard at `/track/crm`. */
export class CrmOverviewPage extends SalesCrmBasePage {
  private readonly dashboard: FrameLocator;
  private readonly heading: Locator;
  private readonly metricHeadings: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboard = this.page.locator('iframe').contentFrame();
    this.heading = this.dashboard.getByRole('heading', { name: 'Key Metrics', level: 1 });
    this.metricHeadings = this.dashboard.getByRole('heading', { level: 2 });
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
    await expect(this.metricHeading(metric)).toBeVisible();
  }
}
