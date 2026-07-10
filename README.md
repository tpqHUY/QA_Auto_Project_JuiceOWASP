# Juice Shop E2E — Playwright + TypeScript

End-to-end test automation framework for a **real dockerized e-commerce app**
([OWASP Juice Shop](https://github.com/juice-shop/juice-shop)), covering the core
customer journey across **UI and API** with the Page Object Model, API-first
setup, faker-based data factories, and schema-validated contract tests.

> **47 tests · fully parallel · ~14s wall-clock · 0 hard waits.**
> Tagged `@smoke` / `@regression` / `@api` / `@security` for CI selection.

---

## Why this project

It exercises the same skills a QA/QC automation role needs on day one:

- **Layered architecture** — POM + component objects + typed API clients + composable fixtures.
- **API-first testing** — authenticate over HTTP and inject session state so UI tests start where the actual test begins (the `storageState` technique).
- **UI action → API verify** — drive the browser, then read the REST API to prove the backend agrees (the modern stand-in for a DB check on an API-driven SPA).
- **Contract testing** — every API response validated against a `zod` schema, not just its status code.
- **Parallel-safe by construction** — per-test data factories mean zero shared state.
- **Security-aware** — documented `@security` tests for Juice Shop's intentional SQLi and IDOR flaws.

## Tech stack

| Concern | Choice |
|---|---|
| Runner / framework | Playwright Test + TypeScript |
| Test data | `@faker-js/faker` |
| Schema validation | `zod` |
| App under test | OWASP Juice Shop `v17.1.1` (Docker, pinned) |
| Quality gates | ESLint (flat config) + Prettier + `tsc --noEmit` |

## Architecture

```
                 ┌─────────────────────────────────────────────┐
   Specs ───────▶│  Page Objects (UI)      API Clients (HTTP)   │
 (tests/**)      │  src/pages/*            src/api/*            │
                 └───────────────┬─────────────────┬───────────┘
                                 │                 │
                         ┌───────▼─────────────────▼────────┐
                         │  Fixtures (composable chain)      │
                         │  page(+banners) → user/address/   │
                         │  card → api clients → session →   │
                         │  loggedInPage (token injection)   │
                         └───────────────┬───────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  OWASP Juice Shop    │
                              │  (Docker :3000)      │
                              └──────────────────────┘
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
tests/
├── ui/          # auth, catalog, basket UI suites
├── api/         # auth, products, basket contract suites
└── security/    # documented SQLi / IDOR smoke tests
docs/            # test-strategy · exploratory-notes · test-cases (traceability)
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
npm run test:smoke        # @smoke — the "is the store working?" subset (12)
npm run test:regression   # full regression (47)
npm run test:api          # API contract suites
npm run test:ui           # UI suites only
npx playwright test --grep @security   # documented vulnerability tests
npm run report            # open the last HTML report
```

## Quality gates

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format:check
```

## Patterns worth a look

| Pattern | Where |
|---|---|
| API-first auth + `storageState` injection | [`src/fixtures/auth.fixture.ts`](src/fixtures/auth.fixture.ts) |
| Page Object Model | [`src/pages/basket.page.ts`](src/pages/basket.page.ts) |
| UI action → API verify | [`tests/ui/basket/basket.spec.ts`](tests/ui/basket/basket.spec.ts) |
| Schema (contract) validation | [`src/api/schemas.ts`](src/api/schemas.ts) |
| Data factories | [`src/data/factories/`](src/data/factories/) |

## Documentation

- [Test Strategy](docs/test-strategy.md) — scope, risk-based prioritisation, design decisions (interview Q&A).
- [Exploratory Notes](docs/exploratory-notes.md) — ground-truth selectors, endpoints, and the app quirks the framework handles.
- [Test Cases & Traceability](docs/test-cases.md) — requirement → test case → spec matrix.

## Roadmap

- [x] **Weeks 1–3:** framework, POM + fixtures + API clients, auth/catalog/basket UI + API suites, tagging, docs.
- [ ] **Week 4:** checkout (address/delivery/payment) + full purchase-journey E2E; GitHub Actions smoke pipeline.
- [ ] **Week 5:** Allure reporting, nightly cross-browser regression, report published to GitHub Pages.
- [ ] **Week 6:** README polish (GIF demo), sample bug reports, expanded `@security` layer.

---

*OWASP Juice Shop is intentionally insecure software for security training. The
`@security` tests here document its known vulnerabilities for educational
purposes against a locally-run instance — they are not an attack on any
third-party system.*
