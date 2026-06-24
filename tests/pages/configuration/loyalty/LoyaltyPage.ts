import type { Page, Locator } from '@playwright/test';
import { ConfigBasePage } from '../ConfigBasePage';
import { expect } from '@playwright/test';
import { LoyaltyBranchSelection } from './create/LoyaltyBranchSelection';

export class LoyaltyPage extends ConfigBasePage {
    private readonly loyaltyHeader: Locator;
    private readonly createLoyaltyButton: Locator;

    constructor(page: Page) {
        super(page);
        this.loyaltyHeader = this.page.getByRole('heading', { name: 'Loyalty Programs' });
        this.createLoyaltyButton = this.page.getByRole('button', { name: 'Create' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.loyaltyHeader).toBeVisible();
    }

    async openCreateLoyaltyForm(): Promise<LoyaltyBranchSelection> {
        await expect(this.createLoyaltyButton).toBeEnabled();
        await this.createLoyaltyButton.click();
        const branchSelection = new LoyaltyBranchSelection(this.page);
        await branchSelection.waitForReady();
        return branchSelection;
    }

    async expectCreateLoyaltyAvailable(): Promise<void> {
        await expect(this.createLoyaltyButton).toBeVisible();
    }

    async expectCreateLoyaltyUnavailable(): Promise<void> {
        await expect(this.createLoyaltyButton).not.toBeVisible();
    }
}
