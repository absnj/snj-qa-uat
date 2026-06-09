import { Page } from '@playwright/test';
import { UserManagementBasePage } from './UserManagementBasePage';
import { CreateUserPage } from './CreateUserPage';

export class StaffsPage extends UserManagementBasePage {
  readonly createButton = this.page.getByRole('button', { name: 'Create' });

  constructor(page: Page) {
    super(page);
  }

  async openCreateUser(): Promise<CreateUserPage> {
    await this.createButton.click();
    const createUser = new CreateUserPage(this.page);
    await createUser.waitForReady();
    return createUser;
}
}
