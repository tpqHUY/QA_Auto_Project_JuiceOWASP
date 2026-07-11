# BUG-004 — SQL injection in login bypasses authentication

| Field       | Value                                            |
| ----------- | ------------------------------------------------ |
| ID          | BUG-004                                          |
| Type        | Security (SQL Injection / Auth bypass)           |
| Severity    | Critical                                         |
| Priority    | P1                                               |
| Component   | Auth / Login                                     |
| Environment | OWASP Juice Shop v17.1.1 (Docker), REST API + UI |
| Status      | Open (intentional in Juice Shop)                 |

## Summary

The login endpoint concatenates the `email` field into a SQL query without
parameterisation. Submitting `' OR 1=1--` as the email (with any password)
returns `200` and issues a valid JWT — authenticating as the first user (admin)
without valid credentials.

## Preconditions

- Juice Shop reachable at `http://localhost:3000`.

## Steps to Reproduce

**API:**

```bash
curl -X POST http://localhost:3000/rest/user/login -H "Content-Type: application/json" \
  -d '{"email":"'"'"' OR 1=1--","password":"anything"}'
```

**UI:** open `/#/login`, enter email `' OR 1=1--`, any password, submit.

## Expected Result

`401 Unauthorized` — malformed/injected credentials must never authenticate.

## Actual Result

`200 OK` with `authentication.token` (a valid 3-part JWT); the UI logs in and
shows the account menu with Logout. Authentication is bypassed.

## Impact

Complete authentication bypass and account takeover (logs in as the first row,
typically the administrator). Highest-severity security defect.

## Suggested Fix

Use parameterised queries / an ORM binding for the login lookup; never build SQL
by string concatenation of user input.

## Automated coverage

`tests/security/security.spec.ts` — SQLi tests at both the API and the UI login
form (assert the current vulnerable `200`/logged-in state).
