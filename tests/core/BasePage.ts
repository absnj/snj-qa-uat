// core/BasePage.ts
import { Page, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Generic "the app has stopped loading" signal: no ShopNJoy preloader logo is
   * on screen any more.
   *
   * Asserted as a count of *visible* preloaders rather than waiting on a single
   * element, because the number of them varies by module — Track renders two (a
   * module-level "Loading Track module..." status plus a page-level one), which
   * makes a single-element `waitFor` throw a strict-mode violation. Filtering to
   * visible also keeps this tolerant of a module that hides its preloader in
   * place instead of removing it from the DOM.
   */
  async waitForReady(): Promise<void> {
    await expect(
      this.page.getByRole('img', { name: 'ShopNJoy' }).filter({ visible: true }),
    ).toHaveCount(0);
  }

  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}
