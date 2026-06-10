import type { Page, Locator } from '@playwright/test';
import { UserManagementBasePage } from '../UserManagementBasePage';

export class StaffsPage extends UserManagementBasePage {
  readonly createButton: Locator;
  readonly staffsHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.createButton = this.page.getByRole('button', { name: 'Create' });
    this.staffsHeading = this.page.getByRole('heading', { name: 'Merchant/Staff Management' });
  }

  override async waitForReady(): Promise<void> {
    super.waitForReady();
    await this.staffsHeading.waitFor({ state: 'visible' });
  }

  async openCreateStaffForm(): Promise<void> {
    await this.createButton.click();
  }


 
}
