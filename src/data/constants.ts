/**
 * App-wide constants: routes, storage keys, and stable reference data discovered
 * during exploratory testing (see docs/exploratory-notes.md).
 *
 * Centralising these means when Juice Shop changes a route or a storage key,
 * there is exactly one place to update — not dozens of specs.
 */

/** Hash-router routes (Juice Shop is an Angular SPA served under `/#/...`). */
export const ROUTES = {
  home: '/#/',
  search: '/#/search',
  login: '/#/login',
  register: '/#/register',
  basket: '/#/basket',
  forgotPassword: '/#/forgot-password',
  contact: '/#/contact',
  // Checkout flow (in order)
  addressSelect: '/#/address/select',
  addressCreate: '/#/address/create',
  deliveryMethod: '/#/delivery-method',
  payment: '/#/payment/shop',
  orderSummary: '/#/order-summary',
  orderHistory: '/#/order-history',
} as const;

/** Keys the Angular app uses to persist session state (confirmed via probe). */
export const STORAGE = {
  /** JWT — stored in BOTH localStorage and a cookie named `token`. */
  tokenKey: 'token',
  /** Basket id — stored in sessionStorage under `bid`. */
  basketIdKey: 'bid',
} as const;

/** Cookies that suppress the welcome banner and cookie-consent overlay. */
export const DISMISS_COOKIES = [
  { name: 'welcomebanner_status', value: 'dismiss' },
  { name: 'cookieconsent_status', value: 'dismiss' },
] as const;

/**
 * A stable security question. Juice Shop seeds these on every boot; id 1 is
 * "Your eldest siblings middle name?". We reference by id for API, by visible
 * text for the UI dropdown.
 */
export const SECURITY_QUESTION = {
  id: 1,
  text: 'Your eldest siblings middle name?',
} as const;

/**
 * Well-known seeded products (ids are stable across boots). Used where a test
 * needs a deterministic product; catalog tests otherwise read live API data.
 */
export const KNOWN_PRODUCTS = {
  appleJuice: { id: 1, name: 'Apple Juice (1000ml)', price: 1.99 },
  orangeJuice: { id: 2, name: 'Orange Juice (1000ml)', price: 2.99 },
} as const;

/** REST endpoints under test (kept beside routes for one-glance API surface). */
export const ENDPOINTS = {
  login: '/rest/user/login',
  users: '/api/Users',
  securityQuestions: '/api/SecurityQuestions',
  securityAnswers: '/api/SecurityAnswers',
  products: '/api/Products',
  productSearch: '/rest/products/search',
  basket: (id: number | string) => `/rest/basket/${id}`,
  basketItems: '/api/BasketItems',
  basketItem: (id: number | string) => `/api/BasketItems/${id}`,
  applicationVersion: '/rest/admin/application-version',
  // Checkout (note Juice Shop's Sequelize-pluralised names: Addresss, Deliverys)
  addresses: '/api/Addresss',
  cards: '/api/Cards',
  deliveries: '/api/Deliverys',
  checkout: (bid: number | string) => `/rest/basket/${bid}/checkout`,
  orderHistory: '/rest/order-history',
  trackOrder: (orderId: string) => `/rest/track-order/${orderId}`,
} as const;

/**
 * Juice Shop's Card model rejects any `expYear` below ~2080 (a Sequelize `min`
 * validator — confirmed via probe: 2027 → 400, 2080 → 201). Card test data must
 * use a year in the accepted range or the API refuses to create it.
 */
export const MIN_CARD_EXP_YEAR = 2080;
