import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { DealBuildOptions } from './DealBuildOptions';

type BranchSelectionData = {
    branches?: string[];
    allBranches?: boolean;
};

export class BranchSelection extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly continueButton: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.getByText('Branch Selection', { exact: true });
        this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }


    async next(): Promise<DealBuildOptions> {
        await expect(this.continueButton).toBeEnabled();
        await this.continueButton.click();
        return new DealBuildOptions(this.page);
    }
}
