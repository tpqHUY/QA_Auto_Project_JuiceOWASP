import type { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page.js';
import { ROUTES } from '../data/constants.js';

/**
 * Password recovery via security question. The security-question label is
 * fetched and revealed only after a known email is entered, so `enterEmail`
 * waits for the answer field to become enabled before proceeding.
 */
export class ForgotPasswordPage extends BasePage {
  readonly emailInput: Locator;
  readonly securityAnswerInput: Locator;
  readonly newPasswordInput: Locator;
  readonly repeatPasswordInput: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#email');
    this.securityAnswerInput = page.locator('#securityAnswer');
    this.newPasswordInput = page.locator('#newPassword');
    this.repeatPasswordInput = page.locator('#newPasswordRepeat');
    this.resetButton = page.locator('#resetButton');
  }

  async goto(): Promise<void> {
    await this.open(ROUTES.forgotPassword);
  }

  async enterEmail(email: string): Promise<void> {
    // Real keystrokes are required here: Juice Shop looks up the account's
    // security question from the email field's debounced `valueChanges`, which a
    // bulk `fill()` does not reliably trigger. Once the lookup resolves, the
    // (initially disabled) answer field becomes editable.
    await this.emailInput.click();
    await this.emailInput.pressSequentially(email, { delay: 15 });
    await this.emailInput.blur();
    await this.securityAnswerInput.waitFor({ state: 'visible' });
  }

  async resetPassword(params: {
    email: string;
    securityAnswer: string;
    newPassword: string;
  }): Promise<void> {
    await this.enterEmail(params.email);
    await this.securityAnswerInput.fill(params.securityAnswer);
    await this.newPasswordInput.fill(params.newPassword);
    await this.repeatPasswordInput.fill(params.newPassword);
    await this.resetButton.click();
  }
}
