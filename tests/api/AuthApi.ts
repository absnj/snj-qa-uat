// api/AuthApi.ts
import { ApiClient } from '@core/index';

export type AuthTokens = {
  token: string;
  refreshToken?: string;
};

export type DecodedTokenPayload = {
  id: string;
  roles: Array<{ roleId: string; role: { id: string; name: string } }>;
  [key: string]: unknown;
};

/**
 * NOTE: no Auth endpoint has a captured example response anywhere in
 * schema.json, unlike User/Account (which confirm the { status, message,
 * data } envelope this client relies on via ApiClient.unwrap). The exact key
 * holding the JWT inside sign-in's `data` (`token` vs `access_token`, etc.)
 * needs confirming with one live call before these assertions are trusted.
 */
export class AuthApi extends ApiClient {
  async signIn(email: string, password: string): Promise<AuthTokens> {
    return this.postForm<AuthTokens>('/auth/sign-in', { email, password });
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    return this.post<AuthTokens>('/auth/refresh-token', { refresh_token: refreshToken });
  }

  async logout(token: string): Promise<void> {
    await this.delete<void>('/auth/logout', token);
  }
}

/**
 * Decodes a JWT's payload segment without verifying its signature — sufficient
 * for asserting the `roles` claim in a test, since the token itself was just
 * issued by the API under test.
 */
export function decodeJwtPayload(token: string): DecodedTokenPayload {
  const [, payload] = token.split('.');
  const json = Buffer.from(payload, 'base64url').toString('utf8');
  return JSON.parse(json);
}
