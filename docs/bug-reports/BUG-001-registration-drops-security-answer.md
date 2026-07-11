# BUG-001 — Registration API silently discards the security answer

| Field       | Value                                       |
| ----------- | ------------------------------------------- |
| ID          | BUG-001                                     |
| Type        | Functional                                  |
| Severity    | High                                        |
| Priority    | P2                                          |
| Component   | Auth / Registration                         |
| Environment | OWASP Juice Shop v17.1.1 (Docker), REST API |
| Status      | Open                                        |

## Summary

Creating a user through `POST /api/Users` with a `securityQuestion` and
`securityAnswer` in the body returns `201 Created`, but the security answer is
**not persisted**. As a result the account has no security answer on record and
**password recovery is impossible** for accounts created this way — the
forgot-password flow can never match an answer.

## Preconditions

- Juice Shop reachable at `http://localhost:3000`.

## Steps to Reproduce

1. Register a user with a security question + answer:
   ```bash
   curl -X POST http://localhost:3000/api/Users -H "Content-Type: application/json" \
     -d '{"email":"bug001@test.local","password":"Passw0rd!123","passwordRepeat":"Passw0rd!123","securityQuestion":{"id":1},"securityAnswer":"Smith"}'
   # -> 201 Created
   ```
2. Query the account's security question:
   ```bash
   curl "http://localhost:3000/rest/user/security-question?email=bug001@test.local"
   ```

## Expected Result

The lookup returns the account's security question (the answer association was
saved), so password recovery can proceed.

## Actual Result

The lookup returns `{}` — no security question/answer is associated with the
user. Password recovery cannot be completed for this account.

## Root cause (observed)

`POST /api/Users` ignores the `securityAnswer`; the association must be created
via a separate `POST /api/SecurityAnswers` call. The single-call registration
therefore produces an unrecoverable account.

## Impact

Users registered via the API (or any client that doesn't make the second call)
are permanently locked out if they forget their password. Silent data loss with
no error surfaced to the caller.

## Suggested Fix

Persist the security answer within the `POST /api/Users` transaction, or return
an error if it cannot be saved (fail loud, not silent).

## Automated coverage

`src/api/auth.api.ts` (`AuthApi.register`) works around this by also calling
`POST /api/SecurityAnswers`; `tests/ui/auth/forgot-password.spec.ts` verifies
recovery works only once the answer is actually persisted.
