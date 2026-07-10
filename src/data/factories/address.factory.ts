import { faker } from '@faker-js/faker';
import type { Address } from '../types.js';

/**
 * Builds a delivery address. Mobile/zip are constrained to digits because the
 * Juice Shop address form validates them numerically.
 */
export function makeAddress(overrides: Partial<Address> = {}): Address {
  return {
    fullName: faker.person.fullName(),
    mobileNumber: faker.string.numeric(10),
    zipCode: faker.string.numeric(5),
    streetAddress: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    country: faker.location.country(),
    ...overrides,
  };
}
