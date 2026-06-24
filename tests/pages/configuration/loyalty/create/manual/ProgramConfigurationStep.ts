import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { LoyaltyGeneralDetailsStep } from './LoyaltyGeneralDetailsStep';

export type ProgramConfigurationData = {
    programType: string;
    displayType: string;
    visitsPerStamp: string;
};

export const DEFAULT_PROGRAM_CONFIGURATION: ProgramConfigurationData = {
    programType: 'Visit-Based (Count Visits)',
    displayType: 'Card (Stamp Card)',
    visitsPerStamp: '1',
};

export class ProgramConfigurationStep extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly programTypeDropdown: Locator;
    private readonly displayTypeDropdown: Locator;
    private readonly visitsPerStampInput: Locator;
    private readonly validationError: Locator;
    private readonly visitsPerStampError: Locator;
    private readonly nextButton: Locator;
    private readonly amountPerStampError: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.locator('form').getByText('Program Configuration');
        this.programTypeDropdown = this.page.getByRole('combobox').filter({ hasText: /Visit-Based|Transaction-Based/ });
        this.displayTypeDropdown = this.page.getByRole('combobox').filter({ hasText: /Card|Ladder/ });
        this.visitsPerStampInput = this.page.getByRole('spinbutton').first();
        this.validationError = this.page.getByRole('alert', { name: 'Please fix the following' });
        this.visitsPerStampError = this.page.getByText('Visits per stamp must be at least');
        this.amountPerStampError = this.page.getByText('Amount per stamp must be at least')
        this.nextButton = this.page.getByRole('button', { name: 'Next', exact: true });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    async fill(data: ProgramConfigurationData): Promise<void> {
        await this.selectProgramType(data.programType);
        await this.selectDisplayType(data.displayType);
        await this.fillVisitsPerStamp(data.visitsPerStamp);
    }

    async fillDefaults(): Promise<void> {
        await this.fill(DEFAULT_PROGRAM_CONFIGURATION);
    }

    async next(): Promise<LoyaltyGeneralDetailsStep> {
        await this.nextButton.click();
        const generalDetailsStep = new LoyaltyGeneralDetailsStep(this.page);
        await generalDetailsStep.waitForReady();
        return generalDetailsStep;
    }

    async nextExpectingValidationError(): Promise<void> {
        await this.nextButton.click();
        await this.expectValidationError();
    }

    async selectProgramType(value: string): Promise<void> {
        await this.programTypeDropdown.click();
        await this.page.getByRole('option', { name: value }).click();
    }

    async selectDisplayType(value: string): Promise<void> {
        await this.displayTypeDropdown.click();
        await this.page.getByRole('option', { name: value }).click();
    }

    async fillVisitsPerStamp(value: string): Promise<void> {
        await this.visitsPerStampInput.click();
        await this.visitsPerStampInput.fill(value);
    }

    async fillAmountPerStamp(value: string): Promise<void> {
        await this.fillVisitsPerStamp(value);
    }

    async expectVisitsPerStampValidationError(): Promise<void> {
        await expect(this.visitsPerStampError).toBeVisible();
    }

    async expectAmountPerStampValidationError(): Promise<void> {
        await expect(this.amountPerStampError).toBeVisible(); 
    }

    async expectValidationError(): Promise<void> {
        await expect(this.validationError).toBeVisible();
    }
}
