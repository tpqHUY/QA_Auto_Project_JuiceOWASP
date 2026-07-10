import { faker } from '@faker-js/faker';
import type { TestUser } from '../types.js';
import { SECURITY_QUESTION } from '../constants.js';

/**
 * Builds a fresh, unique user for each test. Because every test gets its own
 * account, the whole suite can run fully in parallel with zero shared-state
 * collisions — no cleanup, no "test A logged out test B" flakiness.
 *
 * `overrides` lets a test pin a specific field (e.g. a deliberately weak
 * password for a negative case) while keeping the rest random.
 */
export function makeUser(overrides: Partial<TestUser> = {}): TestUser {
  const unique = `${Date.now().toString(36)}.${faker.string.alphanumeric(8).toLowerCase()}`;
  return {
    email: `qa.${unique}@e2e.local`,
    // 12 chars, mixed — comfortably inside Juice Shop's 5–40 char rule.
    password: `Pw!${faker.string.alphanumeric(9)}`,
    securityQuestionId: SECURITY_QUESTION.id,
    securityAnswer: faker.person.lastName(),
    ...overrides,
  };
}
