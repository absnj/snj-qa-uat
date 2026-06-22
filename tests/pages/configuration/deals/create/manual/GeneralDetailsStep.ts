import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { DateTimeStep } from './DateTimeStep';

type GeneralDetailsData = {
    title: string;
    desc: string;
    fullDesc: string;
    keywords: string[];
};

export class GeneralDetailsStep extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly inputDealTitle: Locator;
    private readonly inputDesc: Locator;
    private readonly inputFullDesc: Locator;
    private readonly inputKeywords: Locator;
    private readonly keywordLimitMessage: Locator;
    private readonly validationError: Locator;
    private readonly nextButton: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.locator('form').getByText('General Details');
        this.inputDealTitle = this.page.getByRole('textbox').first();
        this.inputDesc = this.page.locator('textarea');
        this.inputFullDesc = this.page.locator('.tiptap');
        this.inputKeywords = this.page.getByRole('textbox', { name: 'Type keywords and press Enter' });
        this.keywordLimitMessage = this.page.getByText('Maximum 7 keywords allowed');
        this.validationError = this.page.getByRole('alert', { name: 'Please fix the following' });
        this.nextButton = this.page.getByRole('button', { name: 'Next', exact: true });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    async fill(data: GeneralDetailsData): Promise<void> {
        await this.fillDealTitle(data.title);
        await this.fillDescription(data.desc);
        await this.fillFullDescription(data.fullDesc);
        await this.addKeywords(data.keywords);
    }

    async next(): Promise<DateTimeStep> {
        await this.nextButton.click();
        const dateTimeStep = new DateTimeStep(this.page);
        await dateTimeStep.waitForReady();
        return dateTimeStep;
    }

    async nextExpectingValidationError(): Promise<void> {
        await this.nextButton.click();
        await this.expectValidationError();
    }

    async expectTitleValidationError(): Promise<void> {
        await this.expectValidationError();
    }

    async expectDescriptionValidationError(): Promise<void> {
        await this.expectValidationError();
    }

    async expectValidationError(): Promise<void> {
        await expect(this.validationError).toBeVisible();
    }

    async verifyKeywordLimit(): Promise<void> {
        await expect(this.keywordLimitMessage).toBeVisible();
    }

    async fillDealTitle(value: string): Promise<void> {
        await this.inputDealTitle.click();
        await this.inputDealTitle.fill(value);
    }

    async fillDescription(value: string): Promise<void> {
        await this.inputDesc.click();
        await this.inputDesc.fill(value);
    }

    async fillFullDescription(value: string): Promise<void> {
        await this.inputFullDesc.click();
        await this.inputFullDesc.fill(value);
    }

    async addKeyword(keyword: string): Promise<void> {
        await this.inputKeywords.click();
        await this.inputKeywords.fill(keyword);
        await this.inputKeywords.press('Enter');
    }

    async addKeywords(keywords: string[]): Promise<void> {
        for (const keyword of keywords) {
            await this.addKeyword(keyword);
        }
    }
}
