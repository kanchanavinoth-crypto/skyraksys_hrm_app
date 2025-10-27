import { test as setup } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

const authFile = 'playwright/.auth/user.json';

/**
 * Global setup for authentication
 * This runs once before all tests to establish authenticated session
 */
setup('authenticate as admin', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  // Navigate to login page
  await page.goto('/login');
  
  // Perform login
  await loginPage.login(
    process.env.TEST_ADMIN_USERNAME || 'admin',
    process.env.TEST_ADMIN_PASSWORD || 'admin123'
  );
  
  // Wait for authentication to complete
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  
  // Save authenticated state
  await page.context().storageState({ path: authFile });
  
  console.log('✓ Authentication setup complete');
});

setup('authenticate as employee', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const authFileEmployee = 'playwright/.auth/employee.json';
  
  await page.goto('/login');
  
  await loginPage.login(
    process.env.TEST_EMPLOYEE_USERNAME || 'SKYT001',
    process.env.TEST_EMPLOYEE_PASSWORD || 'password123'
  );
  
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.context().storageState({ path: authFileEmployee });
  
  console.log('✓ Employee authentication setup complete');
});

setup('authenticate as manager', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const authFileManager = 'playwright/.auth/manager.json';
  
  await page.goto('/login');
  
  await loginPage.login(
    process.env.TEST_MANAGER_USERNAME || 'SKYT002',
    process.env.TEST_MANAGER_PASSWORD || 'password123'
  );
  
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.context().storageState({ path: authFileManager });
  
  console.log('✓ Manager authentication setup complete');
});
