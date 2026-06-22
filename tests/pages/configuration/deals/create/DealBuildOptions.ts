import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { GeneralDetailsStep } from './manual/GeneralDetailsStep';

export class DealBuildOptions extends ConfigBasePage {
    private readonly pageTitle: Locator; 
    private readonly createManual: Locator;
    private readonly njoyBuild: Locator;


    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.getByText('How do you want to build this');
        this.createManual = page.getByRole('button', { name: 'Manual Walk through each step' });
        this.njoyBuild = page.getByRole('button', { name: 'NJoyBuild Credit NJoyBuild' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    async buildManual(): Promise<GeneralDetailsStep> {
        await expect(this.createManual).toBeEnabled();
        await this.createManual.click();
        const generalDetailsStep = new GeneralDetailsStep(this.page);
        await generalDetailsStep.waitForReady();
        return generalDetailsStep;
    }

    async nJoyBuild(): Promise<void> {
        await expect(this.njoyBuild).toBeEnabled();
        await this.njoyBuild.click();
    }
}
