/**
 * Base Page Object Model
 * Provides common functionality for all page objects
 */
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async goto(url) {
    await this.page.goto(url);
  }

  /**
   * Get page title
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Click element
   */
  async click(selector) {
    await this.page.click(selector);
  }

  /**
   * Fill input field
   */
  async fill(selector, value) {
    await this.page.fill(selector, value);
  }

  /**
   * Get element text
   */
  async getText(selector) {
    return await this.page.textContent(selector);
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector) {
    return await this.page.isVisible(selector);
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  /**
   * Wait for API response
   */
  async waitForResponse(urlPattern) {
    return await this.page.waitForResponse(urlPattern);
  }

  /**
   * Get all elements matching selector
   */
  async getElements(selector) {
    return await this.page.$$(selector);
  }

  /**
   * Select dropdown option
   */
  async selectOption(selector, value) {
    await this.page.selectOption(selector, value);
  }

  /**
   * Check checkbox
   */
  async check(selector) {
    await this.page.check(selector);
  }

  /**
   * Uncheck checkbox
   */
  async uncheck(selector) {
    await this.page.uncheck(selector);
  }

  /**
   * Press keyboard key
   */
  async press(selector, key) {
    await this.page.press(selector, key);
  }

  /**
   * Hover over element
   */
  async hover(selector) {
    await this.page.hover(selector);
  }

  /**
   * Get element attribute
   */
  async getAttribute(selector, attribute) {
    return await this.page.getAttribute(selector, attribute);
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForURL(pattern, timeout = 10000) {
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Reload page
   */
  async reload() {
    await this.page.reload();
  }

  /**
   * Go back
   */
  async goBack() {
    await this.page.goBack();
  }

  /**
   * Go forward
   */
  async goForward() {
    await this.page.goForward();
  }
}
