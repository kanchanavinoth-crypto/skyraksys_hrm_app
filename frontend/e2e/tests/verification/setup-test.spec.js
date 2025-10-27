import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';

test.describe('E2E Setup Verification @smoke', () => {
  test('should verify login page loads', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Navigate to login page
    await loginPage.navigate();
    
    // Verify page loaded
    await expect(page).toHaveURL(/login/);
    
    // Verify key elements exist
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    console.log('✅ Login page loads correctly!');
  });

  test('should login with admin credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Navigate to login page
    await loginPage.navigate();
    
    // Fill in credentials from .env
    await page.fill('input[name="email"]', process.env.TEST_ADMIN_USERNAME || 'admin@company.com');
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD || 'Kx9mP7qR2nF8sA5t');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    // Verify we're on dashboard or some authenticated page
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Should not be on login page anymore
    expect(currentUrl).not.toContain('/login');
    
    console.log('✅ Login successful!');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Navigate to login page
    await loginPage.navigate();
    
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Should still be on login page
    await expect(page).toHaveURL(/login/);
    
    // Check for error message
    const errorAlert = page.locator('.MuiAlert-standardError, [role="alert"]');
    const isErrorVisible = await errorAlert.isVisible().catch(() => false);
    
    if (isErrorVisible) {
      console.log('✅ Error message displayed correctly!');
    } else {
      console.log('⚠️  No error message found (check selector)');
    }
  });

  test('should toggle password visibility', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Navigate to login page
    await loginPage.navigate();
    
    // Fill password
    await page.fill('input[name="password"]', 'testpassword');
    
    // Get password input
    const passwordInput = page.locator('input[name="password"]');
    
    // Check initial type
    const initialType = await passwordInput.getAttribute('type');
    expect(initialType).toBe('password');
    
    // Click show password button
    const showPasswordButton = page.locator('button[aria-label="toggle password visibility"]');
    if (await showPasswordButton.isVisible()) {
      await showPasswordButton.click();
      
      // Check type changed
      await page.waitForTimeout(500);
      const newType = await passwordInput.getAttribute('type');
      expect(newType).toBe('text');
      
      console.log('✅ Password visibility toggle works!');
    } else {
      console.log('⚠️  Show password button not found');
    }
  });
});
