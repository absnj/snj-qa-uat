import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '../ConfigBasePage';
import { BranchSelection } from './create/BranchSelection';

export class DealsPage extends ConfigBasePage {
    readonly dealHeader: Locator;
    readonly createDealButton: Locator;
    readonly createDealTitle: Locator;
    readonly openDealOptions: Locator;

    constructor(page: Page) {
        super(page);
        this.dealHeader = this.page.getByRole('heading', { name: 'Deal Approval' });
        this.createDealButton = this.page.getByRole('button', { name: 'Create' });
        this.createDealTitle = this.page.getByRole('heading', { name: 'Create Deal' });
        this.openDealOptions = this.page.getByRole('button', { name: 'Continue' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.dealHeader).toBeVisible();
    }

    async openCreateDealForm(): Promise<BranchSelection> {
        await expect(this.createDealButton).toBeEnabled();
        await this.createDealButton.click();
        return new BranchSelection(this.page);
    }

}
