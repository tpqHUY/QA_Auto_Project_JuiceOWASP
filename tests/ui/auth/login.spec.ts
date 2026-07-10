import { test, expect } from '../../../src/fixtures/index.js';
import { LoginPage } from '../../../src/pages/login.page.js';
import { NavbarComponent } from '../../../src/pages/navbar.component.js';
import { ROUTES } from '../../../src/data/constants.js';

test.describe('Login (UI)', () => {
  test(
    'a registered user can log in',
    { tag: ['@smoke', '@regression'] },
    async ({ page, authApi, user }) => {
      await authApi.register(user); // API-first setup: skip the registration UI here.

      const login = new LoginPage(page);
      await login.goto();
      await login.loginAs(user);

      await login.navbar.openAccountMenu();
      await expect(login.navbar.logoutMenuButton).toBeVisible();
    }
  );

  test(
    'login fails with a wrong password',
    { tag: ['@regression'] },
    async ({ page, authApi, user }) => {
      await authApi.register(user);

      const login = new LoginPage(page);
      await login.goto();
      await login.login(user.email, 'wrong-password-123');

      await expect(login.errorMessage).toBeVisible();
      await expect(login.errorMessage).toContainText(/invalid email or password/i);
    }
  );

  test('login fails for an unknown user', { tag: ['@regression'] }, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('ghost.user@e2e.local', 'whatever-123');

    await expect(login.errorMessage).toBeVisible();
  });

  test(
    'the login button is disabled until both fields are filled',
    { tag: ['@regression'] },
    async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();

      await expect(login.loginButton).toBeDisabled();

      await login.emailInput.fill('someone@e2e.local');
      await expect(login.loginButton).toBeDisabled(); // password still empty

      await login.passwordInput.fill('password123');
      await expect(login.loginButton).toBeEnabled();
    }
  );

  test(
    'a logged-in user can log out',
    { tag: ['@smoke', '@regression'] },
    async ({ loggedInPage }) => {
      const navbar = new NavbarComponent(loggedInPage);
      await loggedInPage.goto(ROUTES.home, { waitUntil: 'domcontentloaded' });

      await navbar.logout();

      await navbar.openAccountMenu();
      await expect(navbar.loginMenuButton).toBeVisible();
    }
  );
});
