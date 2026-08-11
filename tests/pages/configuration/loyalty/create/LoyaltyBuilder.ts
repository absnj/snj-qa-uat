import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { LoyaltyStudio } from './manual/LoyaltyStudio';

/**
 * Landing step of loyalty program creation. As with deals, the branch-selection
 * and build-mode steps are gone: the entry point is the NJoyBuild prompt
 * builder, which offers "Create this loyalty program manually" as the escape
 * into the manual studio.
 */
export class LoyaltyBuilder extends ConfigBasePage {
    private readonly builderRegion: Locator;
    private readonly createManuallyButton: Locator;
    private readonly url: string;

    constructor(page: Page) {
        super(page);
        this.builderRegion = this.page.getByRole('region', { name: 'NJoyBuild loyalty builder' });
        this.createManuallyButton = this.page.getByRole('button', {
            name: 'Create this loyalty program manually',
        });
        this.url = '/configuration/loyalty-program/create-loyalty-program';
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.builderRegion).toBeVisible();
    }

    async buildManual(): Promise<LoyaltyStudio> {
        await expect(this.createManuallyButton).toBeEnabled();
        await this.createManuallyButton.click();
        const studio = new LoyaltyStudio(this.page);
        await studio.waitForReady();
        return studio;
    }

    /**
     * Waits for `domcontentloaded` rather than `load`: the builder streams
     * preview assets well after it is interactive, and readiness is asserted
     * against the builder region below.
     */
    async goto(): Promise<void> {
        await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
        await this.waitForReady();
    }
}
