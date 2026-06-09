// pages/Auth/LoginPage.ts
import { Page, BrowserContext, expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage';
import { HomePage } from '../home/HomePage';
import { getBaseUrl } from '../../config/environments';

export class LoginPage extends BasePage {
  private readonly emailField    = this.page.getByRole('textbox', { name: 'Email Address' });
  private readonly passwordField = this.page.getByRole('textbox', { name: 'Password' });
  private readonly signInButton  = this.page.getByRole('button', { name: 'Sign In' });
  private readonly errorMessage  = this.page
    .getByRole('region', { name: 'Notifications' })
    .getByText('Invalid email or password.');

  constructor(page: Page, private readonly context: BrowserContext) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await expect(this.emailField).toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  private async fillEmail(username: string): Promise<void> {
    await this.emailField.click();
    await this.emailField.fill(username);
  }

  private async fillPassword(password: string): Promise<void> {
    await this.passwordField.click();
    await this.passwordField.fill(password);
  }

  private async submit(): Promise<void> {
    await expect(this.signInButton).toBeEnabled();
    await this.signInButton.click();
    await this.signInButton.click();
    await this.signInButton.click();
    await this.signInButton.click();
  }

  // ---------------------------------------------------------------------------
  // Flows
  // ---------------------------------------------------------------------------

  async loginAs(username: string, password: string): Promise<HomePage> {
    await this.context.clearCookies();
    await this.page.goto(getBaseUrl());
    await this.waitForReady();

    await this.fillEmail(username);
    await this.fillPassword(password);
    await this.submit();

    const home = new HomePage(this.page);
    await home.waitForReady();
    return home;
  }

  async loginWithInvalidCredentials(username: string, password: string): Promise<LoginPage> {
    await this.context.clearCookies();
    await this.page.goto(getBaseUrl());
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await this.page.reload();
    await this.waitForReady();

    await this.fillEmail(username);
    await this.fillPassword(`${password}invalid`);
    await this.submit();

    await expect(this.errorMessage).toBeVisible({ timeout: 10_000 });
    return this;
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  async getErrorMessage(): Promise<string> {
    return this.errorMessage.innerText();
  }
}
  
