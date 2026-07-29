import { decodeJwtPayload } from '@api/AuthApi';
import { ApiError } from '@core/index';
import { apiTest, expect } from '../helpers/apiFixtures';
import { ALL_ROLES, ALL_CRM_ROLES, getCredentials } from '../helpers/roles';

const AUTHENTICATABLE_ROLES = [...ALL_ROLES, ...ALL_CRM_ROLES];

apiTest.describe('API - Auth', () => {
  for (const role of AUTHENTICATABLE_ROLES) {
    apiTest.describe(`${role.label} ${role.tag}`, () => {
      apiTest('valid credentials return a token for the expected role', async ({ authApi }) => {
        const { username, password } = getCredentials(role.normalized);
        const { token } = await authApi.signIn(username, password);

        expect(token).toBeTruthy();

        // role.tag is e.g. "@merchant-admin"; the JWT's role claim names match
        // that same kebab-case form (confirmed against the sample decoded
        // token in schema.json's collection-level auth config).
        const expectedRoleName = role.tag.slice(1);
        const payload = decodeJwtPayload(token);
        const roleNames = payload.roles.map((r) => r.role.name);
        expect(roleNames).toContain(expectedRoleName);
      });

      apiTest('invalid credentials are rejected', async ({ authApi }) => {
        const { username, password } = getCredentials(role.normalized);

        await expect(authApi.signIn(username, `${password}invalid`)).rejects.toThrow(ApiError);

        try {
          await authApi.signIn(username, `${password}invalid`);
          throw new Error('expected signIn to reject');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).httpStatus).toBeGreaterThanOrEqual(400);
          expect((error as ApiError).httpStatus).toBeLessThan(500);
        }
      });
    });
  }

  apiTest.describe('Session lifecycle', () => {
    // TODO(unconfirmed-shape): schema.json has no captured example for
    // /auth/refresh-token — neither the request body key (guessed here as
    // refresh_token) nor whether sign-in even returns a separate refresh
    // token are confirmed. Un-fixme once a live sign-in response is checked.
    apiTest.fixme(
      'a refreshed token is usable for a subsequent authenticated call',
      async ({ authApi }) => {
        const { username, password } = getCredentials('MERCHANT_ADMIN');
        const { refreshToken } = await authApi.signIn(username, password);
        expect(refreshToken).toBeTruthy();

        const { token: refreshedToken } = await authApi.refresh(refreshToken!);
        expect(refreshedToken).toBeTruthy();

        // A refreshed token should still be usable — logout is the cheapest
        // authenticated call available on AuthApi to prove that.
        await authApi.logout(refreshedToken);
      },
    );

    apiTest('logout invalidates the token for subsequent authenticated calls', async ({ authApi }) => {
      const { username, password } = getCredentials('MERCHANT_ADMIN');
      const { token } = await authApi.signIn(username, password);

      await authApi.logout(token);

      // Re-using a logged-out token to sign out again should now fail —
      // proves the first logout actually invalidated it, without depending
      // on any other authenticated endpoint's shape.
      await expect(authApi.logout(token)).rejects.toThrow(ApiError);
    });
  });
});
