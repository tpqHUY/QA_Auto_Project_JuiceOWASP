# 3. API-first setup with injected `storageState`

Date: 2026-07-16

## Status

Accepted

## Context

Most UI tests need an authenticated user, but they are not testing the login form.
Driving registration + login through the UI for every test is slow (seconds per
test) and is a common source of flake — an unrelated login hiccup fails a basket
test.

## Decision

Set up state over the **API first**, then inject it into the browser:

- `session` registers + logs in a user via HTTP (`AuthApi`), returning a validated
  token + basket id.
- `loggedInPage` reuses that session by writing the token to `localStorage` + a
  cookie and the basket id to `sessionStorage` (via `addCookies` +
  `addInitScript`), so the page starts already authenticated — no UI login.
- The UI login form still has its own dedicated tests; it just isn't a dependency
  of every other test.

## Consequences

- Dramatically faster, more stable setup (HTTP call vs full form drive).
- Auth is exercised deliberately in its own specs, not incidentally everywhere.
- Setup depends on knowing the app's storage keys — captured in
  `src/data/constants.ts` (`STORAGE`) and confirmed via probe.
- The same API clients used for setup double as the surface for API tests.
