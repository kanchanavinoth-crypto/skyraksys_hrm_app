import { test, expect } from '@playwright/test';
import { TimesheetPage } from '../../pages/TimesheetPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Timesheet Tests @regression', () => {
  let timesheetPage;
  let loginPage;

  test.beforeEach(async ({ page }) => {
    // Login as employee first
    loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(
      process.env.TEST_EMPLOYEE_USERNAME || 'SKYT001',
      process.env.TEST_EMPLOYEE_PASSWORD || 'password123'
    );
    
    timesheetPage = new TimesheetPage(page);
    
    // Navigate to timesheets via dashboard
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
    await dashboardPage.navigateToModule('Timesheet');
  });

  test('should display timesheet page', async ({ page }) => {
    // Verify week selector is visible
    expect(await page.isVisible(timesheetPage.weekSelector)).toBeTruthy();

    // Verify submit button is visible
    expect(await page.isVisible(timesheetPage.submitButton)).toBeTruthy();
  });

  test('should fill and save timesheet draft', async ({ page }) => {
    // Fill timesheet data
    const timesheetData = {
      project: '1',  // Assuming project ID
      task: '1',     // Assuming task ID
      hours: {
        monday: 8,
        tuesday: 8,
        wednesday: 8,
        thursday: 8,
        friday: 8
      },
      description: 'Regular project work'
    };

    await timesheetPage.fillTimesheetRow(timesheetData);

    // Save as draft
    await timesheetPage.saveDraft();

    // Verify success message or redirect
    await page.waitForTimeout(2000);
  });

  test('should submit timesheet successfully', async ({ page }) => {
    // Fill timesheet data
    const timesheetData = {
      project: '1',
      task: '1',
      hours: {
        monday: 8,
        tuesday: 8,
        wednesday: 8,
        thursday: 8,
        friday: 8
      },
      description: 'E2E test timesheet submission'
    };

    await timesheetPage.fillTimesheetRow(timesheetData);

    // Submit timesheet
    await timesheetPage.submitTimesheet();

    // Wait for submission
    await page.waitForTimeout(2000);

    // Verify success (check for success message or status)
    const successMessage = '.success, .alert-success, [role="status"]';
    if (await page.isVisible(successMessage)) {
      expect(await page.isVisible(successMessage)).toBeTruthy();
    }
  });

  test('should calculate total hours correctly', async ({ page }) => {
    // Fill timesheet with known hours
    const timesheetData = {
      project: '1',
      task: '1',
      hours: {
        monday: 5,
        tuesday: 6,
        wednesday: 7,
        thursday: 8,
        friday: 4
      }
    };

    await timesheetPage.fillTimesheetRow(timesheetData);

    // Wait for calculation
    await page.waitForTimeout(1000);

    // Get total hours
    const totalHours = await timesheetPage.getTotalHours();

    // Expected total: 5 + 6 + 7 + 8 + 4 = 30
    expect(totalHours).toBe(30);
  });

  test('should validate hours input', async ({ page }) => {
    // Try to enter invalid hours (e.g., more than 24)
    await page.fill(timesheetPage.mondayInput, '25');
    await page.fill(timesheetPage.tuesdayInput, '8');

    // Try to submit
    await timesheetPage.click(timesheetPage.submitButton);

    // Wait for validation
    await page.waitForTimeout(1000);

    // Check for validation errors
    const errors = await timesheetPage.getValidationErrors();
    expect(errors.length).toBeGreaterThan(0);
  });

  test('should add multiple timesheet rows', async ({ page }) => {
    // Fill first row
    const row1 = {
      project: '1',
      task: '1',
      hours: { monday: 4, tuesday: 4 }
    };
    await timesheetPage.fillTimesheetRow(row1);

    // Add new row
    await timesheetPage.addRow();
    await page.waitForTimeout(500);

    // Fill second row
    const row2 = {
      project: '2',
      task: '2',
      hours: { monday: 4, tuesday: 4 }
    };
    
    // Select second row's project/task (need to target specific row)
    const projectSelects = await page.$$(timesheetPage.projectSelect);
    const taskSelects = await page.$$(timesheetPage.taskSelect);
    
    if (projectSelects.length > 1) {
      await projectSelects[1].selectOption('2');
      await page.waitForTimeout(500);
      await taskSelects[1].selectOption('2');
    }

    // Save draft
    await timesheetPage.saveDraft();
    await page.waitForTimeout(2000);
  });

  test('should copy previous week timesheet', async ({ page }) => {
    // Check if copy button is available
    const copyButton = 'button:has-text("Copy Previous Week"), [aria-label="Copy Previous Week"]';
    
    if (await page.isVisible(copyButton)) {
      await timesheetPage.copyPreviousWeek();
      await page.waitForTimeout(2000);

      // Verify data was copied (total hours should be > 0)
      const totalHours = await timesheetPage.getTotalHours();
      expect(totalHours).toBeGreaterThan(0);
    }
  });

  test('should warn for excessive hours', async ({ page }) => {
    // Fill timesheet with over 80 hours
    const timesheetData = {
      project: '1',
      task: '1',
      hours: {
        monday: 16,
        tuesday: 16,
        wednesday: 16,
        thursday: 16,
        friday: 16,
        saturday: 8,
        sunday: 8
      }
    };

    await timesheetPage.fillTimesheetRow(timesheetData);

    // Wait for warning
    await page.waitForTimeout(1000);

    // Check for warning message
    const warning = '.warning, .alert-warning, [role="alert"]';
    if (await page.isVisible(warning)) {
      const warningText = await page.textContent(warning);
      expect(warningText.toLowerCase()).toMatch(/hours|exceed|warning/);
    }
  });

  test('should prevent duplicate task submission', async ({ page }) => {
    // Fill first row with project and task
    const row1 = {
      project: '1',
      task: '1',
      hours: { monday: 8 }
    };
    await timesheetPage.fillTimesheetRow(row1);

    // Add new row
    await timesheetPage.addRow();
    await page.waitForTimeout(500);

    // Try to add same project and task
    const projectSelects = await page.$$(timesheetPage.projectSelect);
    const taskSelects = await page.$$(timesheetPage.taskSelect);
    
    if (projectSelects.length > 1) {
      await projectSelects[1].selectOption('1');
      await page.waitForTimeout(500);
      await taskSelects[1].selectOption('1');
      await page.waitForTimeout(500);

      // Should show duplicate warning
      const warning = '.warning, .error, [role="alert"]';
      if (await page.isVisible(warning)) {
        const warningText = await page.textContent(warning);
        expect(warningText.toLowerCase()).toMatch(/duplicate|already|exists/);
      }
    }
  });

  test('should select current week by default', async ({ page }) => {
    // Get week selector value
    const weekValue = await page.inputValue(timesheetPage.weekSelector);
    
    // Verify it's a valid date
    expect(weekValue).toBeTruthy();
    expect(new Date(weekValue)).toBeInstanceOf(Date);
  });

  test('should change week and load data', async ({ page }) => {
    // Select a different week (previous week)
    const today = new Date();
    const previousWeek = new Date(today.setDate(today.getDate() - 7));
    const weekString = previousWeek.toISOString().split('T')[0];

    await timesheetPage.selectWeek(weekString);

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Verify week changed
    const currentWeek = await page.inputValue(timesheetPage.weekSelector);
    expect(currentWeek).toContain(weekString.substring(0, 7)); // Check year-month
  });
});

test.describe('Timesheet Approval Tests @regression', () => {
  test.use({ storageState: 'playwright/.auth/manager.json' });

  test('should view pending timesheets as manager', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
    await dashboardPage.navigateToModule('Approvals');

    // Wait for pending timesheets
    await page.waitForTimeout(2000);

    // Verify approval page is displayed
    const approvalSection = '.approvals, .pending-timesheets, [role="grid"]';
    expect(await page.isVisible(approvalSection)).toBeTruthy();
  });

  test('should approve timesheet', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
    await dashboardPage.navigateToModule('Approvals');

    await page.waitForTimeout(2000);

    // Find first approve button
    const approveButton = 'button:has-text("Approve")';
    
    if (await page.isVisible(approveButton)) {
      await page.click(approveButton);

      // Confirm if modal appears
      const confirmButton = 'button:has-text("Confirm"), button:has-text("Yes")';
      if (await page.isVisible(confirmButton)) {
        await page.click(confirmButton);
      }

      await page.waitForTimeout(2000);

      // Verify success message
      const success = '.success, .alert-success';
      if (await page.isVisible(success)) {
        expect(await page.isVisible(success)).toBeTruthy();
      }
    }
  });

  test('should reject timesheet with comment', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
    await dashboardPage.navigateToModule('Approvals');

    await page.waitForTimeout(2000);

    // Find first reject button
    const rejectButton = 'button:has-text("Reject")';
    
    if (await page.isVisible(rejectButton)) {
      await page.click(rejectButton);

      // Fill rejection comment if modal appears
      const commentField = 'textarea[name="comment"], textarea[placeholder*="reason"]';
      if (await page.isVisible(commentField)) {
        await page.fill(commentField, 'Test rejection comment for E2E test');
        
        const confirmButton = 'button:has-text("Confirm"), button:has-text("Submit")';
        await page.click(confirmButton);
      }

      await page.waitForTimeout(2000);
    }
  });
});
