import { test, expect } from '../../../src/fixtures/index.js';
import { HomePage } from '../../../src/pages/home.page.js';
import { BasketPage } from '../../../src/pages/basket.page.js';
import { KNOWN_PRODUCTS } from '../../../src/data/constants.js';
import { calcTotal } from '../../../src/utils/currency.js';

const { appleJuice: APPLE, orangeJuice: ORANGE } = KNOWN_PRODUCTS;

/**
 * Basket behaviour, exercised through the UI and cross-checked against the API.
 * This is the "UI action → API verify state" pattern: we drive the browser, then
 * read the backend to prove the two agree — catching bugs a UI-only assertion
 * (or an API-only assertion) would miss.
 *
 * `loggedInPage` starts authenticated via API (no login form), so every test
 * gets its own user + empty basket and the file runs fully in parallel.
 */
test.describe('Basket (UI + API verify)', () => {
  test(
    'adding a product from the catalog puts it in the basket',
    { tag: ['@smoke', '@regression'] },
    async ({ loggedInPage, session, basketApi }) => {
      basketApi.setToken(session.token);
      const home = new HomePage(loggedInPage);
      await home.goto();

      const name = await home.addFirstProductToBasket();

      // API-verify the backend basket now holds that product.
      await expect
        .poll(async () => (await basketApi.get(session.bid)).Products.map((p) => p.name))
        .toContain(name);

      // ...and it shows up in the basket UI too.
      const basket = new BasketPage(loggedInPage);
      await basket.goto();
      await expect(basket.row(name)).toBeVisible();
    }
  );

  test(
    'the basket total equals the sum of line prices',
    { tag: ['@smoke', '@regression'] },
    async ({ loggedInPage, session, basketApi }) => {
      basketApi.setToken(session.token);
      await basketApi.addItemRaw(session.bid, APPLE.id, 2);
      await basketApi.addItemRaw(session.bid, ORANGE.id, 1);

      const basket = new BasketPage(loggedInPage);
      await basket.goto();
      await expect(basket.rows).toHaveCount(2);

      const lines = [
        {
          price: await basket.unitPriceOf(APPLE.name),
          quantity: await basket.quantityOf(APPLE.name),
        },
        {
          price: await basket.unitPriceOf(ORANGE.name),
          quantity: await basket.quantityOf(ORANGE.name),
        },
      ];
      expect(await basket.totalPrice()).toBeCloseTo(calcTotal(lines), 2);
    }
  );

  test(
    'increasing quantity updates the line and the total',
    { tag: ['@regression'] },
    async ({ loggedInPage, session, basketApi }) => {
      basketApi.setToken(session.token);
      await basketApi.addItemRaw(session.bid, APPLE.id, 1);

      const basket = new BasketPage(loggedInPage);
      await basket.goto();
      await expect(basket.quantityCell(APPLE.name)).toHaveText('1');

      await basket.increaseQuantity(APPLE.name);

      await expect(basket.quantityCell(APPLE.name)).toHaveText('2');
      const unit = await basket.unitPriceOf(APPLE.name);
      await expect.poll(async () => basket.totalPrice()).toBeCloseTo(unit * 2, 2);
      await expect.poll(async () => basketApi.quantityOf(session.bid, APPLE.id)).toBe(2);
    }
  );

  test(
    'decreasing quantity updates the line',
    { tag: ['@regression'] },
    async ({ loggedInPage, session, basketApi }) => {
      basketApi.setToken(session.token);
      await basketApi.addItemRaw(session.bid, APPLE.id, 3);

      const basket = new BasketPage(loggedInPage);
      await basket.goto();
      await expect(basket.quantityCell(APPLE.name)).toHaveText('3');

      await basket.decreaseQuantity(APPLE.name);

      await expect(basket.quantityCell(APPLE.name)).toHaveText('2');
      await expect.poll(async () => basketApi.quantityOf(session.bid, APPLE.id)).toBe(2);
    }
  );

  test(
    'removing an item empties the basket',
    { tag: ['@regression'] },
    async ({ loggedInPage, session, basketApi }) => {
      basketApi.setToken(session.token);
      await basketApi.addItemRaw(session.bid, APPLE.id, 1);

      const basket = new BasketPage(loggedInPage);
      await basket.goto();
      await expect(basket.rows).toHaveCount(1);

      await basket.removeItem(APPLE.name);

      await expect(basket.rows).toHaveCount(0);
      await expect.poll(async () => basketApi.lineCount(session.bid)).toBe(0);
    }
  );

  test(
    'the basket survives a page reload',
    { tag: ['@regression'] },
    async ({ loggedInPage, session, basketApi }) => {
      basketApi.setToken(session.token);
      await basketApi.addItemRaw(session.bid, ORANGE.id, 1);

      const basket = new BasketPage(loggedInPage);
      await basket.goto();
      await expect(basket.row(ORANGE.name)).toBeVisible();

      await loggedInPage.reload();
      await basket.dismissOverlays();

      await expect(basket.row(ORANGE.name)).toBeVisible();
    }
  );

  test(
    'adding the same product twice increments its quantity (not a second line)',
    { tag: ['@regression'] },
    async ({ loggedInPage, session, basketApi }) => {
      basketApi.setToken(session.token);
      const home = new HomePage(loggedInPage);
      await home.goto();

      // Wait for the first add to register before the second, so we are truly
      // testing "add an already-present product" (and not racing two adds).
      await home.addToBasket(APPLE.name);
      await expect.poll(async () => basketApi.quantityOf(session.bid, APPLE.id)).toBe(1);

      await home.addToBasket(APPLE.name);
      await expect.poll(async () => basketApi.quantityOf(session.bid, APPLE.id)).toBe(2);
      await expect.poll(async () => basketApi.lineCount(session.bid)).toBe(1);
    }
  );
});
