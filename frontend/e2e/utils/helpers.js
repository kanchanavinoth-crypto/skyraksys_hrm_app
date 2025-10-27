/**
 * Test Helper Utilities
 * Common helper functions for E2E tests
 */

/**
 * Wait for element to be visible
 */
export async function waitForElement(page, selector, timeout = 30000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Wait for element to be hidden
 */
export async function waitForElementToHide(page, selector, timeout = 30000) {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Wait for page to load completely
 */
export async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}_${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(page, urlPattern, timeout = 30000) {
  return await page.waitForResponse(
    response => response.url().includes(urlPattern) && response.status() === 200,
    { timeout }
  );
}

/**
 * Check if element exists without throwing error
 */
export async function elementExists(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get element text content safely
 */
export async function getTextContent(page, selector) {
  try {
    return await page.textContent(selector);
  } catch {
    return null;
  }
}

/**
 * Fill form field with retry
 */
export async function fillFieldWithRetry(page, selector, value, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.fill(selector, value);
      const currentValue = await page.inputValue(selector);
      if (currentValue === value) {
        return true;
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await page.waitForTimeout(1000);
    }
  }
  return false;
}

/**
 * Click element with retry
 */
export async function clickWithRetry(page, selector, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.click(selector);
      return true;
    } catch (error) {
      if (i === retries - 1) throw error;
      await page.waitForTimeout(1000);
    }
  }
  return false;
}

/**
 * Select dropdown option
 */
export async function selectDropdown(page, selector, value) {
  await page.click(selector);
  await page.waitForTimeout(500);
  await page.click(`[role="option"]:has-text("${value}"), li:has-text("${value}")`);
}

/**
 * Upload file
 */
export async function uploadFile(page, inputSelector, filePath) {
  const fileInput = await page.$(inputSelector);
  await fileInput.setInputFiles(filePath);
}

/**
 * Scroll to element
 */
export async function scrollToElement(page, selector) {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, selector);
  await page.waitForTimeout(500);
}

/**
 * Get table data
 */
export async function getTableData(page, tableSelector) {
  return await page.evaluate((selector) => {
    const table = document.querySelector(selector);
    if (!table) return [];

    const rows = table.querySelectorAll('tbody tr');
    return Array.from(rows).map(row => {
      const cells = row.querySelectorAll('td');
      return Array.from(cells).map(cell => cell.textContent.trim());
    });
  }, tableSelector);
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page) {
  const loadingSelectors = [
    '.loading',
    '.spinner',
    '[data-testid="loading"]',
    '.MuiCircularProgress-root'
  ];

  for (const selector of loadingSelectors) {
    try {
      await page.waitForSelector(selector, { state: 'hidden', timeout: 30000 });
    } catch {
      // Continue if selector not found
    }
  }
}

/**
 * Check for error messages
 */
export async function hasErrorMessage(page) {
  const errorSelectors = [
    '.error-message',
    '.alert-error',
    '[role="alert"]',
    '.MuiAlert-standardError'
  ];

  for (const selector of errorSelectors) {
    if (await page.isVisible(selector)) {
      return true;
    }
  }
  return false;
}

/**
 * Get error message text
 */
export async function getErrorMessage(page) {
  const errorSelectors = [
    '.error-message',
    '.alert-error',
    '[role="alert"]',
    '.MuiAlert-standardError'
  ];

  for (const selector of errorSelectors) {
    try {
      const text = await page.textContent(selector);
      if (text) return text.trim();
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Clear and fill input
 */
export async function clearAndFill(page, selector, value) {
  await page.click(selector);
  await page.fill(selector, '');
  await page.fill(selector, value);
}

/**
 * Wait for navigation
 */
export async function waitForNavigation(page, action) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    action()
  ]);
}

/**
 * Check if on specific page
 */
export async function isOnPage(page, urlPattern) {
  const currentUrl = page.url();
  return currentUrl.includes(urlPattern);
}

/**
 * Refresh page and wait
 */
export async function refreshPage(page) {
  await page.reload();
  await waitForPageLoad(page);
}

/**
 * Close all dialogs/modals
 */
export async function closeAllDialogs(page) {
  const closeSelectors = [
    '[aria-label="Close"]',
    'button:has-text("Close")',
    'button:has-text("Cancel")',
    '.modal-close',
    '.dialog-close'
  ];

  for (const selector of closeSelectors) {
    try {
      if (await page.isVisible(selector)) {
        await page.click(selector);
        await page.waitForTimeout(500);
      }
    } catch {
      continue;
    }
  }
}

/**
 * Accept confirmation dialog
 */
export async function acceptConfirmation(page) {
  const confirmSelectors = [
    'button:has-text("Confirm")',
    'button:has-text("Yes")',
    'button:has-text("OK")',
    'button:has-text("Accept")'
  ];

  for (const selector of confirmSelectors) {
    try {
      if (await page.isVisible(selector)) {
        await page.click(selector);
        return true;
      }
    } catch {
      continue;
    }
  }
  return false;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get current date
 */
export function getCurrentDate() {
  return formatDate(new Date());
}

/**
 * Get date N days from now
 */
export function getDateFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Retry action
 */
export async function retryAction(action, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await action();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Wait for element count
 */
export async function waitForElementCount(page, selector, count, timeout = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const elements = await page.$$(selector);
    if (elements.length === count) {
      return true;
    }
    await page.waitForTimeout(500);
  }
  
  throw new Error(`Expected ${count} elements, but found ${(await page.$$(selector)).length}`);
}

/**
 * Log test step
 */
export function logStep(message) {
  console.log(`[TEST STEP] ${new Date().toISOString()} - ${message}`);
}

export default {
  waitForElement,
  waitForElementToHide,
  waitForPageLoad,
  takeScreenshot,
  waitForAPIResponse,
  elementExists,
  getTextContent,
  fillFieldWithRetry,
  clickWithRetry,
  selectDropdown,
  uploadFile,
  scrollToElement,
  getTableData,
  waitForLoading,
  hasErrorMessage,
  getErrorMessage,
  clearAndFill,
  waitForNavigation,
  isOnPage,
  refreshPage,
  closeAllDialogs,
  acceptConfirmation,
  formatDate,
  getCurrentDate,
  getDateFromNow,
  retryAction,
  waitForElementCount,
  logStep
};
