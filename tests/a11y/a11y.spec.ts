import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../src/fixtures/index.js';
import { ROUTES } from '../../src/data/constants.js';

/**
 * Accessibility (a11y) tests using axe-core.
 *
 * Juice Shop is not fully accessible, so a blanket "zero violations" scan would be
 * permanently red. We use two complementary checks:
 *   1. A **regression guard** on the catalog — no critical violations *other than*
 *      the one already-documented finding (an unlabelled toolbar field). This
 *      still fails loudly if a NEW critical issue appears.
 *   2. A **documented finding** on the login page: the same unlabelled-field defect,
 *      asserted explicitly the way the security specs assert known vulnerabilities.
 */
const scan = (page: import('@playwright/test').Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

const criticalIds = (results: Awaited<ReturnType<typeof scan>>) =>
  results.violations.filter((v) => v.impact === 'critical').map((v) => v.id);

// Already-documented critical finding (see the login test) — allow-listed so the
// guard catches *new* regressions without going red on the known issue.
const KNOWN_CRITICAL = new Set(['label']);

test.describe('Accessibility (axe) @a11y', () => {
  test(
    'catalog page has no new critical a11y violations',
    { tag: ['@a11y', '@regression'] },
    async ({ page }) => {
      await page.goto(ROUTES.search);
      await page.locator('mat-grid-tile').first().waitFor();
      const unexpected = criticalIds(await scan(page)).filter((id) => !KNOWN_CRITICAL.has(id));
      expect(unexpected, `unexpected critical a11y rules: ${unexpected.join(', ')}`).toEqual([]);
    }
  );

  test(
    'login page has a known unlabelled-field a11y finding',
    { tag: ['@a11y', '@regression'] },
    async ({ page }) => {
      await page.goto(ROUTES.login);
      await page.locator('#email').waitFor();

      // FINDING: Juice Shop has a form control with no accessible label (axe rule
      // `label`, impact = critical) — a screen-reader blocker. A hardened app must
      // fix this so `label` no longer appears.
      expect(criticalIds(await scan(page))).toContain('label');
    }
  );
});
