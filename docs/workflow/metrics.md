# Quality metrics

What we track each sprint to show quality **over time**, not just a snapshot. Numbers
come from the Playwright/Allure reports and the issue board — keep them honest.

## What we track

| Metric               | Definition                                    | Why                           |
| -------------------- | --------------------------------------------- | ----------------------------- |
| **Pass rate**        | passed / total on the nightly (all engines)   | Overall health                |
| **Flake rate**       | tests that passed only on retry / total runs  | Signal trustworthiness        |
| **Open `@flaky`**    | count of quarantined tests                    | Debt that erodes coverage     |
| **Bugs found/fixed** | issues opened vs closed this sprint           | Throughput + defect discovery |
| **Coverage added**   | new test cases (and requirements) this sprint | Progress on the backlog       |
| **MTTR (bug)**       | median time from bug opened → fix verified    | Responsiveness                |
| **Suite duration**   | wall-clock (chromium; nightly cross-browser)  | Keep feedback fast            |

## How to read them off the tools

- **Pass / flake / duration** — the Allure trend report (nightly → GitHub Pages) and
  the Playwright HTML report (which flags tests that "passed on retry").
- **Bugs / coverage / MTTR** — the GitHub issue board (filter by milestone + label).

## Sprint log (fill in each sprint)

| Sprint | Dates | Pass rate | Flake rate | Open @flaky | Bugs (found/fixed) | New tests | Notes                            |
| ------ | ----- | --------- | ---------- | ----------- | ------------------ | --------- | -------------------------------- |
| 01     | TBD   | —         | —          | 0           | —                  | —         | baseline: 67 regression + 9 unit |

> Baseline at the start of this phase (commit `25a1d1c`): **67** `@regression` × 3
> engines · **9** unit · **7** security · **2** a11y · **2** performance · **2** visual.
> 0 known flaky.
