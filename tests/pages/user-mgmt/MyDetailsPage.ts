import { Page } from '@playwright/test';
import { UserManagementBasePage } from './UserManagementBasePage';
import { StaffsPage } from './StaffsPage';

export class MyDetailsPage extends UserManagementBasePage {
  private readonly userDetailsHeading = this.page.getByRole('heading', { name: 'User Details' });

  constructor(page: Page) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await this.userDetailsHeading.waitFor({ state: 'visible' });
  }

  async goToMerchantStaffs(): Promise<StaffsPage> {
      await this.merchantStaffsLink.click();
      const staffs = new StaffsPage(this.page);
      await staffs.waitForReady();
      return staffs;
    }
}
