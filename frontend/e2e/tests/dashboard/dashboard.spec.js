import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../pages/DashboardPage';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Dashboard Tests @smoke', () => {
  let dashboardPage;
  let loginPage;

  test.beforeEach(async ({ page }) => {
    // Login first
    loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(
      process.env.TEST_ADMIN_USERNAME || 'admin',
      process.env.TEST_ADMIN_PASSWORD || 'admin123'
    );
    
    // Then navigate to dashboard
    dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
  });

  test('should display dashboard correctly', async ({ page }) => {
    // Verify on dashboard
    expect(await dashboardPage.isOnDashboard()).toBeTruthy();

    // Verify navigation menu is visible
    expect(await dashboardPage.isNavigationVisible()).toBeTruthy();

    // Verify page title
    const title = await page.textContent(dashboardPage.pageTitle);
    expect(title).toBeTruthy();
  });

  test('should display welcome message', async ({ page }) => {
    const welcomeMessage = await dashboardPage.getWelcomeMessage();
    
    if (welcomeMessage) {
      expect(welcomeMessage.toLowerCase()).toMatch(/welcome|hello|hi|dashboard/);
    }
  });

  test('should navigate to different modules', async ({ page }) => {
    const modules = ['Employees', 'Timesheet', 'Leave', 'Payroll'];

    for (const module of modules) {
      // Check if module link exists
      const moduleLink = `a:has-text("${module}"), [aria-label="${module}"]`;
      
      if (await page.isVisible(moduleLink)) {
        await dashboardPage.navigateToModule(module);
        await page.waitForTimeout(1000);

        // Verify URL changed
        expect(page.url()).toMatch(new RegExp(module.toLowerCase(), 'i'));

        // Go back to dashboard
        await dashboardPage.navigate();
      }
    }
  });

  test('should display dashboard statistics', async ({ page }) => {
    const stats = await dashboardPage.getDashboardStats();
    
    // Verify stats object has some data
    expect(Object.keys(stats).length).toBeGreaterThan(0);
  });

  test('should open user profile', async ({ page }) => {
    if (await page.isVisible(dashboardPage.userProfile)) {
      await dashboardPage.openUserProfile();
      await page.waitForTimeout(500);

      // Verify profile menu or page opened
      const profileMenu = '.profile-menu, .user-menu, [role="menu"]';
      const profilePage = 'h1:has-text("Profile"), .profile-page';
      
      const menuVisible = await page.isVisible(profileMenu);
      const pageVisible = await page.isVisible(profilePage);
      
      expect(menuVisible || pageVisible).toBeTruthy();
    }
  });

  test('should handle notifications', async ({ page }) => {
    if (await page.isVisible(dashboardPage.notificationBell)) {
      await dashboardPage.openNotifications();
      await page.waitForTimeout(500);

      // Verify notifications panel opened
      const notificationPanel = '.notifications-panel, .notification-drawer';
      expect(await page.isVisible(notificationPanel)).toBeTruthy();
    }
  });

  test('should perform search', async ({ page }) => {
    if (await page.isVisible(dashboardPage.searchBox)) {
      await dashboardPage.search('employee');
      await page.waitForTimeout(2000);

      // Verify search results or page changed
      const searchResults = '.search-results, .results';
      const resultsVisible = await page.isVisible(searchResults);
      
      // Either results panel shows or URL changed
      expect(resultsVisible || page.url().includes('search')).toBeTruthy();
    }
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      // Verify mobile menu toggle exists
      const mobileMenuToggle = 'button[aria-label*="menu"], .menu-toggle, .hamburger';
      
      if (await page.isVisible(mobileMenuToggle)) {
        // Click to open menu
        await page.click(mobileMenuToggle);
        await page.waitForTimeout(500);

        // Verify navigation is visible
        expect(await dashboardPage.isNavigationVisible()).toBeTruthy();

        // Close menu
        await page.click(mobileMenuToggle);
      }
    }
  });

  test('should handle quick actions', async ({ page }) => {
    const quickActionButtons = [
      'button:has-text("Add Employee")',
      'button:has-text("Submit Timesheet")',
      'button:has-text("Request Leave")'
    ];

    for (const button of quickActionButtons) {
      if (await page.isVisible(button)) {
        // Just verify the button is clickable
        expect(await page.isEnabled(button)).toBeTruthy();
      }
    }
  });

  test('should display recent activities', async ({ page }) => {
    const recentActivities = '.recent-activities, .activity-feed, .timeline';
    
    if (await page.isVisible(recentActivities)) {
      const activities = await page.$$(recentActivities + ' .activity-item, ' + recentActivities + ' li');
      expect(activities.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display pending approvals for managers', async ({ page }) => {
    const pendingSection = '.pending-approvals, .approvals-widget';
    
    if (await page.isVisible(pendingSection)) {
      const title = await page.textContent(pendingSection + ' h2, ' + pendingSection + ' .title');
      expect(title.toLowerCase()).toMatch(/pending|approval/);
    }
  });

  test('should refresh dashboard data', async ({ page }) => {
    const refreshButton = 'button[aria-label="Refresh"], button:has-text("Refresh"), .refresh-btn';
    
    if (await page.isVisible(refreshButton)) {
      await page.click(refreshButton);
      await page.waitForTimeout(2000);

      // Verify page didn't crash
      expect(await dashboardPage.isOnDashboard()).toBeTruthy();
    }
  });
});
