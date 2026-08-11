import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '../ConfigBasePage';

/**
 * Shared surface for the merchant "Campaign" tab, which now hosts Deals,
 * Loyalty Programs and Events as sibling sub-tabs of a single list view
 * (previously each was its own top-level configuration page).
 *
 * The sub-tabs mark the active one with a styling class only — there is no
 * aria-selected/aria-pressed contract — so concrete pages assert which list is
 * showing via their table's column header instead.
 */
export abstract class CampaignBasePage extends ConfigBasePage {
    protected readonly campaignHeading: Locator;
    protected readonly createButton: Locator;

    protected readonly dealsSubTab: Locator;
    protected readonly loyaltySubTab: Locator;
    protected readonly eventsSubTab: Locator;

    constructor(page: Page) {
        super(page);
        this.campaignHeading = this.page.getByRole('heading', { name: 'Campaign' });
        this.createButton = this.page.getByRole('button', { name: 'Create', exact: true });

        this.dealsSubTab = this.subTab('Deals');
        this.loyaltySubTab = this.subTab('Loyalty Programs');
        this.eventsSubTab = this.subTab('Events');
    }

    private subTab(name: string): Locator {
        return this.page.getByRole('button', { name, exact: true });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.campaignHeading).toBeVisible();
    }
}
