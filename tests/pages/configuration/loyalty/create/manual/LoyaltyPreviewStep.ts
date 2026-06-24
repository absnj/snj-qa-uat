import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { LoyaltyPage } from '../../LoyaltyPage';

export class LoyaltyPreviewStep extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly createButton: Locator;
    private readonly successAlert: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.getByText('Review the loyalty program');
        this.createButton = this.page.getByRole('button', { name: 'Create', exact: true });
        this.successAlert = this.page.getByText('Loyalty program created successfully', { exact: true });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    async submit(): Promise<LoyaltyPage> {
        await this.createButton.click();
        return new LoyaltyPage(this.page);
    }

    async submitAndExpectSuccess(): Promise<void> {
        await this.createButton.click();
        await this.expectLoyaltyProgramCreatedSuccess();
    }

    async expectLoyaltyProgramCreatedSuccess(): Promise<void> {
        await expect(this.successAlert).toBeVisible();
    }
}
