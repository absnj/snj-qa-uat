// tests/specs/support/createTicket.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home/HomePage';
import { CreateTicketPage } from '../../pages/support/CreateTicketPage';
import { ALL_ROLES } from '../helpers/roles';

test.describe('Support', () => {
  for (const role of ALL_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {

      test.beforeEach(async ({ page }) => {
        const home = new HomePage(page);
        await home.goto();
      });

      test('creates ticket successfully', async ({ page }) => {
        const home         = new HomePage(page);
        const support      = await home.goToSupport();
        const myTickets    = await support.goToMyTickets();
        const createTicket = await myTickets.openCreateTicket();

        await createTicket.fillSubject('test');
        await createTicket.fillDescription('test desc');
        await createTicket.submit();

        await expect(createTicket.successAlert).toBeVisible();
      });

      test('rejects an empty ticket subject', async ({ page }) => {
        const home         = new HomePage(page);
        const support      = await home.goToSupport();
        const myTickets    = await support.goToMyTickets();
        const createTicket = await myTickets.openCreateTicket();

        await createTicket.fillDescription('test desc');
        await createTicket.submit();

        await expect(createTicket.validationAlert).toBeVisible();
        await expect(createTicket.subjectRequiredAlert).toBeVisible();
      });

      test('rejects an empty ticket description', async ({ page }) => {
        const home         = new HomePage(page);
        const support      = await home.goToSupport();
        const myTickets    = await support.goToMyTickets();
        const createTicket = await myTickets.openCreateTicket();

        await createTicket.fillSubject('test');
        await createTicket.submit();

        await expect(createTicket.validationAlert).toBeVisible();
        await expect(createTicket.descriptionRequiredAlert).toBeVisible();
      });

      test('rejects an overlong ticket subject', async ({ page }) => {
        const home         = new HomePage(page);
        const support      = await home.goToSupport();
        const myTickets    = await support.goToMyTickets();
        const createTicket = await myTickets.openCreateTicket();

        await createTicket.fillSubject(CreateTicketPage.longSubject);
        await createTicket.fillDescription('test desc');
        await createTicket.submit();

        await expect(createTicket.longSubjectAlert).toBeVisible();
        await expect(createTicket.longSubjectMessage).toBeVisible();
      });

    });
  }
});