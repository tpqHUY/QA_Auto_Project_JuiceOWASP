# Test Cases & Traceability Matrix

Requirement → test case → automated spec. Every automated test maps back to a
requirement so coverage is auditable. IDs: `TC-<MODULE>-<n>`.

Legend for tags: 🔥 `@smoke` · 🔁 `@regression` (all) · 🔌 `@api` · 🔐 `@security`

## Authentication

| ID | Requirement | Test case | Spec | Tags |
|---|---|---|---|---|
| TC-AUTH-01 | A visitor can create an account | Register with valid data → routed to login, account authenticates | `tests/ui/auth/register.spec.ts` | 🔥🔁 |
| TC-AUTH-02 | Passwords must match | Mismatched confirm → error + submit disabled | `tests/ui/auth/register.spec.ts` | 🔁 |
| TC-AUTH-03 | Email must be valid | Bad email format → error + submit disabled | `tests/ui/auth/register.spec.ts` | 🔁 |
| TC-AUTH-04 | Security question is mandatory | No question selected → submit disabled | `tests/ui/auth/register.spec.ts` | 🔁 |
| TC-AUTH-05 | A registered user can log in | Valid creds → session active | `tests/ui/auth/login.spec.ts` | 🔥🔁 |
| TC-AUTH-06 | Wrong password is rejected | Error message shown | `tests/ui/auth/login.spec.ts` | 🔁 |
| TC-AUTH-07 | Unknown user is rejected | Error message shown | `tests/ui/auth/login.spec.ts` | 🔁 |
| TC-AUTH-08 | Login form validation | Button disabled until both fields filled | `tests/ui/auth/login.spec.ts` | 🔁 |
| TC-AUTH-09 | A user can log out | Session cleared, login offered again | `tests/ui/auth/login.spec.ts` | 🔥🔁 |
| TC-AUTH-10 | Password recovery works | Correct answer → new password works, old fails | `tests/ui/auth/forgot-password.spec.ts` | 🔁 |
| TC-AUTH-11 | Recovery rejects wrong answer | Wrong answer → password unchanged | `tests/ui/auth/forgot-password.spec.ts` | 🔁 |
| TC-AUTH-12 | Recovery form structure | Expected fields present | `tests/ui/auth/forgot-password.spec.ts` | 🔁 |

## Catalog & Search

| ID | Requirement | Test case | Spec | Tags |
|---|---|---|---|---|
| TC-CAT-01 | Catalog renders | Products visible on load | `tests/ui/catalog/catalog.spec.ts` | 🔥🔁 |
| TC-CAT-02 | Product info shown | Each card has a name + valid price | `tests/ui/catalog/catalog.spec.ts` | 🔁 |
| TC-CAT-03 | Pagination works | Next page shows different products | `tests/ui/catalog/catalog.spec.ts` | 🔁 |
| TC-CAT-04 | Product detail | Dialog opens with correct title | `tests/ui/catalog/catalog.spec.ts` | 🔁 |
| TC-SRCH-01 | Search finds products | Keyword returns matching products | `tests/ui/catalog/search.spec.ts` | 🔥🔁 |
| TC-SRCH-02 | Search no-match | Nonsense term → no products | `tests/ui/catalog/search.spec.ts` | 🔁 |
| TC-SRCH-03 | Open a search result | Result opens its detail dialog | `tests/ui/catalog/search.spec.ts` | 🔁 |

## Basket (UI + API verification)

| ID | Requirement | Test case | Spec | Tags |
|---|---|---|---|---|
| TC-BSK-01 | Add product to basket | Add from catalog → present in basket (API-verified) | `tests/ui/basket/basket.spec.ts` | 🔥🔁 |
| TC-BSK-02 | Correct total | Total = Σ(unit price × qty) | `tests/ui/basket/basket.spec.ts` | 🔥🔁 |
| TC-BSK-03 | Increase quantity | Line + total update; API agrees | `tests/ui/basket/basket.spec.ts` | 🔁 |
| TC-BSK-04 | Decrease quantity | Line updates; API agrees | `tests/ui/basket/basket.spec.ts` | 🔁 |
| TC-BSK-05 | Remove item | Basket empties; API agrees | `tests/ui/basket/basket.spec.ts` | 🔁 |
| TC-BSK-06 | Basket persistence | Survives page reload | `tests/ui/basket/basket.spec.ts` | 🔁 |
| TC-BSK-07 | Add same product twice | Quantity increments, single line | `tests/ui/basket/basket.spec.ts` | 🔁 |

## API contracts

| ID | Requirement | Test case | Spec | Tags |
|---|---|---|---|---|
| TC-API-AUTH-01 | Login contract | 200 + valid JWT schema | `tests/api/auth.api.spec.ts` | 🔥🔁🔌 |
| TC-API-AUTH-02 | Login rejects wrong password | 401 | `tests/api/auth.api.spec.ts` | 🔁🔌 |
| TC-API-AUTH-03 | Login rejects unknown user | 401 | `tests/api/auth.api.spec.ts` | 🔁🔌 |
| TC-API-AUTH-04 | Register contract | 201 + user schema | `tests/api/auth.api.spec.ts` | 🔥🔁🔌 |
| TC-API-AUTH-05 | Duplicate email rejected | 4xx | `tests/api/auth.api.spec.ts` | 🔁🔌 |
| TC-API-AUTH-06 | Empty email rejected | 400 | `tests/api/auth.api.spec.ts` | 🔁🔌 |
| TC-API-AUTH-07 | Security questions available | 200 + list | `tests/api/auth.api.spec.ts` | 🔁🔌 |
| TC-API-AUTH-08 | End-to-end register+login | Valid session issued | `tests/api/auth.api.spec.ts` | 🔁🔌 |
| TC-API-PRD-01 | Product list contract | 200 + schema, >10 items | `tests/api/products.api.spec.ts` | 🔥🔁🔌 |
| TC-API-PRD-02 | Product data validity | Name + non-negative price | `tests/api/products.api.spec.ts` | 🔁🔌 |
| TC-API-PRD-03 | Search finds product | Keyword returns known product | `tests/api/products.api.spec.ts` | 🔥🔁🔌 |
| TC-API-PRD-04 | Search no-match | Empty result set | `tests/api/products.api.spec.ts` | 🔁🔌 |
| TC-API-PRD-05 | Product by id | Known product retrievable | `tests/api/products.api.spec.ts` | 🔁🔌 |
| TC-API-BSK-01 | Add item (authorized) | 200 + schema | `tests/api/basket.api.spec.ts` | 🔥🔁🔌 |
| TC-API-BSK-02 | Read back item | Quantity + line count correct | `tests/api/basket.api.spec.ts` | 🔁🔌 |
| TC-API-BSK-03 | Remove item | Line dropped | `tests/api/basket.api.spec.ts` | 🔁🔌 |
| TC-API-BSK-04 | Read requires auth | 401 without token | `tests/api/basket.api.spec.ts` | 🔁🔌 |
| TC-API-BSK-05 | Write requires auth | 401 without token | `tests/api/basket.api.spec.ts` | 🔁🔌 |

## Security smoke (documented OWASP vulnerabilities)

| ID | Requirement (secure expectation) | Observed behaviour | Spec | Tags |
|---|---|---|---|---|
| TC-SEC-01 | Login must resist SQL injection | `' OR 1=1--` bypasses auth (API) → **200** | `tests/security/security.spec.ts` | 🔁🔌🔐 |
| TC-SEC-02 | Login form must resist SQLi | Injection logs in via UI | `tests/security/security.spec.ts` | 🔁🔐 |
| TC-SEC-03 | Basket access must be owner-only | IDOR: reads another user's basket → **200** | `tests/security/security.spec.ts` | 🔁🔌🔐 |

**Totals:** 47 automated tests — 12 🔥 smoke · 20 🔌 API · 3 🔐 security · 47 🔁 regression.
