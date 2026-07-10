import type { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page.js';

/**
 * The order-completion / confirmation screen (`/#/order-completion/:orderId`).
 * The order id lives in the URL, so we read it from there for the API verify.
 */
export class OrderConfirmationPage extends BasePage {
  readonly thankYouMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.thankYouMessage = page.getByText(/thank you for your purchase/i);
  }

  async isConfirmed(): Promise<boolean> {
    return this.thankYouMessage.isVisible().catch(() => false);
  }

  /** The confirmation id parsed from `/#/order-completion/<id>` (null if absent). */
  orderId(): string | null {
    const match = this.page.url().match(/order-completion\/([^/?#]+)/);
    return match ? match[1] : null;
  }
}
