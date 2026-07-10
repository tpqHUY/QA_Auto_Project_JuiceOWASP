import type { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page.js';

/**
 * The payment step (`/#/payment/shop`). Cards are seeded via the API (see
 * CardApi — the payment form's expiry-year field is constrained by Juice Shop's
 * `expYear >= 2080` quirk), so here we just select an existing card.
 */
export class PaymentPage extends BasePage {
  readonly cardRadios: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cardRadios = page.locator('mat-radio-button');
    this.continueButton = page.locator('button[aria-label="Proceed to review"]');
  }

  async selectFirstCard(): Promise<void> {
    await this.cardRadios.first().click();
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
    await this.page.waitForURL(/order-summary/);
  }
}
