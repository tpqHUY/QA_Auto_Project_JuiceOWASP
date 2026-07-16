import { test, expect } from '../../src/fixtures/index.js';
import { ADMIN } from '../../src/data/constants.js';

/**
 * Admin-role fixture + role-based test data. The `adminSession` fixture logs in as
 * the seeded administrator; a regular `session` logs in as a customer. Decoding the
 * JWT payload lets us assert the two identities carry different roles — the
 * building block for future admin-only / authorization tests.
 */
function decodeRole(token: string): { email: string; role: string } {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
  return { email: payload.data.email, role: payload.data.role };
}

test.describe('Admin role @regression', () => {
  test(
    'the admin fixture yields an admin-role session',
    { tag: ['@api', '@regression'] },
    async ({ adminSession }) => {
      const { email, role } = decodeRole(adminSession.token);
      expect(email).toBe(ADMIN.email);
      expect(role).toBe('admin');
    }
  );

  test(
    'a regular user does not have the admin role (role separation)',
    { tag: ['@api', '@regression'] },
    async ({ session }) => {
      expect(decodeRole(session.token).role).not.toBe('admin');
    }
  );
});
