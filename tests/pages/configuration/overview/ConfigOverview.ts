import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '../ConfigBasePage';
import { DealsPage } from '../deals/DealsPage';

export class ConfigOverview extends ConfigBasePage {
    private readonly overviewHeader: Locator;

    constructor(page: Page) {
        super(page);
        this.overviewHeader = this.page.getByRole('heading', { name: 'Details' });
    }

    async goToDeals(): Promise<DealsPage> {
        await this.dealsTab.click();
        const dealsPage = new DealsPage(this.page);
        await dealsPage.waitForReady();
        return dealsPage;
    }

    async waitForReady(): Promise<void> {
       await expect(this.overviewHeader).toBeVisible(); 
       await super.waitForReady();
    }
}
