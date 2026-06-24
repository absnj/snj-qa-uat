import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { LoyaltyBuildOptions } from './LoyaltyBuildOptions';

export class LoyaltyBranchSelection extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly continueButton: Locator;
    private readonly spinner: Locator;
    private readonly url: string;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.getByText('Merchant & branches');
        this.continueButton = this.page.getByRole('button', { name: 'Continue' });
        this.spinner = this.page.getByRole('status').filter({ hasText: 'Preparing loyalty program' }).getByRole('img')
        this.url = '/configuration/loyalty-program/create-loyalty-program'
    }

    override async waitForReady(): Promise<void> {
        await expect(this.spinner).toBeHidden();
        await expect(this.pageTitle).toBeVisible();
    }

    async next(): Promise<LoyaltyBuildOptions> {
        await expect(this.continueButton).toBeEnabled();
        await this.continueButton.click();
        const buildOptions = new LoyaltyBuildOptions(this.page);
        await buildOptions.waitForReady();
        return buildOptions;
    }

    async goto(): Promise<void> {
        await this.page.goto(this.url);
        await this.waitForReady()
    }
}
