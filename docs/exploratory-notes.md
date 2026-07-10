# Exploratory Testing Notes — OWASP Juice Shop `v17.1.1`

> Notes captured while manually exploring the app before automating. These are
> the ground-truth selectors, endpoints, and behavioural quirks the framework is
> built on. Documenting them means future selector/endpoint changes have one
> reference to diff against.

## Session & auth storage

Discovered by logging in and inspecting browser storage:

| What | Where |
|---|---|
| JWT | `localStorage['token']` **and** a cookie named `token` |
| Basket id | `sessionStorage['bid']` |
| Welcome banner suppressed by | cookie `welcomebanner_status=dismiss` |
| Cookie-consent bar suppressed by | cookie `cookieconsent_status=dismiss` |

⇒ The `loggedInPage` fixture reproduces exactly this: token cookie + `localStorage.token`
+ `sessionStorage.bid`, plus the two dismiss cookies. That is enough for the SPA
to consider the session authenticated **without** using the login form.

> ⚠️ `sessionStorage` is **not** captured by Playwright's `storageState`, so the
> basket id is injected via `addInitScript`, not a saved storage-state file.

## Key REST endpoints

| Endpoint | Method | Notes |
|---|---|---|
| `/rest/admin/application-version` | GET | `{version}` — used for health check |
| `/rest/user/login` | POST | `{email,password}` → `{authentication:{token,bid,umail}}`; 401 on bad creds |
| `/api/Users` | POST | register → 201; **does not persist the security answer** |
| `/api/SecurityAnswers` | POST | `{UserId,SecurityQuestionId,answer}` → 201; required for password recovery |
| `/api/SecurityQuestions` | GET | seeded list |
| `/rest/user/security-question?email=` | GET | returns the account's question (empty `{}` if none) |
| `/api/Products` | GET | `{status,data:Product[]}` |
| `/rest/products/search?q=` | GET | `{status,data:Product[]}`; empty array on no match |
| `/rest/basket/{bid}` | GET | `data.Products[].BasketItem.quantity` holds the line qty; 401 without token |
| `/api/BasketItems` | POST | `{ProductId,BasketId,quantity}` → 200; 401 without token |
| `/api/BasketItems/{id}` | DELETE | remove a line |

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

## Intentional vulnerabilities observed (OWASP by design)

- **SQLi login bypass:** `email = ' OR 1=1--` + any password → 200 + valid session.
- **IDOR:** an authenticated user can `GET /rest/basket/{someoneElsesBid}` → 200.

Both are captured as `@security` tests that assert the current behaviour and
document the secure expectation.
