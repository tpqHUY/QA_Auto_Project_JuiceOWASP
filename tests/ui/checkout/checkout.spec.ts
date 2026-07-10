import { test, expect } from '../../../src/fixtures/index.js';
import { AddressPage } from '../../../src/pages/checkout/address.page.js';
import { DeliveryPage } from '../../../src/pages/checkout/delivery.page.js';
import { PaymentPage } from '../../../src/pages/checkout/payment.page.js';
import { OrderSummaryPage } from '../../../src/pages/checkout/order-summary.page.js';
import { OrderConfirmationPage } from '../../../src/pages/checkout/order-confirmation.page.js';
import { KNOWN_PRODUCTS } from '../../../src/data/constants.js';
import type { Page } from '@playwright/test';

const { appleJuice: APPLE } = KNOWN_PRODUCTS;
const DELIVERY = { standard: 'Standard Delivery', oneDay: 'One Day Delivery' } as const;

/**
 * Checkout flow: address → delivery → payment → review → place order.
 *
 * Prerequisites (a card, sometimes an address, basket items) are seeded via the
 * API — the fast, robust setup pattern — so each test drives only the UI steps
 * it is actually asserting, then verifies the placed order through the API.
 */
async function walkToOrder(page: Page, deliveryName: string): Promise<OrderConfirmationPage> {
  const address = new AddressPage(page);
  await address.gotoSelect();
  await address.selectFirst();
  await address.continue();

  const delivery = new DeliveryPage(page);
  await delivery.selectByName(deliveryName);
  await delivery.continue();

  const payment = new PaymentPage(page);
  await payment.selectFirstCard();
  await payment.continue();

  const summary = new OrderSummaryPage(page);
  await summary.placeOrder();

  return new OrderConfirmationPage(page);
}

test.describe('Checkout (UI + API verify)', () => {
  test(
    'a user can add a new delivery address through the UI',
    { tag: ['@regression'] },
    async ({ loggedInPage, session, addressApi, address }) => {
      addressApi.setToken(session.token);

      const addressPage = new AddressPage(loggedInPage);
      await addressPage.gotoSelect();
      await addressPage.addNewAddress(address);

      // The new address now appears in the selection list...
      await expect(addressPage.row(address.streetAddress)).toBeVisible();
      // ...and the backend has it too.
      const saved = await addressApi.list();
      expect(saved.map((a) => a.streetAddress)).toContain(address.streetAddress);
    }
  );

  test(
    'a user can complete a full checkout and the order is recorded',
    { tag: ['@smoke', '@regression'] },
    async ({ loggedInPage, session, basketApi, addressApi, cardApi, orderApi, address, card }) => {
      // API-first setup: basket + address + card.
      basketApi.setToken(session.token);
      addressApi.setToken(session.token);
      cardApi.setToken(session.token);
      orderApi.setToken(session.token);
      await basketApi.addItemRaw(session.bid, APPLE.id, 2);
      await addressApi.create(address);
      await cardApi.create(card);

      // Drive the checkout UI end-to-end (free Standard delivery → total = 3.98).
      const confirmation = await walkToOrder(loggedInPage, DELIVERY.standard);

      expect(await confirmation.isConfirmed()).toBe(true);
      const orderId = confirmation.orderId();
      expect(orderId).toBeTruthy();

      // API-verify the order exists with the right contents and total.
      const order = await orderApi.findInHistory(orderId!);
      expect(order, 'order should be in history').toBeDefined();
      expect(order!.products.map((p) => p.id)).toContain(APPLE.id);
      const appleLine = order!.products.find((p) => p.id === APPLE.id)!;
      expect(appleLine.quantity).toBe(2);
      expect(order!.totalPrice).toBeCloseTo(APPLE.price * 2, 2);
    }
  );

  test(
    'the chosen delivery method is reflected in the order total',
    { tag: ['@regression'] },
    async ({ loggedInPage, session, basketApi, addressApi, cardApi, orderApi, address, card }) => {
      basketApi.setToken(session.token);
      addressApi.setToken(session.token);
      cardApi.setToken(session.token);
      orderApi.setToken(session.token);
      await basketApi.addItemRaw(session.bid, APPLE.id, 1);
      await addressApi.create(address);
      await cardApi.create(card);

      // One Day Delivery costs 0.99 → total = item (1.99) + delivery (0.99).
      const confirmation = await walkToOrder(loggedInPage, DELIVERY.oneDay);
      const orderId = confirmation.orderId();
      expect(orderId).toBeTruthy();

      const order = await orderApi.track(orderId!);
      expect(order).toBeDefined();
      expect(order!.deliveryPrice).toBeCloseTo(0.99, 2);
      expect(order!.totalPrice).toBeCloseTo(APPLE.price + 0.99, 2);
    }
  );

  test(
    'the review step cannot be reached until a payment card is selected',
    { tag: ['@regression'] },
    async ({ loggedInPage, session, basketApi, addressApi, cardApi, address, card }) => {
      basketApi.setToken(session.token);
      addressApi.setToken(session.token);
      cardApi.setToken(session.token);
      await basketApi.addItemRaw(session.bid, APPLE.id, 1);
      await addressApi.create(address);
      await cardApi.create(card);

      const addressPage = new AddressPage(loggedInPage);
      await addressPage.gotoSelect();
      await addressPage.selectFirst();
      await addressPage.continue();

      const delivery = new DeliveryPage(loggedInPage);
      await delivery.selectFirst();
      await delivery.continue();

      // On payment, "Proceed to review" is disabled until a card is chosen.
      const payment = new PaymentPage(loggedInPage);
      await expect(payment.continueButton).toBeDisabled();
      await payment.selectFirstCard();
      await expect(payment.continueButton).toBeEnabled();
    }
  );
});
