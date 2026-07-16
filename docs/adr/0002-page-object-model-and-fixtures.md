# 2. Page Object Model + composable fixtures

Date: 2026-07-16

## Status

Accepted

## Context

UI specs need selectors and interaction logic somewhere. Inlining them in tests
leads to duplication and brittle specs that break en masse when the UI changes.
Tests also need setup (a logged-in user, API clients) that should not be
copy-pasted.

## Decision

- **Page Objects** in `src/pages/` encapsulate selectors + actions for a page or
  component. Specs speak intent (`login.login(email, pw)`), not CSS.
- **Composable Playwright fixtures** in `src/fixtures/` provide setup as a
  two-layer chain: `test-data.fixture` (per-test `user`, a cookie-dismissed
  `page`) → `auth.fixture` (API clients + `session`/`adminSession`/`loggedInPage`).
  Tests declare what they need in the arguments and get it injected.

## Consequences

- Selector changes are fixed in one Page Object, not across many specs.
- Setup is declarative and shared without inheritance boilerplate.
- Fixtures compose: a new fixture builds on existing ones (e.g. `loggedInPage`
  builds on `session`), so capabilities stack cleanly.
- A learning curve for the fixture chain — mitigated by this ADR and comments in
  `auth.fixture.ts`.
