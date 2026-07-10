import type { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page.js';
import { NavbarComponent } from './navbar.component.js';
import { ROUTES } from '../data/constants.js';
import type { TestUser } from '../data/types.js';

export class LoginPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.navbar = new NavbarComponent(page);
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#loginButton');
    this.errorMessage = page.locator('.error');
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot your password/i });
  }

  async goto(): Promise<void> {
    await this.open(ROUTES.login);
  }

  /** Fill + submit the form. Does not assert outcome — callers decide expectations. */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  loginAs(user: Pick<TestUser, 'email' | 'password'>): Promise<void> {
    return this.login(user.email, user.password);
  }
}
