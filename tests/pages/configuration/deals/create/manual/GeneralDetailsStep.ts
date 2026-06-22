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
    private readonly nextButton: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.locator('form').getByText('General Details');
        this.inputDealTitle = this.page.getByRole('textbox').first();
        this.inputDesc = this.page.locator('textarea');
        this.inputFullDesc = this.page.getByPlaceholder('Type something...');
        this.inputKeywords = this.page.getByRole('textbox', { name: 'Type keywords and press Enter' });
        this.keywordLimitMessage = this.page.getByText('Maximum 7 keywords allowed');
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
        return new DateTimeStep(this.page);
    }

    async verifyKeywordLimit(): Promise<void> {
        await expect(this.keywordLimitMessage).toBeVisible();
    }

    private async fillDealTitle(value: string): Promise<void> {
        await this.inputDealTitle.click();
        await this.inputDealTitle.fill(value);
    }

    private async fillDescription(value: string): Promise<void> {
        await this.inputDesc.click();
        await this.inputDesc.fill(value);
    }

    private async fillFullDescription(value: string): Promise<void> {
        await this.inputFullDesc.click();
        await this.inputFullDesc.fill(value);
    }

    private async addKeyword(keyword: string): Promise<void> {
        await this.inputKeywords.click();
        await this.inputKeywords.fill(keyword);
        await this.inputKeywords.press('Enter');
    }

    private async addKeywords(keywords: string[]): Promise<void> {
        for (const keyword of keywords) {
            await this.addKeyword(keyword);
        }
    }
}