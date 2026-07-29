import { ApiError } from '@core/index';
import type { LoyaltySetupPayload } from '@api/LoyaltyApi';
import { apiTest, expect, tokenFor } from '../helpers/apiFixtures';
import { generateLoyaltyProgramTitle } from '../../testDataGenerators';
import { LOYALTY_CREATOR_ROLES, LOYALTY_READ_ONLY_ROLES } from '../helpers/roles';
import { getApiTestMerchantStoreId, getApiTestBranchId } from '../../config/environments';

function futureDate(daysFromNow: number): string {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function validLoyaltySetup(overrides: Partial<LoyaltySetupPayload> = {}): LoyaltySetupPayload {
  return {
    merchant_store_id: getApiTestMerchantStoreId(),
    for_all_branches: false,
    branch_ids: [getApiTestBranchId()],
    title: generateLoyaltyProgramTitle(),
    description: 'API integration test loyalty program',
    full_description: 'Created by an automated API integration test.',
    start_date: futureDate(0),
    end_date: futureDate(365),
    type: 'visit',
    visits_per_stamp: 1,
    display_type: 'card',
    redemption_visit: [5, 10],
    status: 'active',
    terms: 'Valid automated loyalty terms and conditions.',
    keywords: ['uat', 'api', 'loyalty'],
    ...overrides,
  };
}

apiTest.describe('API - Loyalty Programs', () => {
  for (const role of LOYALTY_CREATOR_ROLES) {
    apiTest.describe(`${role.label} ${role.tag}`, () => {
      apiTest('creates, reads, updates, and deletes a loyalty program', async ({ authApi, loyaltyApi }) => {
        const token = await tokenFor(authApi, role);
        const payload = validLoyaltySetup();

        const created = await loyaltyApi.createLoyaltySetup(token, payload);
        expect(created.loyalty_setup_id).toBeTruthy();
        expect(created.title).toBe(payload.title);

        try {
          const fetched = await loyaltyApi.getLoyaltySetup(token, created.loyalty_setup_id);
          expect(fetched.title).toBe(payload.title);

          const updated = await loyaltyApi.updateLoyaltySetup(token, created.loyalty_setup_id, {
            description: 'Updated description',
          });
          expect(updated.description).toBe('Updated description');
        } finally {
          await loyaltyApi.deleteLoyaltySetup(token, created.loyalty_setup_id);
        }

        await expect(loyaltyApi.getLoyaltySetup(token, created.loyalty_setup_id)).rejects.toThrow(ApiError);
      });

      apiTest('rejects a program with a missing title', async ({ authApi, loyaltyApi }) => {
        const token = await tokenFor(authApi, role);
        const payload = validLoyaltySetup({ title: '' });

        try {
          await loyaltyApi.createLoyaltySetup(token, payload);
          throw new Error('expected createLoyaltySetup to reject a missing title');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).httpStatus).toBeGreaterThanOrEqual(400);
          expect((error as ApiError).httpStatus).toBeLessThan(500);
        }
      });
    });
  }

  for (const role of LOYALTY_READ_ONLY_ROLES) {
    apiTest.describe(`${role.label} ${role.tag}`, () => {
      apiTest('cannot create a loyalty program', async ({ authApi, loyaltyApi }) => {
        const token = await tokenFor(authApi, role);
        const payload = validLoyaltySetup();

        try {
          await loyaltyApi.createLoyaltySetup(token, payload);
          throw new Error('expected createLoyaltySetup to be forbidden for a read-only role');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).httpStatus).toBe(403);
        }
      });
    });
  }
});
