import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '../ConfigBasePage';
import { BranchSelection } from './create/BranchSelection';

export class DealsPage extends ConfigBasePage {
    private readonly dealHeader: Locator;
    private readonly createDealButton: Locator;

    constructor(page: Page) {
        super(page);
        this.dealHeader = this.page.getByRole('heading', { name: 'Deal Approval' });
        this.createDealButton = this.page.getByRole('button', { name: 'Create' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.dealHeader).toBeVisible();
    }

    async openCreateDealForm(): Promise<BranchSelection> {
        await expect(this.createDealButton).toBeEnabled();
        await this.createDealButton.click();
        const branchSelection = new BranchSelection(this.page);
        await branchSelection.waitForReady();
        return branchSelection;
    }

    async expectCreateDealAvailable(): Promise<void> {
        await expect(this.createDealButton).toBeVisible();
    }

    async expectCreateDealUnavailable(): Promise<void> {
        await expect(this.createDealButton).not.toBeVisible();
    }

}
