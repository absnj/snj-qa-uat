import { Page, expect } from '@playwright/test';
import {
  fillSubject, 
  fillDescription, 
  submitTicketForm, 
  openCreateTicketForm, 
  navigateToSupport } from './utils';

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