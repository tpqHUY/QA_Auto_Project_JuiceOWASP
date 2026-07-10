import type { Page, Locator } from '@playwright/test';

/**
 * Base class for every Page Object.
 *
 * Responsibilities kept here so no subclass repeats them:
 *  - hold the `page` handle,
 *  - navigate via `open()`,
 *  - defensively dismiss the welcome-banner / cookie overlays (the fixtures
 *    normally pre-dismiss these via cookies, but a stray dialog on one browser
 *    engine shouldn't sink an unrelated test).
 *
 * Subclasses expose intent-revealing methods (`login`, `addFirstProduct`, …);
 * tests never touch raw selectors, which keeps specs readable as specifications.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async open(path: string): Promise<void> {
    // Juice Shop is an SPA that keeps loading challenge assets well after it is
    // interactive; waiting for the full `load` event can time out under parallel
    // load. `domcontentloaded` is enough — POM methods web-first-wait afterwards.
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.dismissOverlays();
  }

  /** Best-effort close of the welcome banner and cookie-consent bar. */
  async dismissOverlays(): Promise<void> {
    const candidates = [
      'button[aria-label="Close Welcome Banner"]',
      'a[aria-label="dismiss cookie message"]',
    ];
    for (const selector of candidates) {
      const el = this.page.locator(selector).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click().catch(() => {});
      }
    }
  }

  /** Shared toast/snackbar surface used across the app for feedback messages. */
  protected get snackbar(): Locator {
    return this.page.locator('simple-snack-bar, .mat-snack-bar-container, .cdk-overlay-container');
  }
}
