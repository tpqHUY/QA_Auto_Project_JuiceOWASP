# Flaky test policy

A flaky test — one that passes and fails without the code changing — is worse than no
test: it trains people to ignore red. This is how we keep the signal trustworthy.

## Principle

> **Quarantine fast, fix at the root, never "fix" with more retries.**

Retries hide flake; they don't remove it. Retries exist to survive rare
infrastructure blips, not to paper over a race condition.

## Lifecycle

```
detect ──▶ quarantine (@flaky) ──▶ root-cause (RCA) ──▶ fix at source ──▶ un-quarantine
```

1. **Detect.** A test fails intermittently (locally, or "passed on retry" in the CI
   report / Allure). Trust it once — investigate on the second occurrence.
2. **Quarantine — same day.** Add the `@flaky` tag and open a
   [🎲 Flaky test issue](../../.github/ISSUE_TEMPLATE/flaky_test.yml).

   ```ts
   test('the shaky one', { tag: ['@regression', '@flaky'] }, async () => {
     /* ... */
   });
   ```

   The CI gate excludes `@flaky` (`--grep-invert @flaky`), so it stops turning the
   pipeline red. It still runs — non-gating — in the nightly `flaky-watch` job, so we
   can watch whether it's still unstable.

3. **Root-cause.** Categorise it (see below). Reproduce with
   `npx playwright test <spec> --repeat-each=20` and read the trace (`trace: on-first-retry`).
4. **Fix at the source**, not with `waitForTimeout`.
5. **Un-quarantine.** Remove `@flaky`, re-run **3× green** (and cross-browser if it was
   engine-specific), close the issue.

## Root-cause categories (and the real fix)

| Category                | Typical cause                                    | Fix                                                    |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| Timing / missing wait   | Asserting before the UI settled                  | Web-first assertions / `locator.waitFor()` — no sleeps |
| Shared state / data     | Tests reusing an account or record               | Per-test data factory (parallel-safe)                  |
| App load / finite stock | Juice Shop stock depletes; load-induced timeouts | Fresh container (`app:reset`); worker cap; qty ≤ limit |
| Cross-browser timing    | Menu/redirect races on Firefox/WebKit            | Retry-until-visible helpers (e.g. `openAccountMenu`)   |
| Network / environment   | Transient connection blip                        | This is what the (small) retry budget is for           |

> Two of these are already battle-tested in this repo — a Firefox account-menu race and
> WebKit stock depletion — written up in the week-5 log and `docs/exploratory-notes.md`.

## Guardrails

- Retries: `1` local / `2` CI — kept low on purpose so flake stays visible.
- `@flaky` is a temporary state, not a resting place: a quarantine issue open **> 2
  sprints** is escalated (fix or delete the test — a permanently-quarantined test earns
  nothing).
- Track **flake rate** each sprint in [metrics](metrics.md).

## Commands

```bash
npm run test:quarantine                         # run only @flaky (the quarantine)
npx playwright test <spec> --repeat-each=20      # hunt intermittency
npx playwright test <spec> --repeat-each=20 --project=webkit
```
