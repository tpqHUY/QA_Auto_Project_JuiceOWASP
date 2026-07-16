import type { APIResponse } from '@playwright/test';
import { BaseApi } from './base.api.js';
import { ENDPOINTS } from '../data/constants.js';
import { LoginResponseSchema } from './schemas.js';
import type { TestUser } from '../data/types.js';

export interface AuthSession {
  token: string;
  /** Basket id issued at login. */
  bid: number;
  email: string;
}

/**
 * Auth API client. Powers the "API-first setup" pattern: tests that only care
 * about, say, the basket UI can create + authenticate a user here in one fast
 * call instead of driving the registration and login forms every time.
 */
export class AuthApi extends BaseApi {
  /**
   * Register a user. Returns the raw `POST /api/Users` response so negative
   * tests can assert status codes.
   *
   * Note: `/api/Users` creates the account but does NOT persist the security
   * answer, so we mirror the real registration UI with a follow-up
   * `POST /api/SecurityAnswers`. Without it, password recovery cannot find the
   * account's question (confirmed via exploratory testing).
   */
  async register(user: TestUser): Promise<APIResponse> {
    const res = await this.httpPost(ENDPOINTS.users, {
      email: user.email,
      password: user.password,
      passwordRepeat: user.password,
      securityQuestion: { id: user.securityQuestionId },
      securityAnswer: user.securityAnswer,
    });

    if (res.ok()) {
      const userId = (await res.json())?.data?.id;
      if (userId) {
        await this.httpPost(ENDPOINTS.securityAnswers, {
          UserId: userId,
          SecurityQuestionId: user.securityQuestionId,
          answer: user.securityAnswer,
        });
      }
    }
    return res;
  }

  /** Log in. Returns the raw response so negative tests can assert 401 etc. */
  login(email: string, password: string): Promise<APIResponse> {
    return this.httpPost(ENDPOINTS.login, { email, password });
  }

  /**
   * Change the logged-in user's password. Juice Shop exposes this as a GET with
   * query params (`current`, `new`, `repeat`) — set the token first. Returns the
   * raw response so tests can assert both happy and negative paths.
   */
  changePassword(current: string, next: string, repeat: string = next): Promise<APIResponse> {
    return this.httpGet(ENDPOINTS.changePassword, { current, new: next, repeat });
  }

  /**
   * Log in an existing account (no registration) and return a validated session.
   * Used for pre-seeded accounts like the admin. Throws on failure.
   */
  async loginToSession(email: string, password: string): Promise<AuthSession> {
    const loginRes = await this.login(email, password);
    if (!loginRes.ok()) {
      throw new Error(`Login failed (${loginRes.status()}): ${await loginRes.text()}`);
    }
    const { authentication } = LoginResponseSchema.parse(await loginRes.json());
    this.setToken(authentication.token);
    return { token: authentication.token, bid: authentication.bid, email };
  }

  /**
   * Register (if needed) + log in, returning a validated session. Throws on any
   * non-happy-path so callers can treat it as "give me a logged-in user".
   */
  async createAndLogin(user: TestUser): Promise<AuthSession> {
    const registerRes = await this.register(user);
    if (!registerRes.ok()) {
      throw new Error(`Registration failed (${registerRes.status()}): ${await registerRes.text()}`);
    }
    return this.loginToSession(user.email, user.password);
  }
}
