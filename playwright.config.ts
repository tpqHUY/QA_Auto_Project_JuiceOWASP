import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Central Playwright configuration.
 *
 * Design notes (interview talking points):
 * - `fullyParallel` + per-test data factories → the whole suite runs in parallel safely.
 * - `trace: 'on-first-retry'` keeps runs fast but gives a full timeline to debug flaky failures.
 * - Browser matrix is expressed as projects so CI can run @smoke on chromium and the
 *   nightly regression across all three engines from the same config.
 */
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  // `tests/unit/**` holds Vitest specs (framework-logic unit tests). They are run
  // by Vitest (`npm run test:unit`), not Playwright, so keep the runner out of them.
  testIgnore: ['**/unit/**'],
  outputDir: './test-results',
  /* Fail fast in CI if someone leaves a test.only in the source. */
  forbidOnly: IS_CI,
  fullyParallel: true,
  retries: IS_CI ? 2 : 1,
  // Juice Shop is a single container backed by SQLite; too many concurrent
  // workers overwhelm it and cause load-induced timeouts (not real failures).
  // A modest cap keeps the suite parallel *and* stable, still well under 10 min.
  workers: IS_CI ? 2 : 4,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  /**
   * Reporters:
   * - `list` for live console output everywhere.
   * - `html` always generated (never auto-opens) — `npm run report`.
   * - `allure-playwright` emits `allure-results/`, turned into the public trend
   *   report published to GitHub Pages by the nightly workflow.
   * - `github` annotations only in CI.
   */
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        environmentInfo: {
          App: 'OWASP Juice Shop v17.1.1',
          Framework: 'Playwright + TypeScript',
          BaseURL: BASE_URL,
        },
      },
    ],
    ...(IS_CI ? [['github'] as const] : []),
  ],
  use: {
    baseURL: BASE_URL,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-test',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
