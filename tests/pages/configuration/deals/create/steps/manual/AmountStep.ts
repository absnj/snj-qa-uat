import type { Page, Locator } from '@playwright/test';
import { CreateDealForm } from '../../CreateDealForm';
import { IFormStep } from 'tests/interfaces/IFormStep';
import { expect } from '@playwright/test';

type ProgramSetupData = {
    title: string,
    desc: string,
    fullDesc: string,
    keywords: string[],
}

export class AmountStep extends CreateDealForm implements IFormStep<ProgramSetupData> {
    dealTitle: Locator;
    description: Locator;
    fullDescription: Locator;
    keywordsInput: Locator;
    keywordLimitMessage: Locator;
    // TODO: photoUpload: Locator;


    constructor(page: Page) {
        super(page);
        this.dealTitle = page.getByRole('textbox').first();
        this.description = page.locator('textarea');
        this.fullDescription = page.getByPlaceholder('Type something...');
        this.keywordsInput = page.getByRole('textbox', { name: 'Type keywords and press Enter' });
        this.keywordLimitMessage = page.getByText('Maximum 7 keywords allowed');
    }

    async fill(data: ProgramSetupData): Promise<void> {
        await this.fillTitle(data.title);
        await this.fillDescription(data.desc);
        await this.fillFullDescription(data.fullDesc);
        await this.fillKeywords(data.keywords);
    }

    async next(): Promise<void> {}

    private async fillTitle(title: string): Promise<void> {
        await this.dealTitle.fill(title);
    }

    private async fillDescription(desc: string): Promise<void> {
        await this.description.fill(desc);
    }

    private async fillFullDescription(fullDesc: string): Promise<void> {
        await this.fullDescription.fill(fullDesc);
    }

    private async fillKeywords(keywords: string[]): Promise<void> {
        for (const keyword of keywords) {
            await this.keywordsInput.fill(keyword);
            await this.keywordsInput.press('Enter');
        }
    }
    
    private async verifyKeywordLimit(): Promise<void> {
        await expect(this.keywordLimitMessage).toBeVisible();
    }

}
