import { test, expect } from '../../src/fixtures/index.js';
import { ENDPOINTS } from '../../src/data/constants.js';

/**
 * Performance *smoke* — a cheap latency guardrail, not a load test. It asserts that
 * key API calls answer within a budget, so a big regression (an N+1 query, a
 * missing index) shows up in CI instead of only in production.
 *
 * The budget is deliberately generous relative to observed local latency (~5–20ms)
 * so it never flakes on a busy CI runner, while still catching order-of-magnitude
 * slowdowns.
 */
const BUDGET_MS = 800;

/** Time a single async call and return `[result, elapsedMs]`. */
async function timed<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const start = performance.now();
  const result = await fn();
  return [result, performance.now() - start];
}

test.describe('Performance smoke @performance', () => {
  test(
    'the product catalog API responds within budget',
    { tag: ['@performance', '@api', '@regression'] },
    async ({ request }) => {
      const [res, ms] = await timed(() => request.get(ENDPOINTS.products));
      expect(res.ok()).toBeTruthy();
      expect(ms, `catalog API took ${ms.toFixed(0)}ms (budget ${BUDGET_MS}ms)`).toBeLessThan(
        BUDGET_MS
      );
    }
  );

  test(
    'an authenticated basket read responds within budget',
    { tag: ['@performance', '@api', '@regression'] },
    async ({ basketApi, session }) => {
      basketApi.setToken(session.token);
      const [res, ms] = await timed(() => basketApi.getRaw(session.bid));
      expect(res.ok()).toBeTruthy();
      expect(ms, `basket API took ${ms.toFixed(0)}ms (budget ${BUDGET_MS}ms)`).toBeLessThan(
        BUDGET_MS
      );
    }
  );
});
