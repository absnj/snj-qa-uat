import type { Page, Locator } from '@playwright/test';
import { UserManagementBasePage } from '../../../UserManagementBasePage';
import { ISubmitStep } from 'tests/interfaces/IFormStep';

export class ReviewStep extends UserManagementBasePage implements ISubmitStep {
    reviewHeading: Locator;
    submitButton: Locator;

    constructor(page: Page) {
        super(page);
        this.reviewHeading = this.page.getByRole('heading', { name: 'Review' });
        this.submitButton = this.page.getByRole('button', { name: 'Submit' });
    }

    override async waitForReady(): Promise<void> {
        super.waitForReady();
        await this.reviewHeading.waitFor({ state: 'visible' });
    }

    async submit(): Promise<void> {
        await this.submitButton.click();
    }
}