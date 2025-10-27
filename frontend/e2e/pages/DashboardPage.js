import { BasePage } from './BasePage';

/**
 * Dashboard Page Object Model
 */
export class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors based on actual SkyRakSys HRM Dashboard
    this.pageTitle = 'h1, .page-title, [role="heading"]';
    this.welcomeMessage = '.welcome-message, .greeting';
    this.navigationMenu = 'nav, .sidebar, .navigation';
    this.userProfile = '.user-profile, .profile-icon, [aria-label="Profile"], [aria-label="Account"]';
    this.notificationBell = '.notifications, [aria-label="Notifications"], svg[data-testid="NotificationsIcon"]';
    this.searchBox = 'input[type="search"], .search-input';
    
    // Additional selectors for SkyRakSys HRM
    this.refreshButton = 'button:has(svg[data-testid="RefreshIcon"])';
    this.employeesLink = 'a[href*="/employees"], button:has-text("Employees")';
    this.timesheetLink = 'a[href*="/timesheet"], button:has-text("Timesheet")';
    this.leaveLink = 'a[href*="/leave"], button:has-text("Leave")';
    this.payrollLink = 'a[href*="/payroll"], button:has-text("Payroll")';
  }

  /**
   * Navigate to dashboard
   */
  async navigate() {
    await this.goto('/dashboard');
    // Wait for page to load completely
    await this.page.waitForLoadState('networkidle');
    // Visual delay to see dashboard load
    await this.page.waitForTimeout(2000);
    await this.waitForElement(this.pageTitle);
  }

  /**
   * Check if user is on dashboard
   */
  async isOnDashboard() {
    return await this.page.url().includes('/dashboard');
  }

  /**
   * Get welcome message
   */
  async getWelcomeMessage() {
    if (await this.isVisible(this.welcomeMessage)) {
      return await this.getText(this.welcomeMessage);
    }
    return null;
  }

  /**
   * Navigate to module
   */
  async navigateToModule(moduleName) {
    const moduleLink = `a:has-text("${moduleName}"), [aria-label="${moduleName}"]`;
    await this.click(moduleLink);
  }

  /**
   * Check if navigation menu is visible
   */
  async isNavigationVisible() {
    return await this.isVisible(this.navigationMenu);
  }

  /**
   * Open user profile
   */
  async openUserProfile() {
    await this.click(this.userProfile);
  }

  /**
   * Open notifications
   */
  async openNotifications() {
    await this.click(this.notificationBell);
  }

  /**
   * Search
   */
  async search(query) {
    await this.fill(this.searchBox, query);
    await this.press(this.searchBox, 'Enter');
  }

  /**
   * Sign Out / Logout
   */
  async signOut() {
    // Click on the profile button (avatar with user name and email)
    const profileButton = 'button:has(div:has-text("@"))'; // Button containing email
    
    // Wait a moment for page to be ready
    await this.page.waitForTimeout(500);
    
    // Click profile button to open menu
    await this.click(profileButton);
    
    // Wait for menu to open
    await this.page.waitForTimeout(500);
    
    // Click on "Sign Out" menu item
    const signOutButton = 'li[role="menuitem"]:has-text("Sign Out")';
    await this.click(signOutButton);
    
    // Wait for redirect to login page
    await this.waitForURL('**/login', { timeout: 5000 });
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const stats = {};
    const statCards = await this.getElements('.stat-card, .metric-card, .dashboard-card');
    
    for (const card of statCards) {
      const label = await card.$eval('.label, .title', el => el.textContent);
      const value = await card.$eval('.value, .count', el => el.textContent);
      stats[label] = value;
    }
    
    return stats;
  }
}
