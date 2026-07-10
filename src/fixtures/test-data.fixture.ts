import { test as base } from '@playwright/test';
import { makeUser } from '../data/factories/user.factory.js';
import { makeAddress } from '../data/factories/address.factory.js';
import { makeCard } from '../data/factories/card.factory.js';
import { DISMISS_COOKIES } from '../data/constants.js';
import { env } from '../utils/env.js';
import type { TestUser, Address, PaymentCard } from '../data/types.js';

/**
 * Layer 1 of the fixture chain: fresh test data + a pre-cleaned page.
 *
 * - Every test gets a brand-new `user`/`address`/`card` from the factories, so
 *   nothing is shared between tests and the suite is safe to run fully parallel.
 * - The `page` fixture is overridden to pre-set the banner/cookie-consent
 *   dismiss cookies, so no test wastes time (or flakes) clicking overlays away.
 */
export type DataFixtures = {
  user: TestUser;
  address: Address;
  card: PaymentCard;
};

export const test = base.extend<DataFixtures>({
  page: async ({ page, context }, use) => {
    await context.addCookies(
      DISMISS_COOKIES.map((c) => ({ name: c.name, value: c.value, url: env.baseURL }))
    );
    await use(page);
  },

  user: async ({}, use) => {
    await use(makeUser());
  },

  address: async ({}, use) => {
    await use(makeAddress());
  },

  card: async ({}, use) => {
    await use(makeCard());
  },
});

export { expect } from '@playwright/test';
