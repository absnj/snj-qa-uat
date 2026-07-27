import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { LoyaltyDetailsStep } from './manual/LoyaltyDetailsStep';

export class LoyaltyBuildOptions extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly createManual: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.getByText('How do you want to build this');
        this.createManual = this.page.getByRole('button', { name: 'Manual' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    async buildManual(): Promise<LoyaltyDetailsStep> {
        await expect(this.createManual).toBeEnabled();
        await this.createManual.click();
        const loyaltyDetailsStep = new LoyaltyDetailsStep(this.page);
        await loyaltyDetailsStep.waitForReady();
        return loyaltyDetailsStep;
    }
}
