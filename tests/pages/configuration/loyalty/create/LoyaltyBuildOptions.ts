import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { ProgramConfigurationStep } from './manual/ProgramConfigurationStep';

export class LoyaltyBuildOptions extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly createManual: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.getByText('How do you want to build this');
        this.createManual = this.page.getByRole('button', { name: 'Manual Walk through each step' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    async buildManual(): Promise<ProgramConfigurationStep> {
        await expect(this.createManual).toBeEnabled();
        await this.createManual.click();
        const programConfigurationStep = new ProgramConfigurationStep(this.page);
        await programConfigurationStep.waitForReady();
        return programConfigurationStep;
    }
}
