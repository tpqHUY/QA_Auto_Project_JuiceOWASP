import { test, expect } from '../../src/fixtures/index.js';
import { KNOWN_PRODUCTS } from '../../src/data/constants.js';

/**
 * Product reviews — a common e-commerce flow. Reads are public; adding requires
 * auth. We add a uniquely-tagged review, then read it back to prove it persisted
 * (action → verify state), keeping the test parallel-safe via the unique message.
 */
test.describe('Product reviews @regression', () => {
  const productId = KNOWN_PRODUCTS.appleJuice.id;

  test(
    'anyone can read the reviews for a product',
    { tag: ['@api', '@regression'] },
    async ({ reviewApi }) => {
      const res = await reviewApi.getForProduct(productId);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('success');
      expect(Array.isArray(body.data)).toBe(true);
    }
  );

  test(
    'an authenticated user can add a review and read it back',
    { tag: ['@api', '@regression'] },
    async ({ reviewApi, session }) => {
      reviewApi.setToken(session.token);
      const message = `E2E review ${Date.now()}-${Math.round(performance.now())}`;

      const addRes = await reviewApi.add(productId, { message, author: session.email });
      expect(addRes.status()).toBe(201);

      const after = await (await reviewApi.getForProduct(productId)).json();
      expect(after.data.some((r: { message: string }) => r.message === message)).toBe(true);
    }
  );
});
