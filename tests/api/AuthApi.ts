// api/AuthApi.ts
import { ApiClient } from '@core/index';

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

export type DecodedTokenPayload = {
  id: string;
  roles: Array<{ roleId: string; role: { id: string; name: string } }>;
  [key: string]: unknown;
};

/**
 * schema.json captures no example response for any Auth endpoint, so the
 * shape below was confirmed against live UAT on 2026-08-06: sign-in and
 * refresh-token both return the standard { status, message, data } envelope
 * with `data` = { access_token, refresh_token, user }.
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
