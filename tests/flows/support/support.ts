import { Page, expect } from '@playwright/test';
import { loginAs } from './auth';

/**
 * Helper: Fill the subject field
 */
async function fillSubject(page: Page, subject: string): Promise<void> {
  await page.locator('.form-group').first().click();
  const subjectInput = page.getByRole('textbox');
  await subjectInput.waitFor({ state: 'visible' });
  await subjectInput.fill(subject);
}

/**
 * Helper: Fill the description field (Tiptap editor)
 * TODO: Use a different editor locator if tiptap is unreliable.
 */
async function fillDescription(page: Page, description: string): Promise<void> {
  await page.locator('.tiptap').click();
  const descriptionEditor = page.getByRole('paragraph').filter({ hasText: /^$/ });
  await descriptionEditor.waitFor({ state: 'visible' });
  await descriptionEditor.click();
  await descriptionEditor.fill(description);
}

/**
 * Helper: Submit the ticket form
 */
async function submitTicketForm(page: Page): Promise<void> {
  const submitButton = page.locator('form').getByRole('button', { name: 'Create' });
  await submitButton.waitFor({ state: 'visible' });
  await submitButton.click();
}

/**
 * Helper: Open the create ticket form
 */
async function openCreateTicketForm(page: Page): Promise<void> {
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

/**
 * Create a ticket with valid data
 * Fills in subject, description, type, and priority
 */
export async function createTicketSuccess(
  page: Page,
  subject: string = 'test',
  description: string = 'test desc',
  type: string = 'Support',
  priority: string = 'High'
): Promise<void> {
  await navigateToSupport(page);
  await openCreateTicketForm(page);
  
  await fillSubject(page, subject);
  await fillDescription(page, description);
  
  await submitTicketForm(page);
  await expect(page.getByText('Ticket created successfully', { exact: true })).toBeVisible();
}

/**
 * Create a ticket with empty subject (validation failure)
 */
export async function createTicketEmptySubject(
  page: Page,
  description: string = 'test desc',
  type: string = 'Support',
  priority: string = 'High'
): Promise<void> {
  await navigateToSupport(page);
  await openCreateTicketForm(page);
  
  // Skip subject - leave it empty
  await fillDescription(page, description);
  
  await submitTicketForm(page);
  await expect(page.getByRole('alert', { name: 'Please fix the following' })).toBeVisible();
  await expect(page.getByText('• Subject is required', { exact: true })).toBeVisible();
}

/**
 * Create a ticket with empty description (validation failure)
 */
export async function createTicketEmptyDescription(
  page: Page,
  subject: string = 'test',
  type: string = 'Support',
  priority: string = 'High'
): Promise<void> {
  await navigateToSupport(page);
  await openCreateTicketForm(page);
  
  await fillSubject(page, subject);
  // Skip description - leave it empty
  
  await submitTicketForm(page);
  await expect(page.getByRole('alert', { name: 'Please fix the following' })).toBeVisible();
  await expect(page.getByText('• Description is required', { exact: true })).toBeVisible();
}

/**
 * Create a ticket with very long subject (edge case - exceeds 255 char limit)
 */
export async function createTicketLongSubject(
  page: Page,
  description: string = 'test desc',
  type: string = 'Support',
  priority: string = 'High'
): Promise<void> {
  const longSubject = 'a'.repeat(256); // Exceeds 255 character limit

  await navigateToSupport(page);
  await openCreateTicketForm(page);
  
  await fillSubject(page, longSubject);
  await fillDescription(page, description);
  
  await submitTicketForm(page);
  await expect(page.getByRole('alert', { name: 'Validation Error' })).toBeVisible();
  await expect(page.getByText('• subject must be shorter than or equal to 255 characters', { exact: true })).toBeVisible();
}