import type { Page, Locator } from '@playwright/test';
import { UserManagementBasePage } from '../../../UserManagementBasePage';
import { ReviewStep } from './ReviewStep'

type UserData = {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    password: string;
    confirmPassword: string;
    phone: string;
}

export class BasicInfoStep extends UserManagementBasePage { 
    basicInfoHeading: Locator;
    nextButton: Locator;
    firstNameInput: Locator;
    lastNameInput: Locator
    emailInput: Locator;
    roleDropdown: Locator;
    defaultOption: Locator;
    passwordInput: Locator;
    confirmPasswordInput: Locator;
    phoneInput: Locator;

    // Errors (TODO: make errors more robust. list errors for each individual component)
    validationError: Locator;

    
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
        this.roleDropdown = this.page.getByRole('combobox').filter({hasText: "Select a role"})
        this.defaultOption = this.page.getByRole('option', { name: 'merchant-admin'});
        this.validationError = this.page.getByText('Please fix the following fields', { exact: true })
        this.phoneInput = this.page.locator('input[type="tel"]');
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await this.basicInfoHeading.waitFor({ state: 'visible' });
    }
    
    async fill(userData: UserData): Promise<void> {
        await this.fillFirstName(userData.firstName);
        await this.fillLastName(userData.lastName);
        await this.fillEmail(userData.email);
        await this.selectRole(userData.role);
        await this.fillPassword(userData.password);
        await this.fillConfirmPassword(userData.confirmPassword);
        await this.fillPhone(userData.phone);
    }

    async next(): Promise<ReviewStep> {
        await this.nextButton.click();
        return new ReviewStep(this.page)
    }

    // Helpers

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

    private async fillPhone(phone: string): Promise<void> {
        await this.phoneInput.click();
        await this.phoneInput.fill(phone);
    }

    private async selectRole(role: string) {
        await this.roleDropdown.click();
        await this.page.getByRole('option', { name: role}).click();
    }
}
