import { test, expect } from '../../../src/fixtures/index.js';
import { HomePage } from '../../../src/pages/home.page.js';
import { parsePrice } from '../../../src/utils/currency.js';

test.describe('Catalog (UI)', () => {
  test(
    'the product catalog renders on load',
    { tag: ['@smoke', '@regression'] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      expect(await home.productCount()).toBeGreaterThan(0);
    }
  );

  test(
    'each product card shows a name and a valid price',
    { tag: ['@regression'] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      const sample = Math.min(await home.productCount(), 3);
      for (let i = 0; i < sample; i++) {
        const card = home.productCards.nth(i);
        await expect(card.locator('.item-name')).not.toBeEmpty();
        const price = parsePrice(await card.locator('.item-price').innerText());
        expect(price).toBeGreaterThanOrEqual(0);
      }
    }
  );

  test(
    'pagination loads a different set of products',
    { tag: ['@regression'] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await expect(home.paginator).toBeVisible();

      const firstBefore = await home.firstProductName();
      await home.nextPageButton.click();
      await expect(home.productNames.first()).not.toHaveText(firstBefore);
    }
  );

  test('opening a product shows its detail dialog', { tag: ['@regression'] }, async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    const name = await home.firstProductName();
    const details = await home.openDetails(name);

    expect(await details.isOpen()).toBe(true);
    expect(await details.titleText()).toBe(name);
    await details.close();
  });
});
