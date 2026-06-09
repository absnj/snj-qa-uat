import type { Page, Locator } from '@playwright/test';
import { BasePage } from '../../core/BasePage';

export abstract class ConfigBasePage extends BasePage {
    readonly overviewTab: Locator;
    readonly dealsTab: Locator;
    readonly loyaltyTab: Locator;

    constructor(page: Page) {
        super(page);
        this.overviewTab = this.page.getByRole('link', { name: 'Overview' });
        this.dealsTab = this.page.getByRole('link', { name: 'Deals' });
        this.loyaltyTab = this.page.getByRole('link', { name: 'Loyalty Programs' });
    }
    
}