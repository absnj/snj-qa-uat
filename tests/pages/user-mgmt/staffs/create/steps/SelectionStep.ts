import type { Page, Locator } from '@playwright/test';
import { UserManagementBasePage } from '../../../UserManagementBasePage';
import { IFormStep } from 'tests/interfaces/IFormStep';
import { BasicInfoStep } from './BasicInfoStep';



export class SelectionStep extends UserManagementBasePage { 
    selectionHeading: Locator;
    nextButton: Locator;
    url: string;
    
    constructor(page: Page) {
        super(page);
        this.selectionHeading = this.page.locator('form').getByText('Selection');
        this.nextButton = this.page.getByRole('button', { name: 'Next' });
        this.url = '/user-management/staff/create-merchant-charity-staff?is_charity=false'; 
    }

    override async waitForReady(): Promise<void> {
        super.waitForReady();
        await this.selectionHeading.waitFor({ state: 'visible' });
    }
    
    async fill(): Promise<void> {
        // Implementation for filling user data
    }

    async next(): Promise<BasicInfoStep> {
        await this.nextButton.click();
        return new BasicInfoStep(this.page);
    }

    async goto(): Promise<void> {
        await this.page.goto(this.url);
    }








}
