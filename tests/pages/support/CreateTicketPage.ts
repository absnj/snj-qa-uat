import { Page, expect } from '@playwright/test';
import { SupportBasePage } from './SupportBasePage';
import type { MyTicketsPage } from './MyTicketsPage';

export class CreateTicketPage extends SupportBasePage {
  private readonly subjectInput      = this.page.getByRole('textbox');
  private readonly descriptionEditor = this.page.locator('.tiptap');
  private readonly submitButton      = this.page.locator('form').getByRole('button', { name: 'Create' });

  readonly validationAlert          = this.page.getByRole('alert', { name: 'Please fix the following' });
  readonly subjectRequiredAlert     = this.page.getByText('Subject is required', { exact: true });
  readonly descriptionRequiredAlert = this.page.getByText('Description is required', { exact: true });
  readonly longSubjectAlert         = this.page.getByRole('alert', { name: 'Validation Error' });
  readonly longSubjectMessage       = this.page.getByText('• subject must be shorter than or equal to 255 characters', { exact: true });

  constructor(page: Page) {
    super(page);
  }

  override async waitForReady(): Promise<void> {
    await this.subjectInput.waitFor({ state: 'visible' });
  }

  async fillSubject(subject: string): Promise<void> {
    await this.subjectInput.click();
    await this.subjectInput.fill(subject);
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionEditor.click();
    const emptyParagraph = this.page.getByRole('paragraph').filter({ hasText: /^$/ });
    await emptyParagraph.waitFor({ state: 'visible' });
    await emptyParagraph.fill(description);
  }

  async submit(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  /** Submits and waits for the return to My Tickets — the success toast auto-dismisses. */
  async submitAndExpectCreated(): Promise<MyTicketsPage> {
    await this.submit();
    // Lazy: MyTicketsPage imports this class.
    const { MyTicketsPage } = require('./MyTicketsPage') as typeof import('./MyTicketsPage');
    const myTickets = new MyTicketsPage(this.page);
    await myTickets.waitForReady();
    return myTickets;
  }

  static get longSubject(): string {
    return 'a'.repeat(256);
  }
}
