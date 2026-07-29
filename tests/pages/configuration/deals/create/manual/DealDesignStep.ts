import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { DealsPage } from '../../DealsPage';

export class DealDesignStep extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly createDealButton: Locator;
    private readonly successAlert: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.getByRole('heading', { name: 'Design Tools' });
        this.createDealButton = this.page.getByRole('button', { name: 'Create Deal' });
        this.successAlert = this.page.getByText('Deal created successfully', { exact: true });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    async selectTemplate(templateName: string): Promise<void> {
        await this.page.getByRole('button', { name: templateName }).click();
    }

    async submit(): Promise<DealsPage> {
        await this.createDealButton.click();
        return new DealsPage(this.page);
    }

    async submitAndExpectSuccess(): Promise<void> {
        await this.createDealButton.click();
        await this.expectDealCreatedSuccess();
    }

    async expectDealCreatedSuccess(): Promise<void> {
        await expect(this.successAlert).toBeVisible();
    }
}
