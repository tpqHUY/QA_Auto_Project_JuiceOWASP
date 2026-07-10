/**
 * Single import surface for specs:
 *   import { test, expect } from '../../src/fixtures/index.js';
 *
 * Re-exports the fully-composed test (data + auth fixtures) so tests never need
 * to know how the fixture chain is wired together.
 */
export { test, expect } from './auth.fixture.js';
export type { DataFixtures } from './test-data.fixture.js';
export type { AuthFixtures } from './auth.fixture.js';
