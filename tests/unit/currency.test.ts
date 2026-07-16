import { describe, it, expect } from 'vitest';
import { parsePrice, roundMoney, calcTotal } from '../../src/utils/currency.js';

/**
 * Unit tests for the currency helpers — the framework's own logic, tested in
 * isolation (no browser, no app). Fast feedback on the parsing/rounding rules the
 * whole basket-total assertion strategy depends on.
 */
describe('parsePrice', () => {
  it('extracts the number from Juice Shop price text', () => {
    expect(parsePrice('1.99¤')).toBe(1.99);
    expect(parsePrice('Total Price: 6.97¤')).toBe(6.97);
  });

  it('handles comma decimal separators', () => {
    expect(parsePrice('2,50¤')).toBe(2.5);
  });

  it('throws on empty or non-numeric input', () => {
    expect(() => parsePrice('')).toThrow();
    expect(() => parsePrice(null)).toThrow();
    expect(() => parsePrice('no digits here')).toThrow();
  });
});

describe('roundMoney', () => {
  it('rounds to 2 decimals and removes float noise', () => {
    expect(roundMoney(6.970000000000001)).toBe(6.97);
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(3)).toBe(3);
  });
});

describe('calcTotal', () => {
  it('sums unit price × quantity with rounding', () => {
    expect(calcTotal([{ price: 1.99, quantity: 2 }])).toBe(3.98);
    expect(
      calcTotal([
        { price: 1.99, quantity: 1 },
        { price: 2.99, quantity: 2 },
      ])
    ).toBe(7.97);
  });

  it('returns 0 for an empty basket', () => {
    expect(calcTotal([])).toBe(0);
  });
});
