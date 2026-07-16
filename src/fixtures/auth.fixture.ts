import { test as dataTest } from './test-data.fixture.js';
import { AuthApi, type AuthSession } from '../api/auth.api.js';
import { ProductApi } from '../api/product.api.js';
import { BasketApi } from '../api/basket.api.js';
import { AddressApi } from '../api/address.api.js';
import { CardApi } from '../api/card.api.js';
import { OrderApi } from '../api/order.api.js';
import { ReviewApi } from '../api/review.api.js';
import { ADMIN, DISMISS_COOKIES, STORAGE } from '../data/constants.js';
import { env } from '../utils/env.js';
import type { Page } from '@playwright/test';

/**
 * Layer 2 of the fixture chain: API clients + authentication.
 *
 * `session` implements the "API-first setup" pattern — it registers and logs in
 * a user over HTTP (no UI), which is an order of magnitude faster and far less
 * flaky than driving the login form. `loggedInPage` then reuses that session by
 * injecting the token + basket id straight into browser storage (the
 * `storageState` technique) so UI tests start already authenticated.
 *
 * Why per-test auth instead of one shared storageState file: each test owns its
 * user, so basket/checkout tests never step on each other and everything stays
 * parallel-safe. See docs/test-strategy.md.
 */
export type AuthFixtures = {
  authApi: AuthApi;
  productApi: ProductApi;
  basketApi: BasketApi;
  addressApi: AddressApi;
  cardApi: CardApi;
  orderApi: OrderApi;
  reviewApi: ReviewApi;
  session: AuthSession;
  /** A session authenticated as the seeded administrator (role-based test data). */
  adminSession: AuthSession;
  loggedInPage: Page;
};

export const test = dataTest.extend<AuthFixtures>({
  authApi: async ({ request }, use) => {
    await use(new AuthApi(request));
  },

  productApi: async ({ request }, use) => {
    await use(new ProductApi(request));
  },

  basketApi: async ({ request }, use) => {
    await use(new BasketApi(request));
  },

  addressApi: async ({ request }, use) => {
    await use(new AddressApi(request));
  },

  cardApi: async ({ request }, use) => {
    await use(new CardApi(request));
  },

  orderApi: async ({ request }, use) => {
    await use(new OrderApi(request));
  },

  reviewApi: async ({ request }, use) => {
    await use(new ReviewApi(request));
  },

  // Register + log in a fresh user over the API. Fast, deterministic setup.
  session: async ({ authApi, user }, use) => {
    const session = await authApi.createAndLogin(user);
    await use(session);
  },

  // Log in as the seeded administrator. Uses its own AuthApi instance so it never
  // clashes with the per-test `session` user's token. Unlocks admin-only flows and
  // role-based authorization tests.
  adminSession: async ({ request }, use) => {
    const adminApi = new AuthApi(request);
    const session = await adminApi.loginToSession(ADMIN.email, ADMIN.password);
    await use(session);
  },

  // A browser page that starts already authenticated, without touching the UI.
  loggedInPage: async ({ browser, session }, use) => {
    const context = await browser.newContext();
    await context.addCookies([
      ...DISMISS_COOKIES.map((c) => ({ name: c.name, value: c.value, url: env.baseURL })),
      { name: STORAGE.tokenKey, value: session.token, url: env.baseURL },
    ]);
    await context.addInitScript(
      ([token, bid, tokenKey, bidKey]) => {
        window.localStorage.setItem(tokenKey, token);
        window.sessionStorage.setItem(bidKey, bid);
      },
      [session.token, String(session.bid), STORAGE.tokenKey, STORAGE.basketIdKey]
    );
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
