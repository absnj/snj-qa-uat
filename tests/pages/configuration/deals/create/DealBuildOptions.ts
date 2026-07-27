import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { DealDetailsStep } from './manual/DealDetailsStep';

export class DealBuildOptions extends ConfigBasePage {
    private readonly pageTitle: Locator; 
    private readonly createManual: Locator;
    private readonly njoyBuild: Locator;


    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.getByText('How do you want to build this');
        this.createManual = page.getByRole('button', { name: 'Manual' });
        this.njoyBuild = page.getByRole('button', { name: /NJoyBuild/ });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    async buildManual(): Promise<DealDetailsStep> {
        await expect(this.createManual).toBeEnabled();
        await this.createManual.click();
        const dealDetailsStep = new DealDetailsStep(this.page);
        await dealDetailsStep.waitForReady();
        return dealDetailsStep;
    }

    async nJoyBuild(): Promise<void> {
        await expect(this.njoyBuild).toBeEnabled();
        await this.njoyBuild.click();
    }
}
