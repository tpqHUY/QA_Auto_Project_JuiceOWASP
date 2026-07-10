import { test, expect } from '../../src/fixtures/index.js';
import { BasketItemResponseSchema } from '../../src/api/schemas.js';
import { KNOWN_PRODUCTS } from '../../src/data/constants.js';

/**
 * Basket API tests. Cover the happy path (add + read back), schema validation,
 * and the authorization negatives an authenticated resource must enforce.
 */
test.describe('Basket API', () => {
  test(
    'adding an item with a valid token returns 200 and a valid schema',
    { tag: ['@api', '@smoke', '@regression'] },
    async ({ basketApi, session }) => {
      basketApi.setToken(session.token);

      const res = await basketApi.addItemRaw(session.bid, KNOWN_PRODUCTS.appleJuice.id, 2);

      expect(res.status()).toBe(200);
      const body = BasketItemResponseSchema.parse(await res.json());
      expect(body.data.ProductId).toBe(KNOWN_PRODUCTS.appleJuice.id);
      expect(body.data.quantity).toBe(2);
    }
  );

  test(
    'a read of the basket reflects the item and quantity just added',
    { tag: ['@api', '@regression'] },
    async ({ basketApi, session }) => {
      basketApi.setToken(session.token);
      await basketApi.addItemRaw(session.bid, KNOWN_PRODUCTS.orangeJuice.id, 3);

      const quantity = await basketApi.quantityOf(session.bid, KNOWN_PRODUCTS.orangeJuice.id);
      expect(quantity).toBe(3);

      const lines = await basketApi.lineCount(session.bid);
      expect(lines).toBe(1);
    }
  );

  test(
    'removing a basket item drops it from the basket',
    { tag: ['@api', '@regression'] },
    async ({ basketApi, session }) => {
      basketApi.setToken(session.token);
      const addRes = await basketApi.addItemRaw(session.bid, KNOWN_PRODUCTS.appleJuice.id, 1);
      const { data } = BasketItemResponseSchema.parse(await addRes.json());

      const removeRes = await basketApi.removeItemRaw(data.id);
      expect(removeRes.ok()).toBe(true);

      expect(await basketApi.lineCount(session.bid)).toBe(0);
    }
  );

  test(
    'reading a basket without a token is rejected with 401',
    { tag: ['@api', '@regression'] },
    async ({ basketApi, session }) => {
      // basketApi has no token set here → the request goes out unauthenticated.
      const res = await basketApi.getRaw(session.bid);
      expect(res.status()).toBe(401);
    }
  );

  test(
    'adding a basket item without a token is rejected with 401',
    { tag: ['@api', '@regression'] },
    async ({ basketApi, session }) => {
      const res = await basketApi.addItemRaw(session.bid, KNOWN_PRODUCTS.appleJuice.id, 1);
      expect(res.status()).toBe(401);
    }
  );
});
