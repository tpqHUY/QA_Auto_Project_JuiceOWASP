import type { Page, Locator } from '@playwright/test';
import { ROUTES } from '../data/constants.js';

/**
 * The top toolbar, present on every page. Modelled as a component (not a page)
 * because it is composed into pages rather than navigated to. Handles the
 * account menu, cart access, search, and login-state checks.
 */
export class NavbarComponent {
  readonly accountButton: Locator;
  readonly loginMenuButton: Locator;
  readonly logoutMenuButton: Locator;
  readonly cartButton: Locator;
  readonly searchField: Locator;
  readonly searchInput: Locator;

  constructor(private readonly page: Page) {
    this.accountButton = page.locator('#navbarAccount');
    this.loginMenuButton = page.locator('#navbarLoginButton');
    this.logoutMenuButton = page.locator('#navbarLogoutButton');
    this.cartButton = page.locator('[aria-label="Show the shopping cart"]');
    this.searchField = page.locator('#searchQuery');
    this.searchInput = page.locator('#searchQuery input');
  }

  async openAccountMenu(): Promise<void> {
    await this.accountButton.click();
  }

  async goToLogin(): Promise<void> {
    await this.openAccountMenu();
    await this.loginMenuButton.click();
  }

  async logout(): Promise<void> {
    await this.openAccountMenu();
    await this.logoutMenuButton.click();
  }

  async goToBasket(): Promise<void> {
    await this.cartButton.click();
    await this.page.waitForURL(new RegExp(`${ROUTES.basket.replace(/[/#]/g, '\\$&')}$`));
  }

  /** True when a session is active (the account menu offers Logout, not Login). */
  async isLoggedIn(): Promise<boolean> {
    await this.openAccountMenu();
    const loggedIn = await this.logoutMenuButton.isVisible().catch(() => false);
    // close the menu again so callers are left on a clean page
    await this.page.keyboard.press('Escape').catch(() => {});
    return loggedIn;
  }

  /** Run a search from the toolbar; the field auto-expands if collapsed. */
  async search(term: string): Promise<void> {
    if (!(await this.searchInput.isVisible().catch(() => false))) {
      await this.searchField.click();
    }
    await this.searchInput.click();
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
  }
}
