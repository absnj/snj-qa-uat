import type { Page, Locator } from '@playwright/test';
import { UserManagementBasePage } from '../UserManagementBasePage';
import { SelectionStep } from './create/steps/SelectionStep'

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

  async openCreateStaffForm(): Promise<SelectionStep> {
    await this.createButton.click();
    return new SelectionStep(this.page)
  }


 
}
