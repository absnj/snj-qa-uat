// core/BasePage.ts
import { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async waitForReady(): Promise<void> {
    await this.page.getByRole('img', { name: 'ShopNJoy' }).waitFor({ state: 'hidden'});
  }

  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}