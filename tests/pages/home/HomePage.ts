import { Page, expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage';
import { FaqPage } from '../support/FaqPage';
import { MyTicketsPage } from '../support/MyTicketsPage';
import { MyDetailsPage } from '../user-mgmt/my-details/MyDetailsPage';
import { ConfigOverview } from '../configuration/overview/ConfigOverview'

export class HomePage extends BasePage {
  readonly welcomeHeading  = this.page.getByRole('heading', { name: 'Welcome to ShopNJoy' });
  private readonly logo            = this.page.getByRole('img', { name: 'ShopNJoy' });
  private readonly userMenu        = this.page.getByText(/Hi,/);
  private readonly notificationBell = this.page.getByRole('button', { name: 'Notifications' });

  // Module cards
  private readonly trackCard          = this.page.getByRole('link', { name: /Track/ });
  private readonly financeCard        = this.page.getByRole('link', { name: /Finance/ });
  private readonly messageCard        = this.page.getByRole('link', { name: /Message/ });
  private readonly configurationCard  = this.page.getByRole('link', { name: "Configuration Merchants," });
  private readonly userManagementCard = this.page.getByRole('link', { name: /User Management/ });
  private readonly supportCard        = this.page.getByRole('link', { name: /Support/ });

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForReady();
  }

  override async waitForReady(): Promise<void> {
    await expect(this.welcomeHeading).toBeVisible({ timeout: 30_000 });
  }

  // Navigation

  // async goToTrack(): Promise<TrackPage> {
  //   await this.trackCard.click();
  //   const { TrackPage } = await import('../track/TrackPage');
  //   const track = new TrackPage(this.page);
  //   await track.waitForReady();
  //   return track;
  // }

  // async goToFinance(): Promise<FinancePage> {
  //   await this.financeCard.click();
  //   const { FinancePage } = await import('../finance/FinancePage');
  //   const finance = new FinancePage(this.page);
  //   await finance.waitForReady();
  //   return finance;
  // }

  async goToConfiguration(): Promise<ConfigOverview> {
    await this.configurationCard.click();
    const config = new ConfigOverview(this.page); 
    await config.waitForReady();
    return config;
  }

  async goToUserManagement(): Promise<MyDetailsPage> {
    await this.userManagementCard.click();
    const myDetails = new MyDetailsPage(this.page);
    await myDetails.waitForReady();
    return myDetails;
  }

  async goToSupport(): Promise<MyTicketsPage> {
    await this.supportCard.click();
    const faq = new FaqPage(this.page);
    await faq.waitForReady();
    return faq.goToMyTickets();
  }

  // async goToMessage(): Promise<MessagePage> {
  //   await this.messageCard.click();
  //   const { MessagePage } = await import('../message/MessagePage');
  //   const message = new MessagePage(this.page);
  //   await message.waitForReady();
  //   return message;
  // }

  // Shared nav

  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
  }

  async openNotifications(): Promise<void> {
    await this.notificationBell.click();
  }
}
