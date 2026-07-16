import { test, expect } from '../../src/fixtures/index.js';
import { ROUTES } from '../../src/data/constants.js';

/**
 * Visual regression — pixel-compares stable pages against a committed baseline to
 * catch unintended UI drift (broken layout, missing element, restyle).
 *
 * IMPORTANT — cross-OS baselines: screenshots differ by OS/renderer, so baselines
 * are OS-specific (Playwright suffixes them, e.g. `-win32`/`-linux`). These tests
 * are tagged **@visual only** (not @regression), so the CI smoke/nightly greps skip
 * them; they are meant to run locally, or in CI only once Linux baselines are
 * generated in the Docker image. Update intentionally with `--update-snapshots`.
 */
test.describe('Visual regression @visual', () => {
  // Baselines are committed for chromium only — skip on other engines so the full
  // `npm test` run stays green. Generate per-engine baselines to enable them.
  // eslint-disable-next-line playwright/no-skipped-test -- intentional: cross-OS/engine baselines not committed
  test.skip(({ browserName }) => browserName !== 'chromium', 'chromium-only baselines');

  test('login page matches baseline', { tag: ['@visual'] }, async ({ page }) => {
    await page.goto(ROUTES.login);
    await page.locator('#email').waitFor();
    await expect(page).toHaveScreenshot('login.png', { maxDiffPixelRatio: 0.02 });
  });

  test('registration page matches baseline', { tag: ['@visual'] }, async ({ page }) => {
    await page.goto(ROUTES.register);
    await page.locator('#emailControl').waitFor();
    await expect(page).toHaveScreenshot('register.png', { maxDiffPixelRatio: 0.02 });
  });
});
