import { Page, expect } from '@playwright/test';


// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

const SELECTORS = {
  supportLink: (page: Page) =>
    page.getByRole('link', { name: 'Support Help center, tickets' }),
  createButton: (page: Page) => page.getByRole('button', { name: 'Create' }),
  form: (page: Page) => page.locator('form'),
  subjectInput: (page: Page) => page.getByRole('textbox'),
  descriptionEditor: (page: Page) => page.locator('.tiptap'),
  submitButton: (page: Page) =>
    page.locator('form').getByRole('button', { name: 'Create' }),
  alerts: {
    success: (page: Page) =>
      page.getByText('Ticket created successfully', { exact: true }),
    validationError: (page: Page) =>
      page.getByRole('alert', { name: 'Please fix the following' }),
    subjectRequired: (page: Page) =>
      page.getByText('Subject is required', { exact: true }),
    descriptionRequired: (page: Page) =>
      page.getByText('Description is required', { exact: true }),
    longSubjectError: (page: Page) =>
      page.getByRole('alert', { name: 'Validation Error' }),
    longSubjectMessage: (page: Page) =>
      page.getByText('• subject must be shorter than or equal to 255 characters', {
        exact: true,
      }),
  },
};

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export async function navigateToSupport(page: Page): Promise<void> {
  await SELECTORS.supportLink(page).click();
  await expect(page).toHaveURL(/\/support\/ticket\/my-ticket\/?$/);
}

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

export async function openCreateTicketForm(page: Page): Promise<void> {
  await SELECTORS.createButton(page).click();
  await SELECTORS.form(page).waitFor({ state: 'visible' });
}

export async function fillSubject(page: Page, subject: string): Promise<void> {
  const field = SELECTORS.subjectInput(page);
  await field.waitFor({ state: 'visible' });
  await field.click();
  await field.fill(subject);
}

export async function fillDescription(page: Page, description: string): Promise<void> {
  // Tiptap renders a contenteditable — click the editor to focus,
  // then target the empty paragraph it inserts as the cursor position.
  const editor = SELECTORS.descriptionEditor(page);
  await editor.waitFor({ state: 'visible' });
  await editor.click();
  const emptyParagraph = page.getByRole('paragraph').filter({ hasText: /^$/ });
  await emptyParagraph.waitFor({ state: 'visible' });
  await emptyParagraph.fill(description);
}

export async function submitTicketForm(page: Page): Promise<void> {
  const button = SELECTORS.submitButton(page);
  await button.waitFor({ state: 'visible' });
  await expect(button).toBeEnabled();
  await button.click();
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

export async function expectTicketCreatedSuccess(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.success(page)).toBeVisible();
}

export async function expectValidationError(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.validationError(page)).toBeVisible();
}

export async function expectSubjectRequiredError(page: Page): Promise<void> {
  await expectValidationError(page);
  await expect(SELECTORS.alerts.subjectRequired(page)).toBeVisible();
}

export async function expectDescriptionRequiredError(page: Page): Promise<void> {
  await expectValidationError(page);
  await expect(SELECTORS.alerts.descriptionRequired(page)).toBeVisible();
}

export async function expectLongSubjectError(page: Page): Promise<void> {
  await expect(SELECTORS.alerts.longSubjectError(page)).toBeVisible();
  await expect(SELECTORS.alerts.longSubjectMessage(page)).toBeVisible();
}