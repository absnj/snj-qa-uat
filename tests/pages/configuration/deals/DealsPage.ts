import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { CampaignBasePage } from '../campaign/CampaignBasePage';
import { DealBuilder } from './create/DealBuilder';

export class DealsPage extends CampaignBasePage {
    private readonly dealTitleColumn: Locator;

    constructor(page: Page) {
        super(page);
        this.dealTitleColumn = this.page.getByRole('columnheader', { name: 'Deal Title' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.dealTitleColumn).toBeVisible();
    }

    /**
     * "Create" opens the NJoyBuild builder for whichever campaign sub-tab is
     * active, so this must only be called once the deal list is showing.
     */
    async openCreateDealForm(): Promise<DealBuilder> {
        await expect(this.createButton).toBeEnabled();
        await this.createButton.click();
        const builder = new DealBuilder(this.page);
        await builder.waitForReady();
        return builder;
    }

    async expectCreateDealAvailable(): Promise<void> {
        await expect(this.createButton).toBeVisible();
    }

    async expectCreateDealUnavailable(): Promise<void> {
        await expect(this.createButton).not.toBeVisible();
    }

}
