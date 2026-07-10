import { test, expect } from '../../src/fixtures/index.js';
import { ProductListResponseSchema } from '../../src/api/schemas.js';
import { KNOWN_PRODUCTS } from '../../src/data/constants.js';

/** Products API contract + search behaviour. */
test.describe('Products API', () => {
  test(
    'GET /api/Products returns the catalog with a valid schema',
    { tag: ['@api', '@smoke', '@regression'] },
    async ({ productApi }) => {
      const res = await productApi.listRaw();
      expect(res.status()).toBe(200);

      const body = ProductListResponseSchema.parse(await res.json());
      expect(body.data.length).toBeGreaterThan(10);
    }
  );

  test(
    'every product has a name and a non-negative price',
    { tag: ['@api', '@regression'] },
    async ({ productApi }) => {
      const products = await productApi.list();
      for (const p of products) {
        expect(p.name.length).toBeGreaterThan(0);
        expect(p.price).toBeGreaterThanOrEqual(0);
      }
    }
  );

  test(
    'GET /rest/products/search finds a known product by keyword',
    { tag: ['@api', '@smoke', '@regression'] },
    async ({ productApi }) => {
      const results = await productApi.search('apple');
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((p) => p.name);
      expect(names).toContain(KNOWN_PRODUCTS.appleJuice.name);
    }
  );

  test(
    'search with a nonsense term returns an empty result set',
    { tag: ['@api', '@regression'] },
    async ({ productApi }) => {
      const results = await productApi.search('zzzznotarealproductxyz');
      expect(results).toHaveLength(0);
    }
  );

  test(
    'the seeded Apple Juice product is retrievable with expected attributes',
    { tag: ['@api', '@regression'] },
    async ({ productApi }) => {
      const apple = await productApi.getById(KNOWN_PRODUCTS.appleJuice.id);
      expect(apple).toBeDefined();
      expect(apple?.name).toBe(KNOWN_PRODUCTS.appleJuice.name);
      expect(apple?.price).toBeCloseTo(KNOWN_PRODUCTS.appleJuice.price, 2);
    }
  );
});
