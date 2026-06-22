import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { DealBuildOptions } from './DealBuildOptions';

export class BranchSelection extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly continueButton: Locator;
    private readonly url: string;
    private readonly loadingScreen: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.getByText('Branch Selection', { exact: true });
        this.continueButton = this.page.getByRole('button', { name: 'Continue' });
        this.url = '/configuration/deal/create-deal';
        this.loadingScreen = this.page.getByRole('status').filter({ hasText: 'Preparing deal creation...' }).getByRole('img');
    }

    override async waitForReady(): Promise<void> {
        await expect(this.pageTitle).toBeVisible();
        await expect(this.loadingScreen).toBeHidden();
    }


    async next(): Promise<DealBuildOptions> {
        await expect(this.continueButton).toBeEnabled();
        await this.continueButton.click();
        const dealBuildOptions = new DealBuildOptions(this.page);
        await dealBuildOptions.waitForReady();
        return dealBuildOptions;
    }

    async goto(): Promise<void> {
        await this.page.goto(this.url);
        await this.waitForReady();
    }
}
