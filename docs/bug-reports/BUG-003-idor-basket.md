# BUG-003 — IDOR: a user can read another user's basket

| Field       | Value                                               |
| ----------- | --------------------------------------------------- |
| ID          | BUG-003                                             |
| Type        | Security (Broken Object-Level Authorization / IDOR) |
| Severity    | Critical                                            |
| Priority    | P1                                                  |
| Component   | Basket / Authorization                              |
| Environment | OWASP Juice Shop v17.1.1 (Docker), REST API         |
| Status      | Open (intentional in Juice Shop)                    |

## Summary

`GET /rest/basket/{id}` returns any basket by id without checking that the
basket belongs to the authenticated user. An authenticated user can read another
user's basket contents by guessing/enumerating the numeric basket id — a classic
Insecure Direct Object Reference (IDOR).

## Preconditions

- Two registered users: A (attacker) and B (victim), each with a token.
- User B has at least one item in their basket (basket id `bidB`).

## Steps to Reproduce

1. As user B, add an item so basket `bidB` has contents.
2. As user A, request user B's basket using **A's** token:
   ```bash
   curl "http://localhost:3000/rest/basket/<bidB>" -H "Authorization: Bearer <tokenA>"
   ```

## Expected Result

`401 Unauthorized` or `403 Forbidden` — a user may only read their own basket.

## Actual Result

`200 OK` with user B's full basket contents (products + quantities) disclosed to
user A.

## Impact

Confidential disclosure of other users' basket data; the numeric, sequential
basket ids make enumeration trivial. Broken object-level authorization.

## Suggested Fix

Authorize every basket read against the authenticated user's own basket id;
reject requests for baskets the caller does not own.

## Automated coverage

`tests/security/security.spec.ts` — "IDOR: an authenticated user can read
another user's basket" (asserts the current `200`, documenting the finding).
