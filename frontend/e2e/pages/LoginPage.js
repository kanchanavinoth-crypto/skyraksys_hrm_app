import { BasePage } from './BasePage';

/**
 * Login Page Object Model
 */
export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors based on actual SkyRakSys HRM Login component
    this.usernameInput = 'input[name="email"], input#email';
    this.passwordInput = 'input[name="password"], input#password';
    this.loginButton = 'button[type="submit"]';
    this.rememberMeCheckbox = 'input[name="rememberMe"]';
    this.showPasswordButton = 'button[aria-label="toggle password visibility"]';
    this.errorMessage = '.MuiAlert-standardError, [role="alert"], .notistack-MuiContent-error, .MuiSnackbar-root';
    this.pageTitle = 'h4:has-text("Welcome Back")';
    this.logo = 'svg[data-testid="BusinessIcon"]';
  }

  /**
   * Navigate to login page
   */
  async navigate() {
    await this.goto('/login');
    await this.page.waitForLoadState('networkidle');
    // Visual delay to see login page load
    await this.page.waitForTimeout(1000);
    await this.waitForElement(this.usernameInput);
  }

  /**
   * Perform login
   */
  async login(username, password) {
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.loginButton);
    // Wait to see the login action and redirect
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check if login was successful
   */
  async isLoginSuccessful() {
    try {
      await this.waitForURL('**/dashboard', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get error message
   */
  async getErrorMessage() {
    // Wait a moment for error to appear
    await this.page.waitForTimeout(1000);
    
    // Try different error message selectors
    const selectors = [
      '.MuiAlert-standardError',
      '[role="alert"]',
      '.notistack-MuiContent-error',
      '.MuiSnackbar-root [role="alert"]',
      'div:has-text("Invalid")',
      'div:has-text("incorrect")',
      'div:has-text("failed")'
    ];
    
    for (const selector of selectors) {
      if (await this.isVisible(selector)) {
        return await this.getText(selector);
      }
    }
    
    return null;
  }

  /**
   * Check if logo is displayed
   */
  async isLogoDisplayed() {
    return await this.isVisible(this.logo);
  }

  /**
   * Logout / Sign Out
   */
  async logout() {
    // Click on the profile button (avatar with user name)
    const profileButton = 'button:has(div:has-text("@"))'; // Button containing email
    
    // Wait a moment for page to be fully loaded
    await this.page.waitForTimeout(500);
    
    // Click profile button to open menu
    await this.click(profileButton);
    
    // Wait for menu to open
    await this.page.waitForTimeout(500);
    
    // Click on "Sign Out" in the menu
    const signOutButton = 'li[role="menuitem"]:has-text("Sign Out")';
    await this.click(signOutButton);
    
    // Wait for redirect to login page
    await this.waitForURL('**/login', { timeout: 5000 });
  }
}
