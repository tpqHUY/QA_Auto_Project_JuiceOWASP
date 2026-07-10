# Exploratory Testing Notes — OWASP Juice Shop `v17.1.1`

> Notes captured while manually exploring the app before automating. These are
> the ground-truth selectors, endpoints, and behavioural quirks the framework is
> built on. Documenting them means future selector/endpoint changes have one
> reference to diff against.

## Session & auth storage

Discovered by logging in and inspecting browser storage:

| What                             | Where                                                  |
| -------------------------------- | ------------------------------------------------------ |
| JWT                              | `localStorage['token']` **and** a cookie named `token` |
| Basket id                        | `sessionStorage['bid']`                                |
| Welcome banner suppressed by     | cookie `welcomebanner_status=dismiss`                  |
| Cookie-consent bar suppressed by | cookie `cookieconsent_status=dismiss`                  |

⇒ The `loggedInPage` fixture reproduces exactly this: token cookie + `localStorage.token`

- `sessionStorage.bid`, plus the two dismiss cookies. That is enough for the SPA
  to consider the session authenticated **without** using the login form.

> ⚠️ `sessionStorage` is **not** captured by Playwright's `storageState`, so the
> basket id is injected via `addInitScript`, not a saved storage-state file.

## Key REST endpoints

| Endpoint                              | Method | Notes                                                                       |
| ------------------------------------- | ------ | --------------------------------------------------------------------------- |
| `/rest/admin/application-version`     | GET    | `{version}` — used for health check                                         |
| `/rest/user/login`                    | POST   | `{email,password}` → `{authentication:{token,bid,umail}}`; 401 on bad creds |
| `/api/Users`                          | POST   | register → 201; **does not persist the security answer**                    |
| `/api/SecurityAnswers`                | POST   | `{UserId,SecurityQuestionId,answer}` → 201; required for password recovery  |
| `/api/SecurityQuestions`              | GET    | seeded list                                                                 |
| `/rest/user/security-question?email=` | GET    | returns the account's question (empty `{}` if none)                         |
| `/api/Products`                       | GET    | `{status,data:Product[]}`                                                   |
| `/rest/products/search?q=`            | GET    | `{status,data:Product[]}`; empty array on no match                          |
| `/rest/basket/{bid}`                  | GET    | `data.Products[].BasketItem.quantity` holds the line qty; 401 without token |
| `/api/BasketItems`                    | POST   | `{ProductId,BasketId,quantity}` → 200; 401 without token                    |
| `/api/BasketItems/{id}`               | DELETE | remove a line                                                               |

### 🐞 Quirk that bit us — security answer is a second call

`POST /api/Users` accepts `securityQuestion`/`securityAnswer` in the body and
returns 201, **but silently does not create the SecurityAnswer record**. The
lookup then returns `{}` and password recovery can never enable its answer field.

The real registration UI makes a **second** call to `POST /api/SecurityAnswers`.
`AuthApi.register` mirrors this, which is why forgot-password automation works.

### Other quirks

- `POST /api/Users` with an **empty-string** email → 400, but with the email
  field **omitted entirely** → 201 (used the 400 case for the negative test).
- `passwordRepeat` is **not** validated server-side (mismatch still returns 201);
  it is a client-side-only check, so that negative lives in the UI suite.
- Basket total displayed with floating-point noise, e.g. `Total Price: 6.970000000000001¤`.
  Prices use the generic currency placeholder `¤`. `utils/currency.ts` parses the
  number out and asserts with `toBeCloseTo(_, 2)`.

## Key UI selectors

### Navbar (present on every page)

- Account menu button: `#navbarAccount`
- Login menu item: `#navbarLoginButton` · Logout menu item: `#navbarLogoutButton`
- Cart button (only when logged in): `[aria-label="Show the shopping cart"]`
- Search field: `#searchQuery` → input `#searchQuery input`

### Login (`/#/login`)

- `#email`, `#password`, `#loginButton`; error banner `.error`

### Register (`/#/register`)

- `#emailControl`, `#passwordControl`, `#repeatPasswordControl`, `#securityAnswerControl`, `#registerButton`
- Security question: `mat-select[name="securityQuestion"]` → options as `mat-option`
  (panel occasionally needs a retry to open under load)

### Forgot password (`/#/forgot-password`)

- `#email`, `#securityAnswer` (disabled until the question loads), `#newPassword`, `#newPasswordRepeat`, `#resetButton`
- The question lookup fires on the email field's **debounced `valueChanges`**;
  a bulk `fill()` does not trigger it — real keystrokes (`pressSequentially`) do.

### Catalog / search (`/#/search`)

- Product card: `mat-grid-tile` → name `.item-name`, price `.item-price`, add button `button[aria-label="Add to Basket"]` (also `.btn-basket`)
- Pagination: `mat-paginator`, next = `button[aria-label="Next page"]`
- Product detail is a **dialog** (`mat-dialog-container`), not a route; title in `h1`; closes on `Escape`

### Basket (`/#/basket`)

- Table `mat-table`, rows `mat-row`; columns `mat-cell.mat-column-{product,quantity,price,remove}`
- Quantity cell holds two icon buttons in order **[decrease, increase]**
- Remove = the single button in `mat-column-remove`
- Total: `#price`; checkout: `#checkoutButton`

## Checkout flow (added week 4)

**Route sequence:** basket `#checkoutButton` → `/#/address/select` → `/#/delivery-method`
→ `/#/payment/shop` → `/#/order-summary` → `/#/order-completion/:orderId`.

### API endpoints (some Sequelize-pluralised — verified, not assumed)

| Endpoint                      | Method   | Notes                                                                                                     |
| ----------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `/api/Addresss`               | POST/GET | triple-`s`; `{fullName, mobileNum (number), zipCode, streetAddress, city, state, country}` → 201          |
| `/api/Cards`                  | POST     | `{fullName, cardNum, expMonth, expYear}` → 201                                                            |
| `/api/Deliverys`              | GET      | 3 methods: One Day 0.99 / Fast 0.50 / Standard 0.00                                                       |
| `/rest/basket/{bid}/checkout` | POST     | `{couponData:null, orderDetails:{paymentId, addressId, deliveryMethodId}}` → `{orderConfirmation:"<id>"}` |
| `/rest/track-order/{orderId}` | GET      | order detail: `totalPrice`, `deliveryPrice`, `products[]`                                                 |
| `/rest/order-history`         | GET      | list of the user's orders (same row shape)                                                                |

> 🐞 **Card expiry quirk:** the Card model rejects `expYear` below ~2080 (`min`
> validator — 2027 → 400, 2080 → 201). Test cards use a year ≥ 2080
> (`MIN_CARD_EXP_YEAR`), and checkout tests seed the card via API rather than the
> UI form. `totalPrice` on an order = items + delivery.

> 🐞 **Finite product stock (added week 5).** Each product has seeded stock in
> `/api/Quantitys` (e.g. Apple Juice id 1: `quantity: 38`, `limitPerUser: 5`;
> Orange id 2: `quantity: 83`). Adding to basket **checks** `qty ≤ stock` and a
> user can't exceed `limitPerUser`; placing orders **decrements** stock. Running
> the whole suite dozens of times depletes it → `POST /api/BasketItems` returns
> `400 {"error":"We are out of stock!"}`. Fix: run regression on a **fresh
> container** (Juice Shop re-seeds full stock on start — CI is always fresh;
> locally `npm run app:reset`). Order-placing tests keep quantities ≤ 5.

## Cross-browser notes (added week 5)

Suite runs green on **chromium, firefox, webkit** (156 runs). One real
cross-engine issue surfaced and was fixed:

- 🐞 **Account menu race (Firefox):** clicking `#navbarAccount` right after a
  UI login (while the post-login redirect is still settling) sometimes failed to
  open the menu, so `#navbarLogoutButton` never appeared. Fix: `NavbarComponent.openAccountMenu()`
  retries the click until a menu item is actually visible.
- The `waitUntil: 'domcontentloaded'` navigation + web-first assertions (week 4)
  are what keep firefox/webkit stable under the single-container load.

### UI selectors

- **Address form** (`/#/address/create`): inputs have **dynamic `mat-input-N` ids** →
  locate by placeholder (`Please provide a country.` / `name.` / `mobile number.` /
  `ZIP code.` / `city.` / `state.`); street is `#address`; submit `#submitButton`.
- **Address select**: rows `mat-row` + `mat-radio-button`; add `button[aria-label="Add a new address"]`;
  continue `button[aria-label="Proceed to payment selection"]` (label is off-by-one — goes to delivery).
- **Delivery**: `mat-row` per method (name/price/eta in cells, radio in a cell — filter the row, not the radio);
  continue `button[aria-label="Proceed to delivery method selection"]` (→ payment).
- **Payment**: card `mat-radio-button`; continue `button[aria-label="Proceed to review"]` (disabled until a card is chosen).
- **Order summary**: place order `#checkoutButton` (`aria-label="Complete your purchase"`).
- **Order completion**: `getByText(/thank you for your purchase/i)`; order id is in the URL.

## Intentional vulnerabilities observed (OWASP by design)

- **SQLi login bypass:** `email = ' OR 1=1--` + any password → 200 + valid session.
- **IDOR:** an authenticated user can `GET /rest/basket/{someoneElsesBid}` → 200.

Both are captured as `@security` tests that assert the current behaviour and
document the secure expectation.
