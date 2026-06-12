import type { Page, Locator } from '@playwright/test';
import { UserManagementBasePage } from '../../../UserManagementBasePage';
import { StaffsPage } from '../../StaffsPage'
import { ISubmitStep } from 'tests/interfaces/IFormStep';

export class ReviewStep extends UserManagementBasePage implements ISubmitStep<StaffsPage> {
    reviewHeading: Locator;
    submitButton: Locator;
    successAlert: Locator;

    constructor(page: Page) {
        super(page);
        this.reviewHeading = this.page.getByText('Review', { exact : true });
        this.submitButton = this.page.getByRole('button', { name: 'Create Staff' });
        this.successAlert = this.page.getByText('Staff created successfully', { exact: true});
    }

    

    override async waitForReady(): Promise<void> {
        super.waitForReady();
        await this.reviewHeading.waitFor({ state: 'visible' });
    }

    async submit(): Promise<StaffsPage> {
        await this.submitButton.click();
        return new StaffsPage(this.page);
    }
}
