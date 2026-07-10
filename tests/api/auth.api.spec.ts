import { test, expect } from '../../src/fixtures/index.js';
import { makeUser } from '../../src/data/factories/user.factory.js';
import { LoginResponseSchema, RegisterResponseSchema } from '../../src/api/schemas.js';

/**
 * Auth API contract tests. Each asserts status code + response schema (a 200 with
 * a wrong body is still a bug), and covers the negative paths auth must get right.
 */
test.describe('Auth API', () => {
  test(
    'POST /rest/user/login returns 200 and a valid token for correct credentials',
    { tag: ['@api', '@smoke', '@regression'] },
    async ({ authApi, user }) => {
      await authApi.register(user);

      const res = await authApi.login(user.email, user.password);

      expect(res.status()).toBe(200);
      const body = LoginResponseSchema.parse(await res.json());
      expect(body.authentication.umail).toBe(user.email);
      // JWT = three base64url segments.
      expect(body.authentication.token.split('.')).toHaveLength(3);
    }
  );

  test(
    'POST /rest/user/login returns 401 for a wrong password',
    { tag: ['@api', '@regression'] },
    async ({ authApi, user }) => {
      await authApi.register(user);

      const res = await authApi.login(user.email, 'definitely-not-the-password');

      expect(res.status()).toBe(401);
    }
  );

  test(
    'POST /rest/user/login returns 401 for an unknown user',
    { tag: ['@api', '@regression'] },
    async ({ authApi }) => {
      const res = await authApi.login('nobody.here@e2e.local', 'whatever123');
      expect(res.status()).toBe(401);
    }
  );

  test(
    'POST /api/Users registers a new user and returns 201',
    { tag: ['@api', '@smoke', '@regression'] },
    async ({ authApi, user }) => {
      const res = await authApi.register(user);

      expect(res.status()).toBe(201);
      const body = RegisterResponseSchema.parse(await res.json());
      expect(body.data.email).toBe(user.email);
      expect(body.data.role).toBe('customer');
    }
  );

  test(
    'POST /api/Users rejects a duplicate email',
    { tag: ['@api', '@regression'] },
    async ({ authApi, user }) => {
      const first = await authApi.register(user);
      expect(first.status()).toBe(201);

      const duplicate = await authApi.register(user);
      // Uniqueness violation → client error (Juice Shop returns 4xx).
      expect(duplicate.status()).toBeGreaterThanOrEqual(400);
      expect(duplicate.status()).toBeLessThan(500);
    }
  );

  test(
    'POST /api/Users rejects registration with an empty email',
    { tag: ['@api', '@regression'] },
    async ({ request }) => {
      const user = makeUser();
      const res = await request.post('/api/Users', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: '',
          password: user.password,
          passwordRepeat: user.password,
          securityQuestion: { id: user.securityQuestionId },
          securityAnswer: user.securityAnswer,
        },
      });
      expect(res.status()).toBe(400);
    }
  );

  test(
    'GET /api/SecurityQuestions returns the seeded question list',
    { tag: ['@api', '@regression'] },
    async ({ request }) => {
      const res = await request.get('/api/SecurityQuestions');
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('success');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0]).toHaveProperty('question');
    }
  );

  test(
    'A newly registered user can immediately authenticate end-to-end',
    { tag: ['@api', '@regression'] },
    async ({ authApi, user }) => {
      const session = await authApi.createAndLogin(user);
      expect(session.token).not.toHaveLength(0);
      expect(session.bid).toBeGreaterThan(0);
      expect(session.email).toBe(user.email);
    }
  );
});
