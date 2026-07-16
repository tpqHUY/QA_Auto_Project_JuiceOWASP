import { defineConfig } from 'vitest/config';

/**
 * Vitest runs the framework's *own* unit tests — pure helpers and data factories
 * in `src/` — separately from the Playwright E2E/API/UI suite.
 *
 * These live under `tests/unit/` and are excluded from Playwright via `testIgnore`
 * in playwright.config.ts, so the two runners never fight over the same files.
 */
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
