import { test, expect } from '../../../src/fixtures/index.js';
import { RegisterPage } from '../../../src/pages/register.page.js';
import { makeUser } from '../../../src/data/factories/user.factory.js';

test.describe('Registration (UI)', () => {
  test(
    'a new user can register and is sent to the login page',
    { tag: ['@smoke', '@regression'] },
    async ({ page, user, authApi }) => {
      const register = new RegisterPage(page);
      await register.goto();
      await register.register(user);

      // On success Juice Shop routes to /#/login.
      await expect(page).toHaveURL(/\/login$/);

      // API-verify the account really exists: it can now authenticate.
      const login = await authApi.login(user.email, user.password);
      expect(login.status()).toBe(200);
    }
  );

  test(
    'registration is blocked when the passwords do not match',
    { tag: ['@regression'] },
    async ({ page, user }) => {
      const register = new RegisterPage(page);
      await register.goto();

      await register.emailInput.fill(user.email);
      await register.passwordInput.fill(user.password);
      await register.repeatPasswordInput.fill(`${user.password}-different`);
      await register.repeatPasswordInput.blur();

      await expect(register.errorMessages.filter({ hasText: /match/i })).toBeVisible();
      await expect(register.registerButton).toBeDisabled();
    }
  );

  test(
    'registration is blocked with an invalid email format',
    { tag: ['@regression'] },
    async ({ page }) => {
      const register = new RegisterPage(page);
      await register.goto();

      await register.emailInput.fill('not-an-email');
      await register.emailInput.blur();

      await expect(register.errorMessages.first()).toBeVisible();
      await expect(register.registerButton).toBeDisabled();
    }
  );

  test(
    'registration is blocked until a security question is selected',
    { tag: ['@regression'] },
    async ({ page }) => {
      const register = new RegisterPage(page);
      await register.goto();
      const user = makeUser();

      // Fill everything EXCEPT the security question.
      await register.emailInput.fill(user.email);
      await register.passwordInput.fill(user.password);
      await register.repeatPasswordInput.fill(user.password);
      await register.securityAnswerInput.fill(user.securityAnswer);

      await expect(register.registerButton).toBeDisabled();
    }
  );
});
