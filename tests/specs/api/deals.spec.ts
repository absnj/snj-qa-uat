import { ApiError } from '@core/index';
import type { DealPayload } from '@api/DealsApi';
import { apiTest, expect, tokenFor } from '../helpers/apiFixtures';
import { generateDealTitle } from '../../testDataGenerators';
import { DEAL_CREATOR_ROLES, DEAL_READ_ONLY_ROLES } from '../helpers/roles';
import { getApiTestMerchantStoreId, getApiTestBranchId } from '../../config/environments';

function futureDate(daysFromNow: number): string {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function validDeal(overrides: Partial<DealPayload> = {}): DealPayload {
  return {
    merchant_store_id: getApiTestMerchantStoreId(),
    for_all_branches: false,
    branch_ids: [getApiTestBranchId()],
    title: generateDealTitle(),
    description: 'API integration test deal',
    full_description: 'Created by an automated API integration test.',
    deal_value: '10',
    minimum_spend: '10',
    value_attribute: 'percentage',
    currency_code: 'SGD',
    current_quantity: '10',
    unlimited_quantity: false,
    status: 'in-approval',
    terms: 'Valid automated terms and conditions.',
    keywords: ['uat', 'api', 'deal'],
    no_expiry: false,
    start_date: futureDate(7),
    start_time: '09:00',
    end_date: futureDate(30),
    end_time: '23:59',
    ...overrides,
  };
}

// SKIP(api-rate-limit): every test here signs in first, and UAT throttles
// POST /v2/auth/sign-in with a 429 once the suite runs at volume. See the note
// at the top of auth.spec.ts for the diagnosis and the unblock.
apiTest.describe.skip('API - Deals', () => {
  for (const role of DEAL_CREATOR_ROLES) {
    apiTest.describe(`${role.label} ${role.tag}`, () => {
      apiTest('creates, reads, updates, and deletes a deal', async ({ authApi, dealsApi }) => {
        const token = await tokenFor(authApi, role);
        const payload = validDeal();

        const created = await dealsApi.createDeal(token, payload);
        expect(created.deals_id).toBeTruthy();
        expect(created.title).toBe(payload.title);

        try {
          const fetched = await dealsApi.getDeal(token, created.deals_id);
          expect(fetched.title).toBe(payload.title);

          const updated = await dealsApi.updateDeal(token, created.deals_id, { description: 'Updated description' });
          expect(updated.description).toBe('Updated description');
        } finally {
          await dealsApi.deleteDeal(token, created.deals_id);
        }

        await expect(dealsApi.getDeal(token, created.deals_id)).rejects.toThrow(ApiError);
      });

      apiTest('rejects a deal with a missing title', async ({ authApi, dealsApi }) => {
        const token = await tokenFor(authApi, role);
        const payload = validDeal({ title: '' });

        try {
          await dealsApi.createDeal(token, payload);
          throw new Error('expected createDeal to reject a missing title');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).httpStatus).toBeGreaterThanOrEqual(400);
          expect((error as ApiError).httpStatus).toBeLessThan(500);
        }
      });
    });
  }

  for (const role of DEAL_READ_ONLY_ROLES) {
    apiTest.describe(`${role.label} ${role.tag}`, () => {
      apiTest('cannot create a deal', async ({ authApi, dealsApi }) => {
        const token = await tokenFor(authApi, role);
        const payload = validDeal();

        try {
          await dealsApi.createDeal(token, payload);
          throw new Error('expected createDeal to be forbidden for a read-only role');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).httpStatus).toBe(403);
        }
      });
    });
  }
});
