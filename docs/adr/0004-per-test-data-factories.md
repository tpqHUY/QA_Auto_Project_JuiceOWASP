# 4. Per-test data via faker factories

Date: 2026-07-16

## Status

Accepted

## Context

Shared or fixed test data (a single "test user", a hard-coded email) forces tests
to run serially and creates order-dependent flake: test A logs out test B, or a
second run fails because the account already exists. We want the whole suite to run
`fullyParallel`.

## Decision

Every test builds the data it needs with **faker factories** in
`src/data/factories` (`makeUser`, `makeAddress`, `makeCard`). Each factory produces
a unique, valid record on every call (e.g. `makeUser` uses a time+random email) and
accepts `overrides` for negative/boundary cases.

## Consequences

- Tests own their data ⇒ no shared-state collisions ⇒ safe full parallelism.
- No cleanup step and no "reset the DB between tests" machinery.
- Determinism where it matters (e.g. known seeded products) is kept explicit in
  `constants.ts`, separate from the randomised per-test data.
- Uniqueness/validity of factories is itself unit-tested (`tests/unit`), since the
  whole strategy depends on it.
