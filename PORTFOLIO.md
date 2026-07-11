# E2E Test Automation Framework — OWASP Juice Shop

> **Playwright + TypeScript** test automation framework for a real, dockerized
> e-commerce application. UI + API coverage, API-first setup, CI/CD on GitHub
> Actions, and public Allure reports.

**Role:** QA Automation Engineer (solo) · **Type:** Personal practice / portfolio project

🔗 **Repo:** https://github.com/tpqHUY/QA_Auto_Project_JuiceOWASP
📊 **Live report:** https://tpqhuy.github.io/QA_Auto_Project_JuiceOWASP/ _(Allure, published by nightly CI)_

---

## One-line pitch

Designed and built a layered E2E automation framework covering **54 UI, API &
security test cases** for OWASP Juice Shop, running **fully parallel across three
browser engines (162 runs)** and wired to a **GitHub Actions CI/CD pipeline**
with cross-browser nightly regression and auto-published Allure reports.

---

## Highlights (metrics that matter)

| Metric               | Value                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Automated test cases | **54** (UI + API + security), 162 runs across 3 engines               |
| Execution            | Fully parallel — **~15 s** (chromium) / **~1.6 min** (cross-browser)  |
| Hard waits (`sleep`) | **0** — Playwright auto-waiting / web-first assertions only           |
| Browsers             | Chromium · Firefox · WebKit (nightly matrix)                          |
| Contract tests       | Every API response validated against a **`zod` schema**               |
| CI                   | Smoke on every push/PR · nightly cross-browser regression             |
| Reporting            | Playwright HTML + **Allure**, published to GitHub Pages               |
| Test data            | 100% dynamic (faker factories) — **no hardcoded data**, parallel-safe |

---

## What the framework covers

- **Auth** — register (valid, duplicate email, invalid email, password mismatch, security question), login (valid/invalid/unknown, form validation), logout, forgot-password (reset + wrong-answer).
- **Catalog & Search** — search hit/miss, product-detail dialog, pagination.
- **Basket** — add / increase / decrease / remove, total-price calculation, persistence across reload, add-same-product-twice.
- **Checkout** — add/select address → delivery method → payment → place order + order confirmation, verified against the order history API.
- **API contract suites** — auth, products, basket, address/card/order: status codes + body + `zod` schema assertions, token handling, negative/authorization cases.
- **E2E purchase journey** — guest → register → search → add to basket → full checkout → **verify order via API**.
- **Security smoke (`@security`)** — documented SQLi, IDOR, DOM XSS and sensitive-directory findings against Juice Shop's intentional vulnerabilities, each cross-referenced to a JIRA-style bug report.

---

## Engineering decisions worth discussing

These are the "why" answers that hold up in an interview:

- **Layered architecture** — Page Objects + component objects + typed API clients + composable Playwright fixtures. Tests read like business specs, not selector soup.
- **API-first setup (`storageState`)** — authenticate over HTTP and inject the session token/basket-id into browser storage, so UI tests start _where the actual test begins_ instead of re-driving the login form every time. Faster and far less flaky.
- **UI action → API verify** — drive the browser, then read the REST API to prove the backend state agrees. The modern stand-in for a DB check on an API-driven SPA (Juice Shop uses an embedded SQLite that can't be inspected externally).
- **Contract testing with `zod`** — assert response _shape_, not just `200 OK`, catching backend contract drift.
- **Parallel-safe by construction** — every test generates its own user/address/card via faker factories → zero shared state → safe to fan out.
- **Tag-driven CI** — `@smoke` / `@regression` / `@api` / `@security` let the pipeline pick the right subset per trigger.

---

## Tech stack

| Concern           | Choice                                           |
| ----------------- | ------------------------------------------------ |
| Runner / language | Playwright Test + TypeScript                     |
| Test data         | `@faker-js/faker`                                |
| Schema validation | `zod`                                            |
| App under test    | OWASP Juice Shop `v17.1.1` (Docker, pinned)      |
| CI/CD             | GitHub Actions (smoke + nightly regression)      |
| Reporting         | Playwright HTML + Allure → GitHub Pages          |
| Quality gates     | ESLint (flat config) + Prettier + `tsc --noEmit` |

---

## Deliverables

- ✅ 54 automated tests (UI + API + security), stable and parallel across 3 browsers.
- ✅ CI/CD: smoke pipeline on push/PR; nightly cross-browser regression.
- ✅ Public Allure report on GitHub Pages.
- ✅ Docs: risk-based **test strategy**, **test-case traceability matrix** (requirement → case → spec), **exploratory notes**, and 5 **bug reports** (JIRA-style: severity/priority/steps/actual/expected).
- ✅ One-command local setup via Docker Compose.

---

## CV bullet points (copy-paste ready)

- Designed and built an E2E test automation framework (**Playwright + TypeScript**) for a dockerized e-commerce application, covering **54 UI/API/security test cases** across auth, catalog, basket, and checkout flows, running fully parallel across **Chromium/Firefox/WebKit**.
- Implemented **API-first test setup** (authentication via API + `storageState` reuse) and **faker-based data factories**, enabling fully parallel execution with **zero hardcoded data** and **no hard waits**.
- Built **GitHub Actions CI/CD** pipelines: smoke suite on every push and nightly cross-browser regression with **Allure reports auto-published to GitHub Pages**.
- Applied **contract testing** (`zod` schema validation) and a **UI-action → API-verify** pattern to assert backend state on an API-driven SPA.
- Authored a **risk-based test strategy**, **traceable test-case documentation**, and JIRA-style **bug reports**; added documented **security tests** (SQLi / IDOR / XSS) leveraging OWASP Juice Shop.

---

## Interview talking points (STAR-ready)

- _"Why fixtures instead of `beforeEach`?"_ — composable dependency chain, lazy per-test data, no shared mutable state.
- _"How do you handle flaky tests?"_ — auto-waiting only (no `sleep`), per-test isolated data, worker cap for the single-container backend, trace-on-retry for debugging.
- _"Why log in via API?"_ — speed + isolation; UI login is tested explicitly in _one_ place, not paid for in every spec.
- _"How do you verify without DB access?"_ — API-level state check after UI actions.

---

_OWASP Juice Shop is intentionally insecure software built for security training.
The `@security` tests here document its known vulnerabilities for educational
purposes against a locally-run instance — not an attack on any third-party system._
