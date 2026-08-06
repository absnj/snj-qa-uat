import type { Page, Locator } from '@playwright/test';
import { BasePage } from '../../core/BasePage';

export abstract class ConfigBasePage extends BasePage {
    readonly overviewTab: Locator;

    constructor(page: Page) {
        super(page);
        this.overviewTab = this.page.getByRole('link', { name: 'Overview' });
    }

}
