import dotenv from 'dotenv';

dotenv.config();

/**
 * Single source of truth for environment configuration.
 * Keeping this in one place means switching targets (local Docker, CI, a staging
 * URL) is one env var — no code changes, no scattered `process.env` reads.
 */
export const env = {
  /** Base URL of the Juice Shop instance under test. */
  baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  /** True when running inside CI (GitHub Actions sets CI=true). */
  isCI: !!process.env.CI,
} as const;
