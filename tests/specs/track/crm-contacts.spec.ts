import { test } from '@playwright/test';
import { HomePage } from '@pages/home/HomePage';
import {
  ContactListPage,
  CONTACT_PRIORITIES,
  CONTACT_STATUSES,
} from '@pages/sales-crm/ContactListPage';
import { CrmOverviewPage } from '@pages/sales-crm/CrmOverviewPage';
import { SALES_AGENT_ROLES } from '../helpers/roles';

/**
 * Track → Merchant Relationship, read-only coverage.
 *
 * Every test here navigates, filters or is refused; none of them create,
 * update or close a contact. The CRM offers no delete and no undo (a lead can
 * only be closed Lost/Archived, remarks cannot be removed, joining an agent
 * queue is one-way), so the mutating scenarios are parked as `.fixme()` at the
 * bottom of this file until a reset capability exists.
 */

/**
 * Contacts the sales agent does not own, used to assert the ownership gate.
 * These live in the shared UAT pool; if they are ever claimed or removed, the
 * Access Control tests will fail loudly rather than silently pass, which is the
 * intent. Replace with any other contact that the sales agent does not own.
 */
const UNOWNED_ASSIGNED_CONTACT = 'HANBAOBAO PTE. LTD.';
const UNASSIGNED_CONTACT = 'TestCompany';

async function goToCrm(page: import('@playwright/test').Page): Promise<CrmOverviewPage> {
  const home = new HomePage(page);
  await home.goto();
  const overview = new CrmOverviewPage(page);
  await overview.goto();
  return overview;
}

test.describe('Track - CRM Contacts', () => {
  for (const role of SALES_AGENT_ROLES) {
    test.describe(`${role.label} ${role.tag}`, () => {
      test.describe('Listing', () => {
        test('shows the my contacts list', async ({ page }) => {
          const myContacts = new ContactListPage(page, 'my');
          await myContacts.goto('List');
          await myContacts.expectTableVisible();
        });

        test('shows the assigned contacts list', async ({ page }) => {
          const assigned = new ContactListPage(page, 'assigned');
          await assigned.goto('List');
          await assigned.expectTableVisible();
        });

        test('shows the unassigned contacts list', async ({ page }) => {
          const unassigned = new ContactListPage(page, 'unassigned');
          await unassigned.goto('List');
          await unassigned.expectTableVisible();
        });

        test('shows the CRM contact overview metrics', async ({ page }) => {
          const overview = await goToCrm(page);
          await overview.expectMetricVisible('Avg. close/win time');
          await overview.expectMetricVisible('Close won contacts');
          await overview.expectMetricVisible('Overdue contacts');
          await overview.expectMetricVisible('High/Urgent pipeline');
        });

        test('shows every pipeline status column in kanban view', async ({ page }) => {
          const assigned = new ContactListPage(page, 'assigned');
          await assigned.goto('Kanban');
          for (const status of CONTACT_STATUSES) {
            await assigned.expectStatusColumnVisible(status);
          }
        });

        test('switches between list, kanban and map views', async ({ page }) => {
          const assigned = new ContactListPage(page, 'assigned');
          await assigned.goto('Kanban');
          await assigned.expectViewControlsVisible();

          await assigned.switchToListView();
          await assigned.expectTableVisible();

          await assigned.switchToMapView();
          await assigned.expectMapVisible();

          await assigned.switchToKanbanView();
          await assigned.expectStatusColumnVisible('Lead');
        });

        test('regroups a status column into its subprocesses and back', async ({ page }) => {
          const assigned = new ContactListPage(page, 'assigned');
          await assigned.goto('Kanban');
          await assigned.openSubprocessesFor('Proposing');
          await assigned.backToStatuses();
          await assigned.expectStatusColumnVisible('Proposing');
        });
      });

      // These check the filter controls themselves rather than the rows they
      // return, so they work with whatever data UAT happens to hold.

      test.describe('Filters', () => {
        test('disables the sub-category filter until a category is chosen', async ({ page }) => {
          const myContacts = new ContactListPage(page, 'my');
          await myContacts.goto('List');
          await myContacts.expectSubCategoryFilterDisabled();
        });

        test('offers every pipeline status in the status filter', async ({ page }) => {
          const myContacts = new ContactListPage(page, 'my');
          await myContacts.goto('List');
          await myContacts.openStatusFilter();
          await myContacts.expectFilterOptions(CONTACT_STATUSES);
        });

        test('offers every priority in the priority filter', async ({ page }) => {
          const myContacts = new ContactListPage(page, 'my');
          await myContacts.goto('List');
          await myContacts.openPriorityFilter();
          await myContacts.expectFilterOptions(CONTACT_PRIORITIES);
        });
      });

      test.describe('Access Control', () => {
        test('does not open a contact owned by another agent', async ({ page }) => {
          const assigned = new ContactListPage(page, 'assigned');
          await assigned.goto('List');
          await assigned.findContact(UNOWNED_ASSIGNED_CONTACT);
          await assigned.openContactExpectingAccessDenied(UNOWNED_ASSIGNED_CONTACT);
        });

        test('does not open an unassigned contact', async ({ page }) => {
          const unassigned = new ContactListPage(page, 'unassigned');
          await unassigned.goto('List');
          await unassigned.findContact(UNASSIGNED_CONTACT);
          await unassigned.openContactExpectingAccessDenied(UNASSIGNED_CONTACT);
        });

        test('disables the info action for an unassigned contact', async ({ page }) => {
          const unassigned = new ContactListPage(page, 'unassigned');
          await unassigned.goto('List');
          await unassigned.findContact(UNASSIGNED_CONTACT);
          await unassigned.expectInfoActionDisabled(UNASSIGNED_CONTACT);
        });
      });

      // Blocked on test-support capability

      // TODO(crm-cleanup): joining an agent queue has no self-service undo, so
      // this cannot run against shared UAT. Un-fixme once a queue-leave action
      // or a contact reset endpoint exists.
      test.fixme('assigns an unassigned contact by joining the agent queue', async () => {});
    });
  }
});
