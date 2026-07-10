import type { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page.js';
import { NavbarComponent } from './navbar.component.js';
import { ProductDetailsComponent } from './product-details.component.js';
import { ROUTES } from '../data/constants.js';
import { parsePrice } from '../utils/currency.js';

/**
 * The catalog / search results page. Products render as `mat-grid-tile` cards;
 * search is driven through the shared navbar component.
 */
export class HomePage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly paginator: Locator;
  readonly nextPageButton: Locator;

  constructor(page: Page) {
    super(page);
    this.navbar = new NavbarComponent(page);
    this.productCards = page.locator('mat-grid-tile');
    this.productNames = page.locator('.item-name');
    this.paginator = page.locator('mat-paginator');
    this.nextPageButton = page.locator('button[aria-label="Next page"]');
  }

  async goto(): Promise<void> {
    await this.open(ROUTES.search);
    await this.productCards.first().waitFor();
  }

  /** A single product card located by its (normalised) name. */
  card(name: string): Locator {
    return this.productCards.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async productCount(): Promise<number> {
    return this.productCards.count();
  }

  async firstProductName(): Promise<string> {
    return (await this.productNames.first().innerText()).trim();
  }

  async addToBasket(name: string): Promise<void> {
    await this.card(name).getByRole('button', { name: 'Add to Basket' }).click();
  }

  /** Adds the first catalog product and returns its name (for later assertions). */
  async addFirstProductToBasket(): Promise<string> {
    const name = await this.firstProductName();
    await this.productCards.first().getByRole('button', { name: 'Add to Basket' }).click();
    return name;
  }

  /** Unit price shown on a product card. */
  async priceOf(name: string): Promise<number> {
    const text = await this.card(name).locator('.item-price').innerText();
    return parsePrice(text);
  }

  async openDetails(name: string): Promise<ProductDetailsComponent> {
    await this.card(name).locator('.item-name').click();
    const details = new ProductDetailsComponent(this.page);
    await details.dialog.waitFor();
    return details;
  }

  search(term: string): Promise<void> {
    return this.navbar.search(term);
  }
}
