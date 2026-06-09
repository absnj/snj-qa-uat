import type { Page, Locator } from '@playwright/test';
import { CreateDealForm } from '../CreateDealForm';
import { expect } from '@playwright/test';

export class DealBuildOptions extends CreateDealForm {
    // TODO: private readonly branchSelection: Locator;
    // TODO: private readonly toggleBranches: Locator;
    private readonly branchSelectionHeading: Locator;
    private readonly continue: Locator;
    private readonly pageTitle: Locator; 
    private readonly createManual: Locator;
    private readonly njoyBuild: Locator;

    constructor(page: Page) {
        super(page);
        this.branchSelectionHeading = this.page.getByText('Branch Selection', { exact: true });
        this.continue = this.page.getByRole('button', { name: 'Continue' });
        this.pageTitle = this.page.getByText('How do you want to build this deal', { exact: true });
        this.createManual = page.getByRole('button', { name: 'Manual Walk through each step' });
        this.njoyBuild = page.getByRole('button', { name: 'NJoyBuild Credit NJoyBuild' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    override async fill(): Promise<void> {
        this.continue.click();
        await expect(this.branchSelectionHeading).toBeVisible();
    }

    async buildManual(): Promise<void> {
        await expect(this.createManual).toBeEnabled();
        await this.createManual.click();
        // TODO: return step 1
    }

    async nJoyBuild(): Promise<void> {
        await expect(this.njoyBuild).toBeEnabled();
        await this.njoyBuild.click();
        // TODO return step 2
    }
}



