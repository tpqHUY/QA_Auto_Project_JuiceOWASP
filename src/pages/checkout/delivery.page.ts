import type { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page.js';

/** The delivery-method step (`/#/delivery-method`). Three seeded options. */
export class DeliveryPage extends BasePage {
  readonly radios: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.radios = page.locator('mat-radio-button');
    // Label reads "delivery method selection" but this advances to payment.
    this.continueButton = page.locator('button[aria-label="Proceed to delivery method selection"]');
  }

  async selectFirst(): Promise<void> {
    await this.radios.first().click();
  }

  async selectByName(name: string): Promise<void> {
    // The name lives in a table cell, not inside the radio, so select the row's
    // radio by matching the row text (confirmed via probe).
    await this.page
      .locator('mat-row')
      .filter({ hasText: name })
      .locator('mat-radio-button')
      .click();
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
    await this.page.waitForURL(/payment/);
  }
}
