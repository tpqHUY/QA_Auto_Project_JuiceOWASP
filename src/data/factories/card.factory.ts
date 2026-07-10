import { faker } from '@faker-js/faker';
import type { PaymentCard } from '../types.js';
import { MIN_CARD_EXP_YEAR } from '../constants.js';

/**
 * Builds a payment card. The number is 16 digits. The expiry year sits at or
 * above `MIN_CARD_EXP_YEAR` because Juice Shop's Card model rejects earlier
 * years (see the constant's note) — this keeps the data acceptable to the API.
 */
export function makeCard(overrides: Partial<PaymentCard> = {}): PaymentCard {
  return {
    fullName: faker.person.fullName(),
    // 16 digits with a guaranteed non-zero leading digit: Juice Shop stores the
    // card number as an integer with a `min` validator, so a leading zero (which
    // shortens the numeric value) would be rejected.
    cardNumber: `4${faker.string.numeric(15)}`,
    expiryMonth: faker.number.int({ min: 1, max: 12 }),
    expiryYear: MIN_CARD_EXP_YEAR + faker.number.int({ min: 0, max: 15 }),
    ...overrides,
  };
}
