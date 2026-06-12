// tests/pages/support/FaqPage.ts
import { Page } from '@playwright/test';
import { SupportBasePage } from './SupportBasePage';

export class FaqPage extends SupportBasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await this.page.waitForURL(/\/support\/faq/);
  }
}
