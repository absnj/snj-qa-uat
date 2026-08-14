import { Page } from '@playwright/test';
import { SupportBasePage } from './SupportBasePage';
import { CreateTicketPage } from './CreateTicketPage';

export class MyTicketsPage extends SupportBasePage { 
  private readonly createButton = this.page.getByRole('button', { name: 'Create', exact: true });

  constructor(page: Page) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await this.page.waitForURL(/\/support\/ticket\/my-ticket\/?$/);
    await this.createButton.waitFor({ state: 'visible' });
  }

  async openCreateTicket(): Promise<CreateTicketPage> {
    await this.createButton.click();
    const createTicket = new CreateTicketPage(this.page);
    await createTicket.waitForReady();
    return createTicket;
  }
}
