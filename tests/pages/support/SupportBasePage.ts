// tests/pages/support/SupportBasePage.ts
import { Page } from '@playwright/test';
import { BasePage } from '../../core/BasePage';
import type { MyTicketsPage } from './MyTicketsPage';
import type { FaqPage } from './FaqPage';

export abstract class SupportBasePage extends BasePage {
  // Sidebar links — available on every support page including forms
  private readonly myTicketsLink = this.page.getByRole('link', { name: 'My Tickets' });
  private readonly faqLink       = this.page.getByRole('link', { name: 'FAQ' });

  constructor(page: Page) {
    super(page);
  }

  async goToMyTickets(): Promise<MyTicketsPage> {
    await this.myTicketsLink.click();
    const { MyTicketsPage } = require('./MyTicketsPage') as typeof import('./MyTicketsPage');
    const myTickets = new MyTicketsPage(this.page);
    await myTickets.waitForReady();
    return myTickets;
  }

  async goToFaq(): Promise<FaqPage> {
    await this.faqLink.click();
    const { FaqPage } = require('./FaqPage') as typeof import('./FaqPage');
    const faq = new FaqPage(this.page);
    await faq.waitForReady();
    return faq;
  }
}
