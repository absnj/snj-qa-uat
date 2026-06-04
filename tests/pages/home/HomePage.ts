// pages/Home/HomePage.ts
import { Page, expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage';

export class HomePage extends BasePage {
  readonly welcomeHeading  = this.page.getByRole('heading', { name: 'Welcome to ShopNJoy' });
  private readonly logo            = this.page.getByRole('img', { name: 'ShopNJoy' });
  private readonly userMenu        = this.page.getByText(/Hi,/);
  private readonly notificationBell = this.page.getByRole('button', { name: 'Notifications' });

  // Module cards
  private readonly trackCard          = this.page.getByRole('button', { name: /Track/ });
  private readonly financeCard        = this.page.getByRole('button', { name: /Finance/ });
  private readonly messageCard        = this.page.getByRole('button', { name: /Message/ });
  private readonly configurationCard  = this.page.getByRole('button', { name: /Configuration/ });
  private readonly userManagementCard = this.page.getByRole('button', { name: /User Management/ });
  private readonly supportCard        = this.page.getByRole('button', { name: /Support/ });

  override async waitForReady(): Promise<void> {
    await expect(this.welcomeHeading).toBeVisible({ timeout: 30_000 });
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  async goToTrack(): Promise<TrackPage> {
    await this.trackCard.click();
    const { TrackPage } = await import('../track/TrackPage');
    const track = new TrackPage(this.page);
    await track.waitForReady();
    return track;
  }

  async goToFinance(): Promise<FinancePage> {
    await this.financeCard.click();
    const { FinancePage } = await import('../finance/FinancePage');
    const finance = new FinancePage(this.page);
    await finance.waitForReady();
    return finance;
  }

  async goToConfiguration(): Promise<ConfigurationPage> {
    await this.configurationCard.click();
    const { ConfigurationPage } = await import('../configuration/ConfigurationPage');
    const config = new ConfigurationPage(this.page);
    await config.waitForReady();
    return config;
  }

  async goToUserManagement(): Promise<UserManagementPage> {
    await this.userManagementCard.click();
    const { UserManagementPage } = await import('../userManagement/UserManagementPage');
    const userMgmt = new UserManagementPage(this.page);
    await userMgmt.waitForReady();
    return userMgmt;
  }

  async goToSupport(): Promise<SupportPage> {
    await this.supportCard.click();
    const { SupportPage } = await import('../support/SupportPage');
    const support = new SupportPage(this.page);
    await support.waitForReady();
    return support;
  }

  async goToMessage(): Promise<MessagePage> {
    await this.messageCard.click();
    const { MessagePage } = await import('../message/MessagePage');
    const message = new MessagePage(this.page);
    await message.waitForReady();
    return message;
  }

  // ---------------------------------------------------------------------------
  // Shared nav
  // ---------------------------------------------------------------------------

  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
  }

  async openNotifications(): Promise<void> {
    await this.notificationBell.click();
  }
}