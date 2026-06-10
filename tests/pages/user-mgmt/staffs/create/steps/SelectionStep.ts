import type { Page, Locator } from '@playwright/test';
import { UserManagementBasePage } from '../../../UserManagementBasePage';
import { IFormStep } from 'tests/interfaces/IFormStep';



export class SelectionStep extends UserManagementBasePage implements IFormStep<void> {
    selectionHeading: Locator;
    nextButton: Locator;
    
    constructor(page: Page) {
        super(page);
        this.selectionHeading = this.page.getByRole('heading', { name: 'Select User Type' });
        this.nextButton = this.page.getByRole('button', { name: 'Next' });
    }

    override async waitForReady(): Promise<void> {
        super.waitForReady();
        await this.selectionHeading.waitFor({ state: 'visible' });
    }
    
    async fill(): Promise<void> {
        // Implementation for filling user data
    }

    async next(): Promise<void> {
        await this.nextButton.click();
    }

}
