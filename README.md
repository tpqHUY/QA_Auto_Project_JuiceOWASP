# Juice Shop E2E — Playwright + TypeScript

<!-- GitHub Pages: Settings → Pages → Source "GitHub Actions"; the nightly workflow deploys the Allure report. -->

[![smoke](https://github.com/tpqHUY/QA_Auto_Project_JuiceOWASP/actions/workflows/smoke.yml/badge.svg)](https://github.com/tpqHUY/QA_Auto_Project_JuiceOWASP/actions/workflows/smoke.yml)
[![nightly-regression](https://github.com/tpqHUY/QA_Auto_Project_JuiceOWASP/actions/workflows/nightly-regression.yml/badge.svg)](https://github.com/tpqHUY/QA_Auto_Project_JuiceOWASP/actions/workflows/nightly-regression.yml)

End-to-end test automation framework for a **real dockerized e-commerce app**
([OWASP Juice Shop](https://github.com/juice-shop/juice-shop)), covering the full
customer journey across **UI and API** — from registration through a completed
purchase — with the Page Object Model, API-first setup, faker-based data
factories, and schema-validated contract tests.

> **54 tests · 3 browser engines (162 runs) · fully parallel · 0 hard waits.**
> Tagged `@smoke` (14) / `@regression` (54) / `@api` (21) / `@security` (5) for CI selection.
> **Smoke on every push** (chromium) + **nightly cross-browser regression** with an
> **[Allure trend report](https://tpqhuy.github.io/QA_Auto_Project_JuiceOWASP/)** published to GitHub Pages.

---

## Demo

The full purchase journey — catalog → basket → checkout → order confirmation —
driven end-to-end through the UI and verified via the API
([`tests/e2e/purchase-journey.spec.ts`](tests/e2e/purchase-journey.spec.ts)):

| Catalog                                | Order confirmed (API-verified)                               |
| -------------------------------------- | ------------------------------------------------------------ |
| ![Catalog](docs/assets/01-catalog.png) | ![Order confirmation](docs/assets/04-order-confirmation.png) |

## Why this project

It exercises the same skills a QA/QC automation role needs on day one:

- **Layered architecture** — POM + component objects + typed API clients + composable fixtures.
- **API-first testing** — authenticate over HTTP and inject session state so UI tests start where the actual test begins (the `storageState` technique).
- **UI action → API verify** — drive the browser, then read the REST API to prove the backend agrees (the modern stand-in for a DB check on an API-driven SPA).
- **Contract testing** — every API response validated against a `zod` schema, not just its status code.
- **Parallel-safe by construction** — per-test data factories mean zero shared state.
- **Security-aware** — documented `@security` tests for Juice Shop's intentional SQLi and IDOR flaws.

## Tech stack

| Concern            | Choice                                           |
| ------------------ | ------------------------------------------------ |
| Runner / framework | Playwright Test + TypeScript                     |
| Test data          | `@faker-js/faker`                                |
| Schema validation  | `zod`                                            |
| App under test     | OWASP Juice Shop `v17.1.1` (Docker, pinned)      |
| Quality gates      | ESLint (flat config) + Prettier + `tsc --noEmit` |

## Architecture

```mermaid
flowchart TD
    Specs["Specs (tests/**)"] --> POM["Page Objects (src/pages/*)"]
    Specs --> API["API Clients (src/api/*)"]
    POM --> FX["Fixtures (composable chain)"]
    API --> FX
    FX --> Chain["page (+banner cookies) → user/address/card (factories)<br/>→ api clients → session → loggedInPage (token injection)"]
    Chain --> App["OWASP Juice Shop (Docker :3000)"]
```

The **fixture chain** is the backbone: a spec that declares `loggedInPage`
transparently gets a fresh user (factory) → registered + logged in over the API
(`session`) → a browser page with the token/basket-id injected into storage — no
login form driven, full isolation, parallel-safe.

## Project structure

```
src/
├── pages/       # Page Objects: base, navbar, login, register, home, basket, ...
├── api/         # Typed REST clients + zod schemas (auth, product, basket)
├── fixtures/    # test-data + auth (storageState) fixtures, merged in index.ts
├── data/        # constants + faker factories (user, address, card)
└── utils/       # env, currency parsing, logger
src/pages/checkout/  # address, delivery, payment, order-summary, confirmation
tests/
├── ui/          # auth, catalog, basket, checkout UI suites
├── api/         # auth, products, basket contract suites
├── e2e/         # full purchase journey (register → pay), UI-driven
└── security/    # documented SQLi / IDOR / XSS / exposure tests
docs/            # test-strategy · exploratory-notes · test-cases · bug-reports
```

## Quick start

**Prerequisites:** Node ≥ 18, Docker Desktop.

```bash
# 1. install deps + browser
npm ci
npx playwright install chromium

# 2. start Juice Shop (pinned image) and wait until healthy
npm run app:up
npm run app:wait

# 3. run the suite
npm test
```

Tear down the app with `npm run app:down`.

## Running subsets

```bash
npm run test:smoke        # @smoke — the "is the store working?" subset (14)
npm run test:regression   # full regression (54)
npm run test:api          # API contract suites
npm run test:ui           # UI suites only
npm run test:chromium     # single engine (fast dev loop)
npm run test:firefox      # or :webkit — cross-browser
npx playwright test --grep @security   # documented vulnerability tests
npm run report            # open the last Playwright HTML report
```

> Tip: run `npm run app:reset` before a big local cross-browser run — Juice Shop
> product stock is finite and depletes across many order-placing runs (a fresh
> container re-seeds full stock; CI always starts fresh).

## Reports

- **Playwright HTML** — generated every run; `npm run report`.
- **Allure** (trend/history) — `npm run allure:serve` (needs a JRE). The nightly
  workflow publishes it to GitHub Pages:
  `https://tpqhuy.github.io/QA_Auto_Project_JuiceOWASP/`.

## Quality gates

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format:check
```

## Patterns worth a look

| Pattern                                   | Where                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| API-first auth + `storageState` injection | [`src/fixtures/auth.fixture.ts`](src/fixtures/auth.fixture.ts)                         |
| Page Object Model                         | [`src/pages/basket.page.ts`](src/pages/basket.page.ts)                                 |
| UI action → API verify                    | [`tests/ui/basket/basket.spec.ts`](tests/ui/basket/basket.spec.ts)                     |
| Full E2E purchase journey                 | [`tests/e2e/purchase-journey.spec.ts`](tests/e2e/purchase-journey.spec.ts)             |
| Multi-step checkout POM                   | [`src/pages/checkout/`](src/pages/checkout/)                                           |
| Schema (contract) validation              | [`src/api/schemas.ts`](src/api/schemas.ts)                                             |
| Data factories                            | [`src/data/factories/`](src/data/factories/)                                           |
| CI (smoke on push)                        | [`.github/workflows/smoke.yml`](.github/workflows/smoke.yml)                           |
| CI (nightly cross-browser + Allure)       | [`.github/workflows/nightly-regression.yml`](.github/workflows/nightly-regression.yml) |

## Documentation

- [Test Strategy](docs/test-strategy.md) — scope, risk-based prioritisation, design decisions (interview Q&A).
- [Exploratory Notes](docs/exploratory-notes.md) — ground-truth selectors, endpoints, and the app quirks the framework handles.
- [Test Cases & Traceability](docs/test-cases.md) — requirement → test case → spec matrix.
- [Bug Reports](docs/bug-reports/) — JIRA-style defect reports (severity/priority/steps/actual/expected) for issues found while testing.

## Possible extensions

- Profile management (change password / profile) coverage.
- Visual-regression and accessibility (axe) checks.
- Performance smoke (API latency budgets) wired into CI.
- Broader security suite (CSRF, JWT tampering, more injection points).

---

_OWASP Juice Shop is intentionally insecure software for security training. The
`@security` tests here document its known vulnerabilities for educational
purposes against a locally-run instance — they are not an attack on any
third-party system._
