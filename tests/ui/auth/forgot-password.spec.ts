import { test, expect } from '../../../src/fixtures/index.js';
import { ForgotPasswordPage } from '../../../src/pages/forgot-password.page.js';
import { makeUser } from '../../../src/data/factories/user.factory.js';

test.describe('Forgot password (UI)', () => {
  test(
    'a user can reset their password with the correct security answer',
    { tag: ['@regression'] },
    async ({ page, authApi, user }) => {
      await authApi.register(user); // API-first: the account must exist first.
      const newPassword = `New!${user.password}`;

      const forgot = new ForgotPasswordPage(page);
      await forgot.goto();
      await forgot.resetPassword({
        email: user.email,
        securityAnswer: user.securityAnswer,
        newPassword,
      });

      // API-verify the change: the new password works, the old one no longer does.
      await expect
        .poll(async () => (await authApi.login(user.email, newPassword)).status())
        .toBe(200);
      expect((await authApi.login(user.email, user.password)).status()).toBe(401);
    }
  );

  test(
    'a wrong security answer does not change the password',
    { tag: ['@regression'] },
    async ({ page, authApi, user }) => {
      await authApi.register(user);
      const attemptedPassword = `Hacker!${user.password}`;

      const forgot = new ForgotPasswordPage(page);
      await forgot.goto();
      await forgot.resetPassword({
        email: user.email,
        securityAnswer: `${user.securityAnswer}-wrong`,
        newPassword: attemptedPassword,
      });

      // The original password must still be the valid one.
      expect((await authApi.login(user.email, user.password)).status()).toBe(200);
      expect((await authApi.login(user.email, attemptedPassword)).status()).toBe(401);
    }
  );

  test('the reset form exposes the expected fields', { tag: ['@regression'] }, async ({ page }) => {
    const forgot = new ForgotPasswordPage(page);
    await forgot.goto();
    // Answer / new-password fields are disabled until a known email is entered.
    await expect(forgot.emailInput).toBeVisible();
    await expect(forgot.resetButton).toBeVisible();

    const user = makeUser();
    await forgot.emailInput.fill(user.email);
    await forgot.emailInput.blur();
  });
});
