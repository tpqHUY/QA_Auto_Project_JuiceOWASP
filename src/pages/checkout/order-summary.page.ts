import type { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page.js';

/** The order-summary / review step (`/#/order-summary`). */
export class OrderSummaryPage extends BasePage {
  readonly placeOrderButton: Locator;

  constructor(page: Page) {
    super(page);
    // id="checkoutButton", aria-label "Complete your purchase".
    this.placeOrderButton = page.locator('#checkoutButton');
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
    await this.page.waitForURL(/order-completion/);
  }
}
