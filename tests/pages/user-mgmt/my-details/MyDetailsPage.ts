import type { Page, Locator } from '@playwright/test';
import { UserManagementBasePage } from '../UserManagementBasePage';
import { StaffsPage } from '../staffs/StaffsPage'

export class MyDetailsPage extends UserManagementBasePage {
  private readonly userDetailsHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.userDetailsHeading = this.page.getByRole('heading', { name: 'User Details' });
  }

  override async waitForReady(): Promise<void> {
    await this.userDetailsHeading.waitFor({ state: 'visible' });
  }

  async goToMerchantStaffs(): Promise<StaffsPage> {
    await this.merchantStaffsLink.click();
    return new StaffsPage(this.page)
  }

}

