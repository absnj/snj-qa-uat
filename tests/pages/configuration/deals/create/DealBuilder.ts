import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { DealStudio } from './manual/DealStudio';

/**
 * Landing step of deal creation. Creating a deal no longer starts with a
 * branch-selection step followed by a build-mode choice: the entry point is the
 * NJoyBuild prompt builder, which offers "Create this deal manually" as the
 * escape into the manual studio. Branches are now picked inside that studio.
 */
export class DealBuilder extends ConfigBasePage {
    private readonly builderRegion: Locator;
    private readonly createManuallyButton: Locator;
    private readonly url: string;

    constructor(page: Page) {
        super(page);
        this.builderRegion = this.page.getByRole('region', { name: 'NJoyBuild deal builder' });
        this.createManuallyButton = this.page.getByRole('button', { name: 'Create this deal manually' });
        this.url = '/configuration/deal/create-deal';
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.builderRegion).toBeVisible();
    }

    async buildManual(): Promise<DealStudio> {
        await expect(this.createManuallyButton).toBeEnabled();
        await this.createManuallyButton.click();
        const studio = new DealStudio(this.page);
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
