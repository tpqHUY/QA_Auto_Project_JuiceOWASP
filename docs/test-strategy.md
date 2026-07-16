# Test Strategy — OWASP Juice Shop E2E Automation

> Living document. Covers scope, approach, risk-based prioritisation, and the
> design decisions behind the framework. Written to be defensible in an
> interview: every choice has a stated _why_.

## 1. Objective

Build a maintainable, fully-parallel E2E automation framework for a real
e-commerce application (OWASP Juice Shop), covering the core customer journey
(**auth → catalog/search → basket → checkout**) across both **UI** and **API**
layers, wired into CI.

## 2. System under test

| Aspect      | Detail                                                 |
| ----------- | ------------------------------------------------------ |
| Application | OWASP Juice Shop `v17.1.1` (pinned)                    |
| Front end   | Angular SPA (hash routing, `/#/...`), Angular Material |
| Back end    | Express/Node REST API (`/api/*`, `/rest/*`)            |
| Persistence | SQLite embedded in the container                       |
| Deployment  | Single Docker container (`bkimminich/juice-shop`)      |

Because the DB is embedded and not reachable from outside the container, the
**verification layer is API-level state checking** rather than direct SQL
assertions: after a UI action we read the REST API to confirm the backend
state. This is the modern equivalent of a DB check for an API-driven SPA and is
demonstrated throughout the basket suite (the "UI action → API verify" pattern).

## 3. Scope

### In scope (automated)

| Module           | Coverage                                                                     | Priority |
| ---------------- | ---------------------------------------------------------------------------- | -------- |
| Authentication   | register, login (+negatives), logout, password recovery                      | P1       |
| Basket           | add/increase/decrease/remove, total calculation, persistence                 | P1       |
| Checkout         | add/select address, delivery choice, payment, place order + order verify     | P1       |
| E2E journey      | register → shop → checkout → pay, UI-driven, API-verified                    | P1       |
| Catalog & Search | listing, pagination, search (hit/miss), product detail                       | P2       |
| API contracts    | auth, products, basket, address/card/order — status + schema + authorization | P1       |
| Security smoke   | SQLi login bypass, IDOR basket access (documented)                           | P3       |

### Out of scope (and why)

- **Coupons / wallet / loyalty points** — secondary to the core purchase path.
- **Visual regression, performance, load** — different tooling, different goal.
- **Third-party/2FA/OAuth flows** — not part of the core journey being showcased.
- **Direct DB assertions** — not possible (embedded SQLite); replaced by API checks.

## 4. Risk-based prioritisation

Effort follows business risk × likelihood of regression:

| Risk                            | Impact                          | Coverage response                                               |
| ------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| A user cannot log in / register | Revenue-blocking                | P1, tagged `@smoke`, runs on every push                         |
| Basket total is wrong           | Direct financial / trust impact | Dedicated price-calculation tests, data-driven from live prices |
| Unauthorized basket/data access | Security / compliance           | Authorization negatives (401) + documented IDOR                 |
| Search returns wrong/no results | Conversion impact               | Hit and miss cases                                              |
| Cosmetic/layout                 | Low                             | Not automated at E2E level                                      |

`@smoke` = the "is the store fundamentally working?" subset (14 tests, chromium,
per push); the full `@regression` set (52) runs nightly across all three browsers.

## 5. Test approach & design principles

1. **Page Object Model + components.** Locators and actions live in
   `src/pages/*`; specs read as business intent, not CSS selectors. Shared UI
   (navbar, product-detail dialog) is modelled as components, not pages.
2. **API-first setup.** Users are created and authenticated over HTTP; the
   `loggedInPage` fixture injects the token + basket id straight into browser
   storage (the `storageState` technique) so UI tests start authenticated
   without ever driving the login form. Faster and far less flaky.
3. **Per-test data via factories.** Every test mints its own user/address/card
   with `@faker-js/faker`. No shared state ⇒ safe to run fully parallel, no
   cleanup, no order dependency.
4. **Contract testing with schemas.** API responses are validated with `zod`
   (`src/api/schemas.ts`). A 200 with a malformed body is treated as a failure.
5. **No hard waits.** Only Playwright web-first assertions / auto-waiting and
   `expect.poll` for eventual state. Zero `waitForTimeout` in the suite.
6. **Tagging drives CI.** `@smoke`, `@regression`, `@api`, `@security` let CI
   pick the right subset per context.

## 6. Key design decisions (interview Q&A)

- **Why fixtures instead of `beforeEach`?** Fixtures are composable, lazily
  instantiated (a test only pays for what it declares), type-safe, and free of
  the shared mutable state `beforeEach` encourages. `loggedInPage` layers cleanly
  on top of `session`, which layers on `user` — each independently reusable.
- **Why log in via the API?** The login form is exercised by a handful of
  dedicated UI tests; everywhere else, re-driving it would be slow and a
  needless flake source. API auth + storage injection gets a test to its actual
  subject in milliseconds.
- **Why per-test users instead of one shared `storageState` file?** Isolation.
  A single shared account would make basket/quantity tests collide the moment
  they run in parallel. Fresh users keep the suite parallel-safe and
  deterministic.
- **How is flakiness handled?** Auto-waiting everywhere; per-test isolation;
  `trace: on-first-retry` for post-mortem; a worker cap so the single container
  isn't overwhelmed (a real source of load-induced timeouts we diagnosed and
  fixed); 1 local / 2 CI retries as a safety net, not a crutch.
- **Why validate schemas?** Status codes alone miss contract drift. Schemas turn
  "the API changed shape" into an immediate, readable failure.

## 7. Environments & execution

| Env   | Base URL                | Notes                                 |
| ----- | ----------------------- | ------------------------------------- |
| Local | `http://localhost:3000` | `docker compose up -d`                |
| CI    | `http://localhost:3000` | container started inside the workflow |

- Parallelism: `fullyParallel`, worker cap tuned to the single-container backend.
- Full suite wall-clock: **~30s** chromium (69 cases); cross-browser sharded
  across 3 runners in the nightly.
- Browser matrix is expressed as Playwright **projects** — the same config serves
  `@smoke` on chromium (per push) and full regression on all three (nightly).
- **CI:** `smoke.yml` runs static checks + Vitest unit tests + `npm audit`
  (`checks` job) and `@smoke` on chromium (`smoke` job) on every push/PR;
  `nightly-regression.yml` runs the full `@regression` suite across all three
  engines, **sharded 3 ways**, merging per-shard results into a single **Allure
  trend report** (history preserved, failures classified by **categories**)
  published to **GitHub Pages**. `codeql.yml` adds SAST; Dependabot keeps deps current.
- **Reporting:** Playwright HTML every run; Allure (`allure-playwright` → `allure`
  CLI, needs a JRE) for the public trend report. Failure diagnostics:
  `trace: on-first-retry`, `screenshot`/`video` on failure.

## 8. Risks to the framework itself & mitigations

| Risk                                                                            | Mitigation                                                                                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Upstream Juice Shop release breaks selectors/behaviour                          | Docker image **pinned** to `v17.1.1`; bump deliberately + re-run regression                                                                 |
| Single container overwhelmed under high parallelism                             | Worker cap in `playwright.config.ts` (diagnosed via a full-run flake)                                                                       |
| Intentional Juice Shop vulnerabilities look like "failures"                     | `@security` tests assert _current_ behaviour and document the secure expectation                                                            |
| Flaky third-party network                                                       | API-first setup keeps tests self-contained against the local instance                                                                       |
| Finite product stock depletes over many order-placing runs (`400 out of stock`) | Regression runs on a **fresh container** (CI always fresh; locally `npm run app:reset`); order tests stay under Juice Shop's `limitPerUser` |
| Cross-browser timing races (menu/redirect on Firefox/WebKit)                    | Web-first waits + retry-until-open helpers (`openAccountMenu`); verified green on all three engines                                         |

## 9. Definition of Done

- [x] Framework scaffolding, Docker, CI-ready config
- [x] POM + fixtures + API client + data factories
- [x] Auth, catalog/search, basket, checkout UI suites
- [x] Auth/products/basket/order API suites with schema validation
- [x] Full purchase-journey E2E (UI-driven, API-verified)
- [x] `@smoke`/`@regression`/`@api`/`@security`/`@a11y`/`@performance`/`@visual` tagging
- [x] GitHub Actions smoke pipeline on push/PR (+ static/unit checks + `npm audit`)
- [x] Cross-browser green (chromium/firefox/webkit — 201 runs), nightly sharded 3×
- [x] Allure trend report (with categories) + nightly cross-browser regression on GitHub Pages
- [x] 67 tests passing, stable, parallel (~30 s chromium) + 9 Vitest unit tests
- [x] New test types: a11y (axe), performance budgets, visual regression
- [x] Security depth: JWT-tampering + headers tests, CodeQL, Dependabot
- [x] Docs: strategy, traceability matrix, exploratory notes, ADRs, CONTRIBUTING, JIRA-style bug reports
