import { faker } from '@faker-js/faker';
import type { PaymentCard } from '../types.js';

/**
 * Builds a payment card. The number is 16 digits and the expiry is always in
 * the future so it passes Juice Shop's payment-form validation.
 */
export function makeCard(overrides: Partial<PaymentCard> = {}): PaymentCard {
  const now = new Date();
  return {
    fullName: faker.person.fullName(),
    cardNumber: faker.string.numeric(16),
    expiryMonth: faker.number.int({ min: 1, max: 12 }),
    expiryYear: now.getFullYear() + faker.number.int({ min: 1, max: 5 }),
    ...overrides,
  };
}
