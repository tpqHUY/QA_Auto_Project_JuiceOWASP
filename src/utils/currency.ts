/**
 * Juice Shop renders prices with the generic currency placeholder, e.g. `1.99¤`
 * and the basket total as `Total Price: 6.97¤`. These helpers turn that display
 * text into numbers we can assert on, and round money to 2 decimals to avoid the
 * floating-point noise the app itself leaks (e.g. `6.970000000000001`).
 */

/** Extract the numeric value from a price-like string (`"1.99¤"` → `1.99`). */
export function parsePrice(text: string | null | undefined): number {
  if (!text) throw new Error(`Cannot parse price from empty value: "${text}"`);
  const match = text.replace(',', '.').match(/-?\d+(\.\d+)?/);
  if (!match) throw new Error(`No numeric value found in price text: "${text}"`);
  return Number(match[0]);
}

/** Round a monetary amount to 2 decimals (banker-free, simple half-up). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Sum line items (unit price × quantity) into a rounded total. */
export function calcTotal(items: Array<{ price: number; quantity: number }>): number {
  return roundMoney(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
}
