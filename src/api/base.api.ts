import type { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Thin base for the API client layer. Wraps a Playwright `APIRequestContext`
 * (so it shares the same network stack, proxy and tracing as the browser) and
 * centralises bearer-token handling.
 *
 * The concrete clients (auth/product/basket) extend this so specs read like
 * `await authApi.login(user)` instead of hand-rolling headers everywhere.
 */
export class BaseApi {
  constructor(
    protected readonly request: APIRequestContext,
    protected token?: string
  ) {}

  /** Set/clear the bearer token used for subsequent requests. */
  setToken(token?: string): this {
    this.token = token;
    return this;
  }

  protected headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...extra,
    };
  }

  protected httpGet(url: string, params?: Record<string, string | number>): Promise<APIResponse> {
    return this.request.get(url, { headers: this.headers(), params });
  }

  protected httpPost(url: string, data: unknown): Promise<APIResponse> {
    return this.request.post(url, { headers: this.headers(), data });
  }

  protected httpPut(url: string, data: unknown): Promise<APIResponse> {
    return this.request.put(url, { headers: this.headers(), data });
  }

  protected httpDelete(url: string): Promise<APIResponse> {
    return this.request.delete(url, { headers: this.headers() });
  }
}
