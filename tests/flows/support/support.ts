import { Page } from '@playwright/test';
import {
  navigateToSupport,
  openCreateTicketForm,
  fillSubject,
  fillDescription,
  submitTicketForm,
  expectTicketCreatedSuccess,
  expectSubjectRequiredError,
  expectDescriptionRequiredError,
  expectLongSubjectError,
} from '../../pages/SupportPage';

const LONG_SUBJECT = 'a'.repeat(256); // Exceeds 255 character limit

export async function createTicketSuccess(page: Page): Promise<void> {
  await navigateToSupport(page);
  await openCreateTicketForm(page);
  await fillSubject(page, 'test');
  await fillDescription(page, 'test desc');
  await submitTicketForm(page);
  await expectTicketCreatedSuccess(page);
}

export async function createTicketEmptySubject(page: Page): Promise<void> {
  await navigateToSupport(page);
  await openCreateTicketForm(page);
  await fillDescription(page, 'test desc');
  await submitTicketForm(page);
  await expectSubjectRequiredError(page);
}

export async function createTicketEmptyDescription(page: Page): Promise<void> {
  await navigateToSupport(page);
  await openCreateTicketForm(page);
  await fillSubject(page, 'test');
  await submitTicketForm(page);
  await expectDescriptionRequiredError(page);
}

export async function createTicketLongSubject(page: Page): Promise<void> {
  await navigateToSupport(page);
  await openCreateTicketForm(page);
  await fillSubject(page, LONG_SUBJECT);
  await fillDescription(page, 'test desc');
  await submitTicketForm(page);
  await expectLongSubjectError(page);
}