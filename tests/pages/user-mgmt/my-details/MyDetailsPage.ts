import type { Page, Locator } from '@playwright/test';
import { UserManagementBasePage } from '../UserManagementBasePage';

export class MyDetailsPage extends UserManagementBasePage {
  private readonly userDetailsHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.userDetailsHeading = this.page.getByRole('heading', { name: 'User Details' });
  }

  override async waitForReady(): Promise<void> {
    await this.userDetailsHeading.waitFor({ state: 'visible' });
  }

}

