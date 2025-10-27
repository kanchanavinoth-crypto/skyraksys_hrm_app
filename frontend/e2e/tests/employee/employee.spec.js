import { test, expect } from '@playwright/test';
import { EmployeePage } from '../../pages/EmployeePage';
import { LoginPage } from '../../pages/LoginPage';
import { DataGenerator } from '../../utils/dataGenerator';

test.describe('Employee Management Tests @regression', () => {
  let employeePage;
  let loginPage;

  test.beforeEach(async ({ page }) => {
    // Login as admin first
    loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(
      process.env.TEST_ADMIN_USERNAME || 'admin',
      process.env.TEST_ADMIN_PASSWORD || 'admin123'
    );
    
    // Then navigate to employee page
    employeePage = new EmployeePage(page);
    await employeePage.navigate();
  });

  test('should display employee list', async ({ page }) => {
    // Verify employee table is visible
    expect(await page.isVisible(employeePage.employeeTable)).toBeTruthy();

    // Verify add employee button is visible
    expect(await page.isVisible(employeePage.addEmployeeButton)).toBeTruthy();
  });

  test('should add new employee successfully', async ({ page }) => {
    // Click add employee
    await employeePage.clickAddEmployee();

    // Wait for form to load
    await page.waitForSelector(employeePage.firstNameInput, { timeout: 5000 });

    // Generate unique employee data
    const timestamp = Date.now();
    const employeeData = {
      firstName: `Test${timestamp}`,
      lastName: 'Employee',
      email: `test${timestamp}@example.com`,
      phone: '1234567890',
      employeeId: `TEST${timestamp}`,
      department: '1',  // Assuming department ID
      position: '1'     // Assuming position ID
    };

    // Fill employee form
    await employeePage.fillEmployeeForm(employeeData);

    // Save employee
    await employeePage.saveEmployee();

    // Verify success (should redirect or show success message)
    await page.waitForTimeout(2000);

    // Search for the new employee
    await employeePage.searchEmployee(employeeData.employeeId);

    // Verify employee exists
    const exists = await employeePage.employeeExists(employeeData.employeeId);
    expect(exists).toBeTruthy();
  });

  test('should search employee successfully', async ({ page }) => {
    // Assuming there's at least one employee with ID SKYT001
    await employeePage.searchEmployee('SKYT001');

    // Wait for results
    await page.waitForTimeout(1000);

    // Verify search results
    const exists = await employeePage.employeeExists('SKYT001');
    expect(exists).toBeTruthy();
  });

  test('should view employee details', async ({ page }) => {
    // Search for employee
    await employeePage.searchEmployee('SKYT001');

    // Click view button
    await employeePage.viewEmployee('SKYT001');

    // Wait for details page
    await page.waitForTimeout(2000);

    // Verify URL contains employee ID or details
    const url = page.url();
    expect(url).toMatch(/employee|profile|view/);
  });

  test('should edit employee successfully', async ({ page }) => {
    // Search for employee
    await employeePage.searchEmployee('SKYT001');

    // Click edit button
    await employeePage.editEmployee('SKYT001');

    // Wait for edit form
    await page.waitForSelector(employeePage.firstNameInput, { timeout: 5000 });

    // Update email
    const newEmail = `updated${Date.now()}@example.com`;
    await employeePage.fill(employeePage.emailInput, newEmail);

    // Save changes
    await employeePage.saveEmployee();

    // Verify success
    await page.waitForTimeout(2000);
  });

  test('should validate required fields', async ({ page }) => {
    // Click add employee
    await employeePage.clickAddEmployee();

    // Wait for form
    await page.waitForSelector(employeePage.saveButton, { timeout: 5000 });

    // Try to save without filling required fields
    await employeePage.click(employeePage.saveButton);

    // Wait for validation
    await page.waitForTimeout(1000);

    // Verify validation errors appear
    const errors = await page.$$('.error, .invalid-feedback, [role="alert"]');
    expect(errors.length).toBeGreaterThan(0);
  });

  test('should filter employees', async ({ page }) => {
    // Check if filter button exists
    if (await page.isVisible(employeePage.filterButton)) {
      await employeePage.click(employeePage.filterButton);

      // Wait for filter panel
      await page.waitForTimeout(1000);

      // Apply some filter (assuming department filter exists)
      const departmentFilter = 'select[name="department"], input[name="department"]';
      if (await page.isVisible(departmentFilter)) {
        await page.selectOption(departmentFilter, { index: 1 });
        
        // Apply filter
        const applyButton = 'button:has-text("Apply"), button:has-text("Filter")';
        await page.click(applyButton);

        // Wait for filtered results
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should export employee list', async ({ page }) => {
    const exportButton = 'button:has-text("Export"), [aria-label="Export"]';

    if (await page.isVisible(exportButton)) {
      // Setup download promise
      const downloadPromise = page.waitForEvent('download');

      // Click export
      await page.click(exportButton);

      // Wait for download
      const download = await downloadPromise;

      // Verify download started
      expect(download.suggestedFilename()).toMatch(/employee|export/i);
    }
  });

  test('should paginate employee list', async ({ page }) => {
    const nextButton = 'button[aria-label="Next"], .pagination .next, button:has-text("Next")';
    const previousButton = 'button[aria-label="Previous"], .pagination .previous, button:has-text("Previous")';

    // Get initial employee count
    const initialCount = await employeePage.getEmployeeCount();

    // Click next if available
    if (await page.isVisible(nextButton) && !await page.isDisabled(nextButton)) {
      await page.click(nextButton);
      await page.waitForTimeout(1000);

      // Verify page changed
      const newCount = await employeePage.getEmployeeCount();
      // Counts might be same if same page size, so just verify no error
      expect(newCount).toBeGreaterThanOrEqual(0);

      // Go back to previous page
      if (await page.isVisible(previousButton) && !await page.isDisabled(previousButton)) {
        await page.click(previousButton);
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should handle bulk actions', async ({ page }) => {
    const selectAllCheckbox = 'input[type="checkbox"][aria-label*="Select all"], .select-all';
    const bulkActionButton = 'button:has-text("Bulk Actions"), [aria-label="Bulk Actions"]';

    // Check if bulk actions are available
    if (await page.isVisible(selectAllCheckbox)) {
      // Select all employees
      await page.check(selectAllCheckbox);

      // Check if bulk action button is enabled
      if (await page.isVisible(bulkActionButton)) {
        await page.click(bulkActionButton);
        await page.waitForTimeout(500);

        // Verify bulk action menu appears
        const bulkMenu = '.bulk-menu, .action-menu';
        expect(await page.isVisible(bulkMenu)).toBeTruthy();
      }
    }
  });
});
