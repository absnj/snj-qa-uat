import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { CampaignBasePage } from '../campaign/CampaignBasePage';
import { LoyaltyBuilder } from './create/LoyaltyBuilder';

export class LoyaltyPage extends CampaignBasePage {
    private readonly programTitleColumn: Locator;

    constructor(page: Page) {
        super(page);
        this.programTitleColumn = this.page.getByRole('columnheader', { name: 'Program Title' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.programTitleColumn).toBeVisible();
    }

    /**
     * "Create" opens the NJoyBuild builder for whichever campaign sub-tab is
     * active, so this must only be called once the program list is showing.
     */
    async openCreateLoyaltyForm(): Promise<LoyaltyBuilder> {
        await expect(this.createButton).toBeEnabled();
        await this.createButton.click();
        const builder = new LoyaltyBuilder(this.page);
        await builder.waitForReady();
        return builder;
    }

    async expectCreateLoyaltyAvailable(): Promise<void> {
        await expect(this.createButton).toBeVisible();
    }

    async expectCreateLoyaltyUnavailable(): Promise<void> {
        await expect(this.createButton).not.toBeVisible();
    }
}
