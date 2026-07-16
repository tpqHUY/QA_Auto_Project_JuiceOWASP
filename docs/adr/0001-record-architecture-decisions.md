# 1. Record architecture decisions

Date: 2026-07-16

## Status

Accepted

## Context

The framework makes several non-obvious design choices (fixture chaining, API-first
setup, per-test data, how security tests assert). New readers — and future me —
need to know _why_ those choices were made, not just _what_ the code does. Code
comments explain the local "what"; they don't hold the trade-offs behind a
structural decision.

## Decision

We will keep Architecture Decision Records in `docs/adr/`, one file per decision,
using the Nygard template (Context → Decision → Consequences). Each is numbered and
listed in `docs/adr/README.md`. ADRs are immutable once accepted; a later decision
supersedes an earlier one rather than editing it.

## Consequences

- The reasoning behind the framework is discoverable in one place.
- Reviewers can challenge a _decision_, not just a diff.
- A small ongoing cost: a structural change should come with an ADR.
