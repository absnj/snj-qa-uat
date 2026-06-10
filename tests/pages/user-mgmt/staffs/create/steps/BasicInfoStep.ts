import type { Page, Locator } from '@playwright/test';
import { UserManagementBasePage } from '../../../UserManagementBasePage';
import { IFormStep } from 'tests/interfaces/IFormStep';

type UserData = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export class BasicInfoStep extends UserManagementBasePage implements IFormStep<UserData> {
    basicInfoHeading: Locator;
    nextButton: Locator;
    firstNameInput: Locator;
    lastNameInput: Locator
    emailInput: Locator;
    passwordInput: Locator;
    confirmPasswordInput: Locator;
    
    constructor(page: Page) {
        super(page);
        this.basicInfoHeading = this.page.getByText('Basic Information', { exact: true });
        this.nextButton = this.page.getByRole('button', { name: 'Next' });
        this.firstNameInput = this.page
            .getByText('First Name * Last Name')
            .getByRole('textbox')
            .first();
        this.lastNameInput = this.page
            .getByText('First Name * Last Name')
            .getByRole('textbox')
            .nth(1);
        this.emailInput = this.page.locator('input[type="email"]');
        this.passwordInput = this.page.getByRole('textbox').nth(4);
        this.confirmPasswordInput = this.page.getByRole('textbox').nth(5);
    }
    
    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await this.basicInfoHeading.waitFor({ state: 'visible' });
    }
    
    async fill(userData: UserData): Promise<void> {
        await this.fillFirstName(userData.firstName);
        await this.fillLastName(userData.lastName);
        await this.fillEmail(userData.email);
        await this.fillPassword(userData.password);
        await this.fillConfirmPassword(userData.confirmPassword);
    }

    async next(): Promise<void> {
        await this.nextButton.click();
    }

    private async fillFirstName(firstName: string): Promise<void> {
        await this.firstNameInput.click();
        await this.firstNameInput.fill(firstName);
    }

    private async fillLastName(lastName: string): Promise<void> {
        await this.lastNameInput.click();
        await this.lastNameInput.fill(lastName);
    }

    private async fillEmail(email: string): Promise<void> {
        await this.emailInput.click();
        await this.emailInput.fill(email);
    }

    private async fillPassword(password: string): Promise<void> {
        await this.passwordInput.click();
        await this.passwordInput.fill(password);
    }

    private async fillConfirmPassword(confirmPassword: string): Promise<void> {
        await this.confirmPasswordInput.click();
        await this.confirmPasswordInput.fill(confirmPassword);
    }

}
