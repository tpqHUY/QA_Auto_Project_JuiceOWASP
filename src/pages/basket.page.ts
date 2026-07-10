import type { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page.js';
import { ROUTES } from '../data/constants.js';
import { parsePrice } from '../utils/currency.js';

/**
 * The shopping basket. Each row is a Material table row; quantity controls are
 * the two icon buttons in the quantity cell ([−, +]) and the trash button lives
 * in the remove column (confirmed via exploratory probe).
 */
export class BasketPage extends BasePage {
  readonly rows: Locator;
  readonly totalPriceLabel: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.rows = page.locator('mat-row');
    this.totalPriceLabel = page.locator('#price');
    this.checkoutButton = page.locator('#checkoutButton');
  }

  async goto(): Promise<void> {
    await this.open(ROUTES.basket);
  }

  row(productName: string): Locator {
    return this.rows.filter({
      has: this.page.locator('mat-cell.mat-column-product', { hasText: productName }),
    });
  }

  /** The quantity cell as a locator, for web-first `toHaveText` assertions. */
  quantityCell(productName: string): Locator {
    return this.row(productName).locator('mat-cell.mat-column-quantity');
  }

  async rowCount(): Promise<number> {
    return this.rows.count();
  }

  async isEmpty(): Promise<boolean> {
    return (await this.rowCount()) === 0;
  }

  async quantityOf(productName: string): Promise<number> {
    const text = await this.row(productName).locator('mat-cell.mat-column-quantity').innerText();
    return Number(text.trim());
  }

  async unitPriceOf(productName: string): Promise<number> {
    const text = await this.row(productName).locator('mat-cell.mat-column-price').innerText();
    return parsePrice(text);
  }

  async increaseQuantity(productName: string): Promise<void> {
    await this.row(productName).locator('mat-cell.mat-column-quantity button').nth(1).click();
  }

  async decreaseQuantity(productName: string): Promise<void> {
    await this.row(productName).locator('mat-cell.mat-column-quantity button').nth(0).click();
  }

  async removeItem(productName: string): Promise<void> {
    await this.row(productName).locator('mat-cell.mat-column-remove button').click();
  }

  /** The app-computed total (`Total Price: 6.97¤` → `6.97`). */
  async totalPrice(): Promise<number> {
    return parsePrice(await this.totalPriceLabel.innerText());
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
