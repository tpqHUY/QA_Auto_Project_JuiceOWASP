import type { Page, Locator } from '@playwright/test';

/**
 * Product detail is a modal dialog in Juice Shop (not a route), so it is modelled
 * as a component opened from the catalog rather than a standalone page.
 */
export class ProductDetailsComponent {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly reviewInput: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.locator('mat-dialog-container');
    this.title = this.dialog.locator('h1').first();
    this.reviewInput = this.dialog.locator('#reviewText, textarea').first();
  }

  async isOpen(): Promise<boolean> {
    return this.dialog.isVisible().catch(() => false);
  }

  async titleText(): Promise<string> {
    return (await this.title.innerText()).trim();
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
