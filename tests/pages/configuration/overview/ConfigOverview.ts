import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '../ConfigBasePage';

export class ConfigOverview extends ConfigBasePage {

    constructor(page: Page) {
        super(page)
    }

}