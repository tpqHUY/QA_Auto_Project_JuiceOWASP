<!-- Keep PRs small and focused — one ticket per PR. -->

## What & why

<!-- What does this PR change, and which ticket does it close? -->

Closes #

## Type

- [ ] New/updated test coverage (`type/feature-test`)
- [ ] Bug fix + regression test (`type/bug`)
- [ ] Flaky fix / quarantine (`type/flaky`)
- [ ] Maintenance / tech-debt (`type/tech-debt`)
- [ ] Docs

## How to verify

<!-- Commands a reviewer can run, e.g. `npm run test:api -- --grep @regression`. -->

```bash

```

## Checklist (Definition of Done)

- [ ] Follows the test rules: per-test data (parallel-safe), **no hard waits**, tagged for CI
- [ ] `npm run typecheck && npm run lint && npm run test:unit` pass
- [ ] Relevant suite green locally (chromium) and CI is green
- [ ] Test cases / traceability updated (`docs/test-cases.md`) if coverage changed
- [ ] Bug: a regression test locks the fix · Flaky: root-caused, not just retried
- [ ] Docs updated (README/counts, ADR if a structural decision)

## Evidence

<!-- Screenshots, Allure link, or notes. -->
