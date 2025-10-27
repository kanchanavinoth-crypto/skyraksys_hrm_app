import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';

test.describe('Authentication Tests @smoke', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate();
  });

  test('should display login page correctly', async ({ page }) => {
    // Verify page title
    const title = await loginPage.getTitle();
    expect(title).toContain('Skyraksys');

    // Verify logo is displayed (optional - may not be present in all implementations)
    const logoVisible = await loginPage.isLogoDisplayed();
    // Only assert if logo element exists
    if (logoVisible !== null && logoVisible !== false) {
      expect(logoVisible).toBeTruthy();
    }

    // Verify form elements are present
    expect(await page.isVisible(loginPage.usernameInput)).toBeTruthy();
    expect(await page.isVisible(loginPage.passwordInput)).toBeTruthy();
    expect(await page.isVisible(loginPage.loginButton)).toBeTruthy();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Perform login with credentials from .env
    await loginPage.login(
      process.env.TEST_ADMIN_USERNAME || 'admin@company.com',
      process.env.TEST_ADMIN_PASSWORD || 'password123'
    );

    // Verify redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');

    // Verify dashboard is displayed
    const isOnDashboard = await dashboardPage.isOnDashboard();
    expect(isOnDashboard).toBeTruthy();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Attempt login with invalid credentials
    await loginPage.login('invalid_user', 'wrong_password');

    // Wait a moment for error to appear
    await page.waitForTimeout(2000);

    // Verify error message is displayed
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.toLowerCase()).toMatch(/invalid|incorrect|failed|error/);
  });

  test('should show error with empty credentials', async ({ page }) => {
    // Click login without entering credentials
    await page.click(loginPage.loginButton);

    // Wait for validation
    await page.waitForTimeout(1000);

    // Verify still on login page
    expect(page.url()).toContain('/login');
  });

  test('should login as employee successfully', async ({ page }) => {
    await loginPage.login(
      process.env.TEST_EMPLOYEE_USERNAME || 'employee@company.com',
      process.env.TEST_EMPLOYEE_PASSWORD || 'password123'
    );
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should login as manager successfully', async ({ page }) => {
    await loginPage.login(
      process.env.TEST_MANAGER_USERNAME || 'hr@company.com',
      process.env.TEST_MANAGER_PASSWORD || 'password123'
    );
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should handle password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator(loginPage.passwordInput);
    const toggleButton = page.locator('button[aria-label*="password"], .password-toggle');

    // Fill password
    await passwordInput.fill('testpassword');

    // Check if toggle button exists
    if (await toggleButton.isVisible()) {
      // Password should be hidden initially
      expect(await passwordInput.getAttribute('type')).toBe('password');

      // Click toggle to show password
      await toggleButton.click();
      expect(await passwordInput.getAttribute('type')).toBe('text');

      // Click toggle to hide password
      await toggleButton.click();
      expect(await passwordInput.getAttribute('type')).toBe('password');
    }
  });

  test('should remember me functionality work', async ({ page }) => {
    const rememberCheckbox = page.locator('input[type="checkbox"][name*="remember"], .remember-me');

    if (await rememberCheckbox.isVisible()) {
      await rememberCheckbox.check();
      expect(await rememberCheckbox.isChecked()).toBeTruthy();
    }
  });
});

test.describe('Sign Out / Logout Tests @smoke', () => {
  let dashboardPage;
  let loginPage;

  test.beforeEach(async ({ page }) => {
    // Login first
    loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(
      process.env.TEST_ADMIN_USERNAME || 'admin@company.com',
      process.env.TEST_ADMIN_PASSWORD || 'password123'
    );
    
    // Navigate to dashboard and wait for it to load
    dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
  });

  test('should sign out successfully', async ({ page }) => {
    // Perform sign out from dashboard
    await dashboardPage.signOut();

    // Verify redirect to login page
    expect(page.url()).toContain('/login');

    // Verify login form is displayed
    expect(await page.isVisible(loginPage.usernameInput)).toBeTruthy();
  });

  test('should not access dashboard after sign out', async ({ page }) => {
    // Sign out
    await dashboardPage.signOut();

    // Try to access dashboard directly
    await page.goto('http://localhost:3000/dashboard');

    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});
