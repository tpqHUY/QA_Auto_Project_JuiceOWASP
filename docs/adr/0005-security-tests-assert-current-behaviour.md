# 5. Security/a11y tests assert current behaviour, with documented findings

Date: 2026-07-16

## Status

Accepted

## Context

OWASP Juice Shop is _intentionally_ vulnerable, and it is not fully accessible. A
naive security or a11y test that asserts the _secure/ideal_ outcome would be
permanently red, which is useless as a CI signal. But simply not testing those
areas hides them. We want honest, green, informative tests — and to demonstrate
security- and accessibility-minded test design without writing attack tooling.

## Decision

For known-vulnerable or known-inaccessible behaviour, tests assert the app's
**current** behaviour and document the secure expectation in a `FINDING:` comment.
Examples:

- SQLi login returns `200` today → assert `200`, comment that a secure app must
  return `401`.
- The login form has an unlabelled field (axe `label`, critical) → assert the
  finding is present, comment that a hardened app must fix it.

Where the app _does_ behave securely, we assert the secure outcome as a real guard
(e.g. a tampered JWT must be rejected; no _new_ critical a11y issue may appear).
All such specs run only against the locally-owned training app.

## Consequences

- The suite stays green and trustworthy while still surfacing every finding.
- A future fix flips a documented FINDING test red — a signal to update it to the
  now-secure assertion.
- Allure **categories** classify failures (product defect vs test defect vs
  infra/timeout) so triage is fast (see `allure/categories.json`).
- Clear ethical boundary: assert-and-document, never weaponise.
