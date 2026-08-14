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

  /**
   * No `super.waitForReady()`: the ShopNJoy image it waits to disappear is
   * permanent branding here, not a preloader.
   *
   * The form paints before Nuxt hydrates, and `Sign In` is a real
   * `type="submit"` in a `<form method="post">` — clicking too early does a
   * native POST to /login, discarding the credentials and issuing no
   * `/auth/sign-in` at all. An implementation detail, but the two states are
   * visually identical so there is nothing else to wait on.
   *
   * Waits on Nuxt's own `isHydrating`, not on `__vue_app__`: `app.mount()` sets
   * `__vue_app__` when mounting *starts*, so that flag goes true while the form
   * below it is still inert. `isHydrating` flips false only once hydration has
   * resolved. Under 8x CPU throttling the two are ~200ms apart, and that gap is
   * what swallowed the click on CI runners.
   */
  override async waitForReady(): Promise<void> {
    await this.page.waitForFunction(
      () => {
        try {
          const app = (window as { useNuxtApp?: () => { isHydrating?: boolean } }).useNuxtApp?.();
          return Boolean(app) && app!.isHydrating === false;
        } catch {
          return false; // Nuxt not on the page yet
        }
      },
      null,
      { timeout: 30_000 },
    );
    await expect(this.emailField).toBeVisible();
  }

  // Actions

  private async fillEmail(username: string): Promise<void> {
    await this.emailField.click();
    await this.emailField.fill(username);
  }

  private async fillPassword(password: string): Promise<void> {
    await this.passwordField.click();
    await this.passwordField.fill(password);
  }

  /**
   * Requires the request to actually fire, so a swallowed click (see
   * `waitForReady()`) fails by name instead of timing out later on a dashboard
   * that can never load. Any status counts — 401 still means it submitted.
   */
  private async submit(): Promise<void> {
    await expect(this.signInButton).toBeEnabled();

    const signInRequest = this.page
      .waitForResponse((response) => response.url().includes('/auth/sign-in'), { timeout: 15_000 })
      .catch(() => null);

    await this.signInButton.click();

    if (!(await signInRequest)) {
      throw new Error(
        'Sign In produced no /auth/sign-in request within 15s — the form was submitted ' +
          'natively, meaning the app was not hydrated when the button was clicked.',
      );
    }
  }

  // Flows

  async loginAs<T extends BasePage = HomePage>(
    username: string,
    password: string,
    opts: { createHomePage?: (page: Page) => T } = {},
  ): Promise<T> {
    const createHomePage = (opts.createHomePage ?? ((page: Page) => new HomePage(page))) as (page: Page) => T;

    await this.context.clearCookies();
    await this.page.goto(getBaseUrl());
    await this.waitForReady();

    await this.fillEmail(username);
    await this.fillPassword(password);
    await this.submit();

    const home = createHomePage(this.page);
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

  // Getters

  async getErrorMessage(): Promise<string> {
    return this.errorMessage.innerText();
  }
}
  
