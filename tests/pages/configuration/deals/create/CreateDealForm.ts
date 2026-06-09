import type { Page, Locator } from '@playwright/test';
import { ConfigBasePage } from '../../ConfigBasePage';
import { expect } from '@playwright/test';

export abstract class CreateDealForm extends ConfigBasePage {
    readonly createDealHeader: Locator

    constructor(page: Page) {
        super(page);
        this.createDealHeader = this.page.getByRole('heading', { name: 'Create Deal' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.createDealHeader).toBeVisible();
    }

    abstract fill(): Promise<void>;
    abstract nextStep(): Promise<void>;
}   