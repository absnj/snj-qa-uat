import { Page } from '@playwright/test';
import { BasePage } from '../../core/BasePage';
import type { StaffsPage } from './StaffsPage';

export abstract class UserManagementBasePage extends BasePage {
  private readonly userManagementLink = this.page.getByRole('link', { name: 'User Management User' });
  readonly merchantStaffsLink = this.page.getByRole('link', { name: 'Merchant/Branch Staffs' });

  constructor(page: Page) {
    super(page);
  }

  protected async navigateTo<T extends UserManagementBasePage>(
    PageClass: new (page: Page) => T
  ): Promise<T> {
    const pageObject = new PageClass(this.page);
    await pageObject.waitForReady();
    return pageObject;
  }
  
}
