# BUG-002 — Payment card rejected for any expiry year below 2080

| Field       | Value                                       |
| ----------- | ------------------------------------------- |
| ID          | BUG-002                                     |
| Type        | Functional / Validation                     |
| Severity    | Medium                                      |
| Priority    | P3                                          |
| Component   | Payment / Cards                             |
| Environment | OWASP Juice Shop v17.1.1 (Docker), REST API |
| Status      | Open                                        |

## Summary

`POST /api/Cards` rejects a card whose `expYear` is any realistic near-future
year (e.g. 2027) with `400 Validation error: Validation min on expYear failed`.
The card is only accepted when `expYear` is **≥ 2080**, an implausible minimum
that blocks all real cards.

## Preconditions

- A registered, authenticated user (valid bearer token).

## Steps to Reproduce

1. With a valid token, add a card expiring in a normal near-future year:
   ```bash
   curl -X POST http://localhost:3000/api/Cards -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"fullName":"A B","cardNum":"4111111111111111","expMonth":5,"expYear":2027}'
   ```
2. Repeat with `"expYear":2080`.

## Expected Result

A card with any valid future expiry year (e.g. 2027) is accepted (`201`).

## Actual Result

- `expYear: 2027` → `400 { "message": "Validation error: Validation min on expYear failed" }`
- `expYear: 2080` → `201 Created`

The `min` validator on `expYear` is set far in the future, rejecting all
plausible cards.

## Impact

No user with a real payment card (expiring within the normal ~10-year window)
can save it — checkout via a newly added card is effectively broken.

## Suggested Fix

Set the `expYear` minimum to the current year (and validate month/year against
the actual current date) rather than a fixed 2080.

## Automated coverage

`src/data/constants.ts` documents `MIN_CARD_EXP_YEAR = 2080`; `src/data/factories/card.factory.ts`
generates an accepted year so checkout tests can seed a card via the API.
