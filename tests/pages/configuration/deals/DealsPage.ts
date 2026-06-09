import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '../ConfigBasePage';

export class DealsPage extends ConfigBasePage {
    readonly dealHeader: Locator;
    readonly createDealButton: Locator;

    constructor(page: Page) {
        super(page);
        this.dealHeader = this.page.getByRole('heading', { name: 'Deal Approval' });
        this.createDealButton = this.page.getByRole('button', { name: 'Create' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.dealHeader).toBeVisible();
    }

    private async openCreateDealForm(): Promise<void> {
        await expect(this.createDealButton).toBeEnabled();
        await this.createDealButton.click();
    }

}

