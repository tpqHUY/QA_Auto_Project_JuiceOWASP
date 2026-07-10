import { test, expect } from '../../src/fixtures/index.js';
import { RegisterPage } from '../../src/pages/register.page.js';
import { LoginPage } from '../../src/pages/login.page.js';
import { HomePage } from '../../src/pages/home.page.js';
import { BasketPage } from '../../src/pages/basket.page.js';
import { AddressPage } from '../../src/pages/checkout/address.page.js';
import { DeliveryPage } from '../../src/pages/checkout/delivery.page.js';
import { PaymentPage } from '../../src/pages/checkout/payment.page.js';
import { OrderSummaryPage } from '../../src/pages/checkout/order-summary.page.js';
import { OrderConfirmationPage } from '../../src/pages/checkout/order-confirmation.page.js';
import { KNOWN_PRODUCTS } from '../../src/data/constants.js';

const { appleJuice: APPLE } = KNOWN_PRODUCTS;

/**
 * The headline end-to-end journey — a guest becomes a paying customer, driven
 * entirely through the UI, then verified against the API.
 *
 *   register → login → search → add to basket → address → delivery →
 *   payment → place order → (API) confirm the order exists.
 *
 * The only non-UI step is seeding the payment card via the API: Juice Shop's
 * payment form is constrained by the `expYear >= 2080` model quirk, so a card is
 * created over HTTP and then *selected* in the UI. Everything else is real UI.
 */
test(
  'guest can register, shop and complete a purchase (API-verified)',
  { tag: ['@smoke', '@regression', '@e2e'] },
  async ({ page, user, address, card, basketApi, cardApi, orderApi }) => {
    // This is a long, full-journey test driven entirely through the UI
    // (register → login → search → basket → checkout → pay). It comfortably
    // fits the default 45s locally, but slower CI runners need more headroom,
    // so triple the timeout rather than leave it flaky on CI.
    test.slow();

    // 1. Register (UI) → app routes to the login page.
    const register = new RegisterPage(page);
    await register.goto();
    await register.register(user);
    await expect(page).toHaveURL(/\/login$/);

    // 2. Log in (UI).
    const login = new LoginPage(page);
    await login.loginAs(user);
    await login.navbar.openAccountMenu();
    await expect(login.navbar.logoutMenuButton).toBeVisible();
    await page.keyboard.press('Escape');

    // Grab the session token + basket id to seed a card and to verify state.
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const bid = await page.evaluate(() => sessionStorage.getItem('bid'));
    expect(token).toBeTruthy();
    expect(bid).toBeTruthy();
    basketApi.setToken(token!);
    cardApi.setToken(token!);
    orderApi.setToken(token!);
    await cardApi.create(card);

    // 3. Find a product and add it to the basket (UI).
    const home = new HomePage(page);
    await home.goto();
    await home.addToBasket(APPLE.name);
    // Confirm the add reached the backend before moving on.
    await expect.poll(() => basketApi.quantityOf(bid!, APPLE.id)).toBeGreaterThanOrEqual(1);

    // 4. Check out through the UI — reach the basket via the cart button (SPA nav,
    //    like a real user; a full reload here can race the basket id after login).
    await home.navbar.goToBasket();
    const basket = new BasketPage(page);
    await basket.dismissOverlays();
    await expect(basket.row(APPLE.name)).toBeVisible();
    await basket.checkout();

    const addressPage = new AddressPage(page);
    await page.waitForURL(/address\/select/);
    await addressPage.addNewAddress(address);
    await addressPage.selectFirst();
    await addressPage.continue();

    const delivery = new DeliveryPage(page);
    await delivery.selectByName('Standard Delivery');
    await delivery.continue();

    const payment = new PaymentPage(page);
    await payment.selectFirstCard();
    await payment.continue();

    const summary = new OrderSummaryPage(page);
    await summary.placeOrder();

    // 5. Confirmation (UI) + verification (API).
    const confirmation = new OrderConfirmationPage(page);
    expect(await confirmation.isConfirmed()).toBe(true);
    const orderId = confirmation.orderId();
    expect(orderId).toBeTruthy();

    const order = await orderApi.findInHistory(orderId!);
    expect(order, 'placed order should appear in history').toBeDefined();
    expect(order!.products.map((p) => p.name)).toContain(APPLE.name);
  }
);
