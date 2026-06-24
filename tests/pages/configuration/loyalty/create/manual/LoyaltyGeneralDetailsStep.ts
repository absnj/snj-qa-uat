import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { RewardsConfigurationStep } from './RewardsConfigurationStep';
import { generateLoyaltyProgramTitle } from '../../../../../testDataGenerators';

export type LoyaltyGeneralDetailsData = {
    title: string;
    description: string;
    fullDescription: string;
    keywords: string[];
    startDate: string;
    endDate: string;
};

export class LoyaltyGeneralDetailsStep extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly programTitleInput: Locator;
    private readonly descriptionInput: Locator;
    private readonly fullDescriptionEditor: Locator;
    private readonly keywordsInput: Locator;
    private readonly startDateInput: Locator;
    private readonly endDateInput: Locator;
    private readonly validationError: Locator;
    private readonly nextButton: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.locator('form').getByText('Program Photo');
        this.programTitleInput = this.page.getByRole('textbox').first();
        this.descriptionInput = this.page.locator('textarea').first();
        this.fullDescriptionEditor = this.page.locator('.tiptap').first();
        this.keywordsInput = this.page.getByRole('textbox', { name: 'Type keywords and press Enter' });
        this.startDateInput = this.page.getByRole('textbox', { name: 'YYYY-MM-DD' }).first();
        this.endDateInput = this.page.getByRole('textbox', { name: 'YYYY-MM-DD' }).nth(1);
        this.validationError = this.page.getByRole('alert', { name: 'Please fix the following' });
        this.nextButton = this.page.getByRole('button', { name: 'Next', exact: true });
    }

    static validData(overrides: Partial<LoyaltyGeneralDetailsData> = {}): LoyaltyGeneralDetailsData {
        return {
            title: generateLoyaltyProgramTitle(),
            description: 'Test loyalty program description',
            fullDescription: 'Full description for an automated loyalty program.',
            keywords: ['loyalty', 'uat', 'test'],
            startDate: LoyaltyGeneralDetailsStep.futureDate(7),
            endDate: LoyaltyGeneralDetailsStep.futureDate(60),
            ...overrides,
        };
    }

    private static futureDate(daysFromNow: number): string {
        const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
        return date.toISOString().slice(0, 10);
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    async fill(data: LoyaltyGeneralDetailsData): Promise<void> {
        await this.fillProgramTitle(data.title);
        await this.fillDescription(data.description);
        await this.fillFullDescription(data.fullDescription);
        await this.addKeywords(data.keywords);
        await this.fillStartDate(data.startDate);
        await this.fillEndDate(data.endDate);
    }

    async nextExpectingValidationError(): Promise<void> {
        await this.nextButton.click();
        await this.expectValidationError();
    }

    async next(): Promise<RewardsConfigurationStep> {
        await this.nextButton.click();
        const rewardsConfigurationStep = new RewardsConfigurationStep(this.page);
        await rewardsConfigurationStep.waitForReady();
        return rewardsConfigurationStep;
    }

    async fillProgramTitle(value: string): Promise<void> {
        await this.programTitleInput.click();
        await this.programTitleInput.fill(value);
    }

    async fillDescription(value: string): Promise<void> {
        await this.descriptionInput.click();
        await this.descriptionInput.fill(value);
    }

    async fillFullDescription(value: string): Promise<void> {
        await this.fullDescriptionEditor.click();
        await this.fullDescriptionEditor.fill(value);
    }

    async addKeyword(keyword: string): Promise<void> {
        await this.keywordsInput.click();
        await this.keywordsInput.fill(keyword);
        await this.keywordsInput.press('Enter');
    }

    async addKeywords(keywords: string[]): Promise<void> {
        for (const keyword of keywords) {
            await this.addKeyword(keyword);
        }
    }

    async fillStartDate(value: string): Promise<void> {
        await this.startDateInput.click();
        await this.startDateInput.fill(value);
    }

    async fillEndDate(value: string): Promise<void> {
        await this.endDateInput.click();
        await this.endDateInput.fill(value);
    }

    async expectTitleValidationError(): Promise<void> {
        await this.expectValidationError();
    }

    async expectDescriptionValidationError(): Promise<void> {
        await this.expectValidationError();
    }

    async expectDateValidationError(): Promise<void> {
        await this.expectValidationError();
    }

    async expectValidationError(): Promise<void> {
        await expect(this.validationError).toBeVisible();
    }
}
