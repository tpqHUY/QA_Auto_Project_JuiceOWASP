# Backlog (seed)

A starter backlog so the board isn't empty on day one. **File each row as a GitHub
Issue** using the matching template, add it to the Project board, and pull items into a
sprint milestone. Once filed, the issues — not this file — are the source of truth; keep
this as the origin list.

Effort: `S` ≤ half a day · `M` ~1–2 days · `L` ~3+ days.

## Feature coverage — untested Juice Shop flows (`type/feature-test`)

Each is a "PM handed you a feature" ticket: requirements → test cases → automate.

| #   | Feature / flow                                   | Priority | Effort | Notes                                              |
| --- | ------------------------------------------------ | -------- | ------ | -------------------------------------------------- |
| 1   | Contact / complaint form (rating + captcha)      | P1       | S      | Good negative/boundary practice                    |
| 2   | Order history + track-order UI                   | P1       | S      | Extends the checkout story; API already has hooks  |
| 3   | Address-book CRUD via UI                         | P2       | M      | `AddressApi` exists — add POM + UI→API verify      |
| 4   | Payment methods — add / delete card (UI)         | P2       | S      | Mind the `expYear`/leading-zero quirks             |
| 5   | Wallet — top up + pay with wallet                | P2       | M      | Money-adjacent logic worth asserting               |
| 6   | Coupon / discount at checkout                    | P2       | M      | Verify total math with a coupon                    |
| 7   | Deluxe membership upgrade                        | P3       | M      | Role/entitlement change — pairs with admin fixture |
| 8   | Change email (profile)                           | P2       | S      | Completes profile-management coverage              |
| 9   | i18n / language-switch smoke                     | P3       | S      | Cheap breadth; catches layout breaks               |
| 10  | Two-Factor Authentication (setup + login)        | P3       | M      | Security-relevant flow                             |
| 11  | Data-export / privacy request                    | P3       | S      | GDPR-style flow                                    |
| 12  | Boundary & negative expansion (register/contact) | P2       | S      | Field limits, special chars, huge inputs           |

## Bugs to formalise (`type/bug`)

Findings already surfaced by the suite — write them up as issues + `docs/bug-reports/`
entries so they're tracked, not just asserted in a test.

| #   | Bug                                                   | Severity | Regression test (exists)                                   |
| --- | ----------------------------------------------------- | -------- | ---------------------------------------------------------- |
| A   | Login form has an unlabelled control (a11y, critical) | S2       | `tests/a11y/a11y.spec.ts`                                  |
| B   | Missing `Content-Security-Policy` + HSTS headers      | S2       | `tests/security/security.spec.ts`                          |
| C   | SQLi auth bypass / IDOR / DOM-XSS / `/ftp` exposure   | S1       | `tests/security/security.spec.ts` (+ existing bug reports) |

## Maintenance & tech-debt (`type/tech-debt`)

| #   | Task                                                     | Priority | Notes                                       |
| --- | -------------------------------------------------------- | -------- | ------------------------------------------- |
| M1  | Review + merge the open **Dependabot** PRs (6 waiting)   | P1       | Small, reviewable; run CI before merge      |
| M2  | Enable **branch protection** on `main`                   | P0       | One-time — see [ways of working](README.md) |
| M3  | Bump pinned Juice Shop image (**upgrade guard**)         | P2       | Handle breakage like a production upgrade   |
| M4  | Verify **CodeQL** results + turn on Dependabot alerts UI | P2       | Security tab hygiene                        |
| M5  | PR-comment bot with pass/fail summary + report link      | P3       | Reviewer sees results in the PR             |

## How to file quickly

1. New issue → pick the template → paste the row's title/notes → set `priority/*` + `area/*`.
2. Add to the Project board (**Backlog** column).
3. At planning, drag 3–5 into the sprint milestone.
