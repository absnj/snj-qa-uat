import { test } from '@playwright/test';
import {
  createTicketEmptyDescription,
  createTicketEmptySubject,
  createTicketLongSubject,
  createTicketSuccess,
} from '../flows';
import { ALL_ROLES, gotoUat } from './helpers/roles';

test.describe('Support', () => {
  for (const role of ALL_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test.beforeEach(async ({ page }) => {
        await gotoUat(page);
      });

      test('creates ticket successfully', async ({ page }) => {
        await createTicketSuccess(page);
      });

      test('rejects an empty ticket subject', async ({ page }) => {
        await createTicketEmptySubject(page);
      });

      test('rejects an empty ticket description', async ({ page }) => {
        await createTicketEmptyDescription(page);
      });

      test('rejects an overlong ticket subject', async ({ page }) => {
        await createTicketLongSubject(page);
      });
    });
  }
});
