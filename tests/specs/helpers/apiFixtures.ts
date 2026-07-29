// specs/helpers/apiFixtures.ts
import { test as base } from '@playwright/test';
import { AuthApi } from '@api/AuthApi';
import { DealsApi } from '@api/DealsApi';
import { LoyaltyApi } from '@api/LoyaltyApi';
import { getCredentials, type Role } from './roles';

type ApiFixtures = {
  authApi: AuthApi;
  dealsApi: DealsApi;
  loyaltyApi: LoyaltyApi;
};

export const apiTest = base.extend<ApiFixtures>({
  authApi: async ({ request }, use) => {
    await use(new AuthApi(request));
  },

  dealsApi: async ({ request }, use) => {
    await use(new DealsApi(request));
  },

  loyaltyApi: async ({ request }, use) => {
    await use(new LoyaltyApi(request));
  },
});

/** Signs in as the given role via the credentials already used by the UI suite. */
export async function tokenFor(authApi: AuthApi, role: Role): Promise<string> {
  const { username, password } = getCredentials(role.normalized);
  const { token } = await authApi.signIn(username, password);
  return token;
}

export { expect } from '@playwright/test';
