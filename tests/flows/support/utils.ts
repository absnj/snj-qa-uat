import { Page, expect } from '@playwright/test';

/**
 * Helper: Fill the subject field
 */
export async function fillSubject(page: Page, subject: string): Promise<void> {
  await page.locator('.form-group').first().click();
  const subjectInput = page.getByRole('textbox');
  await subjectInput.waitFor({ state: 'visible' });
  await subjectInput.fill(subject);
}

/**
 * Helper: Fill the description field (Tiptap editor)
 * TODO: Use a different editor locator if tiptap is unreliable.
 */
export async function fillDescription(page: Page, description: string): Promise<void> {
  await page.locator('.tiptap').click();
  const descriptionEditor = page.getByRole('paragraph').filter({ hasText: /^$/ });
  await descriptionEditor.waitFor({ state: 'visible' });
  await descriptionEditor.click();
  await descriptionEditor.fill(description);
}

/**
 * Helper: Submit the ticket form
 */
export async function submitTicketForm(page: Page): Promise<void> {
  const submitButton = page.locator('form').getByRole('button', { name: 'Create' });
  await submitButton.waitFor({ state: 'visible' });
  await submitButton.click();
}

/**
 * Helper: Open the create ticket form
 */
export async function openCreateTicketForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Create' }).click();
  await page.waitForSelector('form', { state: 'visible' });
}

/**
 * Navigate to the Support page
 */
export async function navigateToSupport(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Support Help center, tickets' }).click();
  await expect(page).toHaveURL(/\/support\/ticket\/my-ticket\/?$/);
}