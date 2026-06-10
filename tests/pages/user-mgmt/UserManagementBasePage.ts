import type { Page, Locator } from '@playwright/test';
import { BasePage } from '../../core/BasePage';

export abstract class UserManagementBasePage extends BasePage {
  readonly userManagementHeading: Locator; 
  readonly userManagementLink: Locator;
  readonly merchantStaffsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.userManagementHeading = this.page.getByRole('heading', { name: 'User Management' });
    this.userManagementLink = this.page.getByRole('link', { name: 'User Management User' });
    this.merchantStaffsLink = this.page.getByRole('link', { name: 'Merchant/Branch Staffs' });
  }
}
