import { test, expect } from '../../../src/fixtures/index.js';
import { HomePage } from '../../../src/pages/home.page.js';
import { KNOWN_PRODUCTS } from '../../../src/data/constants.js';

test.describe('Search (UI)', () => {
  test(
    'searching for a known keyword shows matching products',
    { tag: ['@smoke', '@regression'] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await home.search('apple');

      await expect(home.card(KNOWN_PRODUCTS.appleJuice.name)).toBeVisible();
      expect(await home.productCount()).toBeGreaterThan(0);
    }
  );

  test(
    'searching for a nonsense term shows no products',
    { tag: ['@regression'] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await home.search('zzzznotarealproductxyz');

      await expect(home.productCards).toHaveCount(0);
    }
  );

  test(
    'a search result can be opened to its detail dialog',
    { tag: ['@regression'] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await home.search('apple');

      const details = await home.openDetails(KNOWN_PRODUCTS.appleJuice.name);
      expect(await details.titleText()).toBe(KNOWN_PRODUCTS.appleJuice.name);
      await details.close();
    }
  );
});
