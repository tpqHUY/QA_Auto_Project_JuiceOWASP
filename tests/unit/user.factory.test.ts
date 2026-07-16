import { describe, it, expect } from 'vitest';
import { makeUser } from '../../src/data/factories/user.factory.js';
import { SECURITY_QUESTION } from '../../src/data/constants.js';

/**
 * Unit tests for the user factory. The whole "parallel-safe, per-test data"
 * strategy rests on this producing valid + unique users every call, so it is
 * worth pinning down in isolation.
 */
describe('makeUser', () => {
  it('produces a valid Juice Shop user shape', () => {
    const u = makeUser();
    expect(u.email).toMatch(/@e2e\.local$/);
    // Juice Shop accepts passwords of 5–40 chars — stay comfortably inside.
    expect(u.password.length).toBeGreaterThanOrEqual(5);
    expect(u.password.length).toBeLessThanOrEqual(40);
    expect(u.securityQuestionId).toBe(SECURITY_QUESTION.id);
    expect(u.securityAnswer).toBeTruthy();
  });

  it('generates a unique email on every call (parallel-safe)', () => {
    const emails = new Set(Array.from({ length: 50 }, () => makeUser().email));
    expect(emails.size).toBe(50);
  });

  it('lets a test override a specific field', () => {
    const u = makeUser({ password: 'weak' });
    expect(u.password).toBe('weak');
    // Non-overridden fields stay populated.
    expect(u.email).toMatch(/@e2e\.local$/);
  });
});
