import type { Page, Locator } from '@playwright/test';
import { ConfigBasePage } from '../ConfigBasePage';
import { expect } from '@playwright/test';

export class LoyaltyPage extends ConfigBasePage {
    readonly loyaltyHeader: Locator;
    readonly createLoyaltyButton: Locator;

    constructor(page: Page) {
        super(page);
        this.loyaltyHeader = this.page.getByRole('heading', { name: 'Loyalty Programs' });
        this.createLoyaltyButton = this.page.getByRole('button', { name: 'Create' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.loyaltyHeader).toBeVisible();
    }

    private async openCreateLoyaltyForm(): Promise<void> {
        await expect(this.createLoyaltyButton).toBeEnabled();
        await this.createLoyaltyButton.click();
    }

}