// core/ApiClient.ts
import type { APIRequestContext } from '@playwright/test';

// Confirmed live in schema.json's User/Account response examples: every
// endpoint on this backend wraps its payload as { status, message, data }.
type ApiEnvelope<T> = {
  status: number | string;
  message: string;
  data: T;
};

export class ApiError extends Error {
  constructor(
    readonly httpStatus: number,
    readonly body: unknown,
  ) {
    super(`API request failed with status ${httpStatus}: ${JSON.stringify(body)}`);
  }
}

export abstract class ApiClient {
  /**
   * API version segment, prepended to every path by `resolve`.
   *
   * This cannot live in `UAT_API_URL`: Playwright resolves request paths
   * against `baseURL` with `new URL()` semantics, so a leading-slash path is
   * absolute against the *origin* and silently discards any path segment on
   * the base — `new URL('/auth/sign-in', 'https://host/v2')` is
   * `https://host/auth/sign-in`, which 404s. Keeping the version in the path
   * also lets a subclass override it, which the backend needs: most endpoints
   * are v2, but a few are still v1.
   */
  protected readonly apiVersion: string = 'v2';

  constructor(protected readonly request: APIRequestContext) {}

  private resolve(path: string): string {
    return `/${this.apiVersion}${path}`;
  }

  private authHeaders(token?: string): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async unwrap<T>(response: {
    ok(): boolean;
    status(): number;
    json(): Promise<unknown>;
  }): Promise<T> {
    const body = await response.json().catch(() => undefined);
    if (!response.ok()) {
      throw new ApiError(response.status(), body);
    }
    return (body as ApiEnvelope<T>).data;
  }

  protected async get<T>(path: string, token?: string, params?: Record<string, string>): Promise<T> {
    const response = await this.request.get(this.resolve(path), {
      headers: this.authHeaders(token),
      params,
    });
    return this.unwrap<T>(response);
  }

  protected async post<T>(path: string, data: unknown, token?: string): Promise<T> {
    const response = await this.request.post(this.resolve(path), {
      headers: this.authHeaders(token),
      data,
    });
    return this.unwrap<T>(response);
  }

  protected async postForm<T>(path: string, form: Record<string, string>, token?: string): Promise<T> {
    const response = await this.request.post(this.resolve(path), {
      headers: this.authHeaders(token),
      form,
    });
    return this.unwrap<T>(response);
  }

  protected async patch<T>(path: string, data: unknown, token?: string): Promise<T> {
    const response = await this.request.patch(this.resolve(path), {
      headers: this.authHeaders(token),
      data,
    });
    return this.unwrap<T>(response);
  }

  protected async delete<T>(path: string, token?: string): Promise<T> {
    const response = await this.request.delete(this.resolve(path), {
      headers: this.authHeaders(token),
    });
    return this.unwrap<T>(response);
  }
}
