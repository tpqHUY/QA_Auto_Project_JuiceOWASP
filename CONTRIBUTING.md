# Contributing

Thanks for taking a look. This is a Playwright + TypeScript E2E automation
framework for OWASP Juice Shop. The notes below keep every addition consistent
with the standards the suite already holds itself to.

## Prerequisites

- **Node.js** ≥ 18 (CI uses 20)
- **Docker** (runs the Juice Shop app under test)
- **Java (JRE)** — only needed to generate Allure reports locally

## Getting started

```bash
npm ci                       # install dependencies (also sets up git hooks)
npx playwright install       # download browser binaries
npm run app:up               # start Juice Shop in Docker
npm run app:wait             # wait until it is healthy
npm test                     # run the whole Playwright suite
```

Useful scripts:

| Script                     | What it does                                 |
| -------------------------- | -------------------------------------------- |
| `npm test`                 | Full Playwright suite (all projects)         |
| `npm run test:smoke`       | `@smoke` subset on chromium                  |
| `npm run test:regression`  | `@regression` subset, all browsers           |
| `npm run test:api`         | API specs only                               |
| `npm run test:security`    | `@security` specs                            |
| `npm run test:a11y`        | Accessibility (axe) specs                    |
| `npm run test:performance` | API latency-budget specs                     |
| `npm run test:visual`      | Visual regression (chromium; see note below) |
| `npm run test:unit`        | Vitest unit tests for framework helpers      |
| `npm run typecheck`        | `tsc --noEmit`                               |
| `npm run lint`             | ESLint                                       |
| `npm run format`           | Prettier write                               |
| `npm run allure:generate`  | Build the Allure report (with categories)    |

## Project layout

```
src/
  api/         API clients (BaseApi + auth/product/basket/…)
  pages/       Page Objects + components
  fixtures/    Composable Playwright fixtures (test-data → auth)
  data/        constants, types, faker factories
  utils/       currency, env, logger
tests/
  api/ ui/ e2e/ security/ a11y/ performance/ visual/   Playwright specs
  unit/                                                 Vitest specs
docs/          strategy, setup guides, ADRs, bug reports
```

## The rules every test follows

These are non-negotiable — they are why the suite runs fast, in parallel, and
without flake:

1. **Per-test data (parallel-safe).** Build data with the factories in
   `src/data/factories`; never share accounts or baskets between tests.
2. **No hard waits.** Use web-first assertions and locator waits — never
   `waitForTimeout`/`sleep`.
3. **Tag for CI selection.** Add `@smoke` and/or `@regression`, plus a type tag
   (`@api`, `@security`, `@a11y`, `@performance`, `@visual`) so the workflows can
   pick the right subset.
4. **Prefer "action → verify real state".** Drive the UI (or API), then confirm
   the effect through the API or a re-read — not just a visible toast.
5. **Document findings.** Security/a11y tests assert the app's _current_ behaviour
   and state the secure expectation in a `FINDING:` comment (see
   [docs/setup/security-testing.md](docs/setup/security-testing.md)).

## Adding a test — checklist

1. Branch: `git checkout -b feat/<short-name>`.
2. Probe first if you need a new selector/endpoint — don't guess.
3. Write the code following the patterns already in that folder.
4. Run it green locally: `npm run app:reset && npx playwright test <spec> --project=chromium`.
5. Quality gate: `npm run typecheck && npm run lint && npm run format`.
6. Commit (the pre-commit hook runs `lint-staged` on staged files).
7. Push and check CI (Actions) is green.

## Visual regression note

Screenshots are OS-specific, so baselines are committed per-OS (Playwright
suffixes them, e.g. `-win32`). Visual specs are tagged `@visual` **only** so the
CI smoke/nightly greps skip them. To regenerate baselines intentionally:
`npm run test:visual:update`.

## Architecture decisions

Significant design choices are recorded as ADRs in
[docs/adr/](docs/adr/). Read those to understand _why_ the framework is shaped the
way it is before making structural changes.
