import { test } from '@playwright/test';
import { CaptureLeadPage, type LeadBusinessData } from '@pages/sales-crm/CaptureLeadPage';
import { generateRandomEmail } from '../../testDataGenerators';
import { SALES_AGENT_ROLES } from '../helpers/roles';

/**
 * Track → Merchant Relationship → Capture a lead, read-only coverage.
 *
 * No test in this file submits successfully: the validation cases stop at the
 * error and the behaviour cases never click Create lead. A created lead cannot
 * be deleted (only closed Lost/Archived), so the happy path stays parked as
 * `.fixme()` until a reset capability exists.
 */

/** A UEN with no extractable public profile — the lookup completes and fills nothing. */
const UNKNOWN_UEN = '53527201D';

function validLead(overrides: Partial<LeadBusinessData> = {}): LeadBusinessData {
  return {
    name: `UAT CRM Lead ${Date.now()}`,
    category: 'Food & Beverage',
    subCategory: 'Cafe & Restaurant',
    email: generateRandomEmail(),
    addressSearch: '2 Orchard Turn',
    ...overrides,
  };
}

type CaptureLeadFixtures = {
  captureLead: CaptureLeadPage;
  leadData: LeadBusinessData;
};

const formTest = test.extend<CaptureLeadFixtures>({
  captureLead: async ({ page }, use) => {
    const captureLead = new CaptureLeadPage(page);
    await captureLead.goto();
    await use(captureLead);
  },
  leadData: async ({}, use) => {
    await use(validLead());
  },
});

test.describe('Track - CRM Capture Lead', () => {
  for (const role of SALES_AGENT_ROLES) {
    // -----------------------------------------------------------------------
    // Form behaviour
    // -----------------------------------------------------------------------

    formTest.describe(`${role.label} ${role.tag}`, () => {
      formTest('shows the lead is assigned to the agent automatically', async ({ captureLead }) => {
        await captureLead.expectAssignedToSelfNotice();
      });

      formTest('reveals a sub-category field once a category is chosen', async ({ captureLead }) => {
        await captureLead.expectSubCategoryHidden();
        await captureLead.selectCategory('Food & Beverage');
        await captureLead.expectSubCategoryVisible();
      });

      formTest('fills city and postal code from an address suggestion', async ({ captureLead }) => {
        await captureLead.pickAddress('2 Orchard Turn', '2 Orchard Turn, Singapore');
        await captureLead.expectCity('Singapore');
        await captureLead.expectPostalCodeFilled();
      });

      formTest('leaves the form untouched when the UEN lookup finds nothing', async ({ captureLead }) => {
        await captureLead.searchUenAndAutoFill(UNKNOWN_UEN);
        await captureLead.expectUen(UNKNOWN_UEN);
        await captureLead.expectNameEmpty();
      });

      formTest('adds and removes a contact person row', async ({ captureLead }) => {
        await captureLead.expectContactPersonCount(0);
        await captureLead.addContactPerson({ firstName: 'Ada', role: 'Owner' });
        await captureLead.expectContactPersonCount(1);
        await captureLead.removeContactPerson(1);
        await captureLead.expectContactPersonCount(0);
      });
    });

    // -----------------------------------------------------------------------
    // Validation
    //
    // An invalid submit surfaces twice: an inline message under the field, and
    // a toast naming every offending field.
    // -----------------------------------------------------------------------

    formTest.describe(`${role.label} validation ${role.tag}`, () => {
      formTest('rejects an empty lead name', async ({ captureLead, leadData }) => {
        await captureLead.fillBusinessDetails({ ...leadData, name: '' });
        await captureLead.submitExpectingValidationError();
        await captureLead.expectFieldError('Lead / working name', 'Enter how you refer to this lead.');
        await captureLead.expectValidationSummaryLists('Merchant name');
      });

      formTest('rejects a missing category', async ({ captureLead, leadData }) => {
        await captureLead.fillBusinessDetails({ ...leadData, category: '', subCategory: '' });
        await captureLead.submitExpectingValidationError();
        await captureLead.expectFieldError('Category', 'Category is required.');
        await captureLead.expectValidationSummaryLists('Category');
      });

      formTest('rejects a lead with neither a business email nor a phone', async ({ captureLead, leadData }) => {
        await captureLead.fillBusinessDetails({ ...leadData, email: undefined, phone: undefined });
        await captureLead.submitExpectingValidationError();
        await captureLead.expectFieldError('Business email', 'Provide a business email or phone number.');
        await captureLead.expectValidationSummaryLists('Business email');
      });

      formTest('rejects a missing address', async ({ captureLead, leadData }) => {
        await captureLead.fillBusinessDetails({ ...leadData, addressSearch: undefined });
        await captureLead.submitExpectingValidationError();
        await captureLead.expectValidationSummaryLists('Map: address');
        await captureLead.expectValidationSummaryLists('Map: postal code');
      });
    });

    // -----------------------------------------------------------------------
    // Blocked on test-support capability
    // -----------------------------------------------------------------------

    formTest.describe(`${role.label} lifecycle ${role.tag}`, () => {
      // TODO(crm-cleanup): each of these leaves a permanent UAT record — a lead
      // cannot be deleted and a remark cannot be removed. Un-fixme once a
      // contact delete/reset endpoint or a disposable sales agent exists.
      formTest.fixme('creates a lead assigned to the agent', async () => {});
      formTest.fixme('qualifies a lead with a priority and expected closing date', async () => {});
      formTest.fixme('closes a lead as Lost', async () => {});
      formTest.fixme('adds a remark to a contact', async () => {});
    });
  }
});
