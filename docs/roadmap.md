# Roadmap — Future Enhancements

Ideas to grow the framework beyond its current state (67 tests · 3 browsers ·
a11y / performance / visual / unit · sharded CI/CD · Allure · risk-based docs).
This is **not a fixed timeline** — a menu of improvements grouped by theme, each
with rough **value** and **effort**, so the next step can be picked by goal.

> ✅ **The seven recommended next steps below are now implemented** — plus product
> reviews, an admin-role fixture, Dependabot, and pre-commit hooks. See the
> step-by-step write-up in [roadmap-implementation.md](./roadmap-implementation.md).

**Effort legend:** `S` ≤ ~half a day · `M` ~1–2 days · `L` ~3+ days.

---

## 1. Broaden functional coverage

| Enhancement                                                              | Value                                 | Effort |
| ------------------------------------------------------------------------ | ------------------------------------- | ------ |
| Profile management — change password, profile image, address-book CRUD   | Fills a P3 gap; more real user flows  | M      |
| Product reviews — add / read a review                                    | Common e-commerce flow, easy wins     | S      |
| Coupon / wallet / deluxe-membership flows                                | Money-adjacent logic worth asserting  | M      |
| Contact / complaint form validation                                      | Good negative/boundary practice       | S      |
| Order history detail + track-order UI                                    | Extends the checkout story end-to-end | S      |
| i18n / language-switch smoke                                             | Cheap breadth, catches layout breaks  | S      |
| Boundary & negative expansion (field limits, special chars, huge inputs) | Depth over breadth; strong QA signal  | S      |

## 2. New test types

| Enhancement                                                           | Value                                        | Effort |
| --------------------------------------------------------------------- | -------------------------------------------- | ------ |
| **Accessibility (a11y)** via `@axe-core/playwright` on key pages      | High signal, low effort — rare in portfolios | S      |
| **Visual regression** via `toHaveScreenshot()` on stable pages        | Catches UI drift; needs baseline management  | M      |
| **Performance smoke** — assert API latency budgets (e.g. `< 800ms`)   | Cheap perf guardrail in CI                   | S      |
| Web-vitals via Lighthouse CI on the SPA                               | Front-end perf coverage                      | M      |
| **Unit tests** (Vitest) for utils — `parsePrice`, factories, currency | Tests the framework's own logic              | S      |
| Mutation testing (Stryker) to measure suite _quality_, not just count | Proves tests actually catch bugs             | L      |

## 3. Deepen security testing

> See [docs/setup/security-testing.md](./setup/security-testing.md) for the how-to and safe templates.

| Enhancement                                                                    | Value                                       | Effort |
| ------------------------------------------------------------------------------ | ------------------------------------------- | ------ |
| Security headers · JWT-tampering-rejected · missing-token authz · no data leak | Rounds out OWASP coverage (A01/A02/A05/A07) | S each |
| `npm audit` (dependency scan) as a CI step                                     | Catches vulnerable packages (A06)           | S      |
| **OWASP ZAP baseline** (DAST) in nightly                                       | Automated dynamic scan alongside the suite  | M      |
| **CodeQL** (SAST) on the repo                                                  | Static analysis signal, free on GitHub      | S      |

## 4. CI/CD & scaling

| Enhancement                                                         | Value                                            | Effort |
| ------------------------------------------------------------------- | ------------------------------------------------ | ------ |
| **Test sharding** (`--shard`) across parallel runners               | Faster nightly as the suite grows                | S      |
| Expand matrix — Node versions, **mobile device emulation** projects | Broader compatibility signal                     | S      |
| **PR comment** with pass/fail summary + report link                 | Reviewer sees results without leaving the PR     | M      |
| Flaky detection — report retries, quarantine with a `@flaky` tag    | Keeps signal trustworthy                         | M      |
| Nightly-failure **notification** (Slack / Teams / email)            | Closes the feedback loop                         | S      |
| **Renovate / Dependabot** + pinned-image bump PRs                   | Keeps deps & Juice Shop image current, safely    | S      |
| Upgrade guard — run against 2 Juice Shop tags                       | Catches breakage before bumping the pinned image | M      |

## 5. Reporting & quality signals

| Enhancement                                                          | Value                             | Effort |
| -------------------------------------------------------------------- | --------------------------------- | ------ |
| Allure **categories** (product bug vs test defect), severity, owners | Richer, triage-ready report       | S      |
| Pass-rate / duration **trend** surfaced as a badge or dashboard      | Quality-over-time signal          | M      |
| Annotate known-issues and link them to `docs/bug-reports/`           | Traceability from report → ticket | S      |

## 6. Framework & developer experience

| Enhancement                                                       | Value                                        | Effort |
| ----------------------------------------------------------------- | -------------------------------------------- | ------ |
| **Admin-role fixture** + role-based test data                     | Unlocks admin-only flows & authz tests       | S      |
| **Pre-commit hooks** (husky + lint-staged: lint/format/typecheck) | Stops bad commits at the source              | S      |
| Generate API client/types from an OpenAPI spec (if available)     | Less hand-written client, fewer drifts       | M      |
| **Contribution guide** + ADRs (architecture decision records)     | Shows engineering maturity                   | S      |
| Env matrix doc (local / staging via `BASE_URL`)                   | Makes the suite portable across environments | S      |

---

## Recommended next steps (best value-to-effort first)

> 📘 Step-by-step how-to for each of these (install, steps, code skeletons, done-criteria): [docs/setup/practice-guide.md](./setup/practice-guide.md).

1. **Accessibility (axe)** — `S`, high signal, quick to add on key pages.
2. **`npm audit` + CodeQL in CI** — `S`, instant security/quality signal, free.
3. **Two new `@security` tests** (JWT-tampering-rejected, security headers) — `S`, deepens OWASP coverage.
4. **Test sharding** — `S`, keeps the nightly fast as coverage grows.
5. **Profile-management coverage** — `M`, closes the last core functional gap.
6. **Visual regression** on 2–3 stable pages — `M`, catches UI drift.
7. **OWASP ZAP baseline** in nightly — `M`, automated DAST layer.

> Principle for every addition: keep it **parallel-safe** (per-test data), **no hard
> waits** (web-first only), **tagged** for CI selection, and **documented** — the
> same standards the existing suite holds itself to (see [test-strategy.md](./test-strategy.md)).
