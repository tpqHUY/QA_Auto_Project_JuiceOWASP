import type { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page.js';
import { ROUTES, SECURITY_QUESTION } from '../data/constants.js';
import type { TestUser } from '../data/types.js';

export class RegisterPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly repeatPasswordInput: Locator;
  readonly securityQuestionSelect: Locator;
  readonly securityAnswerInput: Locator;
  readonly registerButton: Locator;
  readonly errorMessages: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#emailControl');
    this.passwordInput = page.locator('#passwordControl');
    this.repeatPasswordInput = page.locator('#repeatPasswordControl');
    this.securityQuestionSelect = page.locator('mat-select[name="securityQuestion"]');
    this.securityAnswerInput = page.locator('#securityAnswerControl');
    this.registerButton = page.locator('#registerButton');
    this.errorMessages = page.locator('mat-error');
  }

  async goto(): Promise<void> {
    await this.open(ROUTES.register);
  }

  async selectSecurityQuestion(questionText: string): Promise<void> {
    const option = this.page.locator('mat-option', { hasText: questionText }).first();
    // The mat-select panel occasionally fails to open on the first click under
    // load, so retry opening until its options are actually rendered.
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.securityQuestionSelect.click();
      try {
        await option.waitFor({ state: 'visible', timeout: 3000 });
        break;
      } catch {
        await this.page.keyboard.press('Escape').catch(() => {});
      }
    }
    await option.click();
  }

  /** Fill the whole form. Submit is separate so negative tests can inspect state pre-submit. */
  async fillForm(user: TestUser, questionText: string = SECURITY_QUESTION.text): Promise<void> {
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.repeatPasswordInput.fill(user.password);
    await this.selectSecurityQuestion(questionText);
    await this.securityAnswerInput.fill(user.securityAnswer);
  }

  async submit(): Promise<void> {
    await this.registerButton.click();
  }

  /** Happy-path convenience: fill + submit. */
  async register(user: TestUser, questionText: string = SECURITY_QUESTION.text): Promise<void> {
    await this.fillForm(user, questionText);
    await this.submit();
  }
}
