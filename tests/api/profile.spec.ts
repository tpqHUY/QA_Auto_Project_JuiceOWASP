import { test, expect } from '../../src/fixtures/index.js';
import { makeUser } from '../../src/data/factories/user.factory.js';

/**
 * Profile management — change password. Closes a P3 functional gap. Uses the
 * "action → verify real state" pattern: after changing the password we prove the
 * change by re-authenticating (new password works, old one no longer does).
 */
test.describe('Profile — change password @regression', () => {
  test(
    'a user can change their password and re-authenticate with the new one',
    { tag: ['@api', '@regression'] },
    async ({ authApi }) => {
      const user = makeUser();
      await authApi.createAndLogin(user); // sets the bearer token
      const newPassword = `${user.password}X9`;

      const changeRes = await authApi.changePassword(user.password, newPassword);
      expect(changeRes.status()).toBe(200);

      // Verify the real effect: the new password authenticates, the old one is rejected.
      expect((await authApi.login(user.email, newPassword)).status()).toBe(200);
      expect((await authApi.login(user.email, user.password)).status()).toBe(401);
    }
  );

  test(
    'change-password is rejected when the current password is wrong',
    { tag: ['@api', '@regression'] },
    async ({ authApi }) => {
      const user = makeUser();
      await authApi.createAndLogin(user);

      const res = await authApi.changePassword('definitely-not-my-password', 'Whatever!123');
      expect(res.status()).toBe(401);

      // The original password must still work — nothing was changed.
      expect((await authApi.login(user.email, user.password)).status()).toBe(200);
    }
  );

  test(
    'change-password is rejected when new and repeat do not match',
    { tag: ['@api', '@regression'] },
    async ({ authApi }) => {
      const user = makeUser();
      await authApi.createAndLogin(user);

      const res = await authApi.changePassword(user.password, 'Aaaaa1!', 'Bbbbb2!');
      expect(res.status()).toBe(401);
    }
  );
});
