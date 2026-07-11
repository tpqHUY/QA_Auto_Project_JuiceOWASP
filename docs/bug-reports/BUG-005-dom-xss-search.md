# BUG-005 — DOM XSS via the product search query

| Field       | Value                                     |
| ----------- | ----------------------------------------- |
| ID          | BUG-005                                   |
| Type        | Security (DOM-based Cross-Site Scripting) |
| Severity    | High                                      |
| Priority    | P1                                        |
| Component   | Search                                    |
| Environment | OWASP Juice Shop v17.1.1 (Docker), UI     |
| Status      | Open (intentional in Juice Shop)          |

## Summary

The search feature renders the user-supplied query into the "Search Results"
heading as raw HTML (unsanitised). A crafted query injects arbitrary markup into
the DOM — e.g. a `javascript:` iframe — resulting in DOM-based XSS.

## Preconditions

- Juice Shop reachable at `http://localhost:3000`.

## Steps to Reproduce

1. Navigate to:
   ```
   http://localhost:3000/#/search?q=<iframe src="javascript:alert(`xss`)">
   ```
   (or type the payload into the search box).

## Expected Result

The query is HTML-escaped and shown as plain text; no markup is injected.

## Actual Result

The raw payload is inserted into the page as HTML — an iframe with a
`javascript:` source appears in the DOM and its script context executes:

```js
document.querySelectorAll('iframe[src^="javascript:"]').length === 1; // true
```

## Impact

Attacker-controlled script execution in a victim's browser via a crafted link
(session theft, actions on behalf of the user, etc.).

## Suggested Fix

Escape/encode the query before rendering; never bind untrusted input as HTML
(avoid `bypassSecurityTrustHtml` on user input). Add a Content-Security-Policy.

## Automated coverage

`tests/security/security.spec.ts` — "DOM XSS: the search query is rendered
without sanitisation" (asserts a `javascript:` iframe is injected).
