import { BasePage } from './BasePage';

/**
 * Timesheet Page Object Model
 */
export class TimesheetPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.weekSelector = 'input[type="date"], .week-selector';
    this.projectSelect = 'select[name="project"], [aria-label="Project"]';
    this.taskSelect = 'select[name="task"], [aria-label="Task"]';
    this.mondayInput = 'input[name="mondayHours"]';
    this.tuesdayInput = 'input[name="tuesdayHours"]';
    this.wednesdayInput = 'input[name="wednesdayHours"]';
    this.thursdayInput = 'input[name="thursdayHours"]';
    this.fridayInput = 'input[name="fridayHours"]';
    this.saturdayInput = 'input[name="saturdayHours"]';
    this.sundayInput = 'input[name="sundayHours"]';
    this.descriptionInput = 'textarea[name="description"]';
    this.addRowButton = 'button:has-text("Add Row"), [aria-label="Add Row"]';
    this.saveDraftButton = 'button:has-text("Save Draft")';
    this.submitButton = 'button:has-text("Submit"), button[type="submit"]';
    this.totalHours = '.total-hours, .hours-total';
  }

  /**
   * Navigate to timesheet page
   */
  async navigate() {
    await this.goto('/timesheets');
    await this.waitForElement(this.weekSelector);
  }

  /**
   * Select week
   */
  async selectWeek(weekStartDate) {
    await this.fill(this.weekSelector, weekStartDate);
  }

  /**
   * Fill timesheet row
   */
  async fillTimesheetRow(rowData) {
    if (rowData.project) {
      await this.selectOption(this.projectSelect, rowData.project);
      await this.page.waitForTimeout(500); // Wait for task dropdown to load
    }
    
    if (rowData.task) {
      await this.selectOption(this.taskSelect, rowData.task);
    }
    
    const days = {
      monday: this.mondayInput,
      tuesday: this.tuesdayInput,
      wednesday: this.wednesdayInput,
      thursday: this.thursdayInput,
      friday: this.fridayInput,
      saturday: this.saturdayInput,
      sunday: this.sundayInput
    };
    
    for (const [day, hours] of Object.entries(rowData.hours || {})) {
      if (days[day]) {
        await this.fill(days[day], hours.toString());
      }
    }
    
    if (rowData.description) {
      await this.fill(this.descriptionInput, rowData.description);
    }
  }

  /**
   * Add new timesheet row
   */
  async addRow() {
    await this.click(this.addRowButton);
    await this.page.waitForTimeout(500);
  }

  /**
   * Save timesheet as draft
   */
  async saveDraft() {
    await this.click(this.saveDraftButton);
    await this.waitForNavigation();
  }

  /**
   * Submit timesheet
   */
  async submitTimesheet() {
    await this.click(this.submitButton);
    
    // Wait for confirmation if modal appears
    const confirmButton = 'button:has-text("Confirm"), button:has-text("Yes")';
    if (await this.isVisible(confirmButton)) {
      await this.click(confirmButton);
    }
    
    await this.waitForNavigation();
  }

  /**
   * Get total hours
   */
  async getTotalHours() {
    const totalText = await this.getText(this.totalHours);
    return parseFloat(totalText.replace(/[^0-9.]/g, ''));
  }

  /**
   * Copy previous week
   */
  async copyPreviousWeek() {
    const copyButton = 'button:has-text("Copy Previous Week"), [aria-label="Copy Previous Week"]';
    await this.click(copyButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if timesheet is submitted
   */
  async isTimesheetSubmitted() {
    const status = '.status, .timesheet-status';
    if (await this.isVisible(status)) {
      const statusText = await this.getText(status);
      return statusText.toLowerCase().includes('submitted');
    }
    return false;
  }

  /**
   * Get validation errors
   */
  async getValidationErrors() {
    const errors = [];
    const errorElements = await this.getElements('.error-message, .validation-error, [role="alert"]');
    
    for (const element of errorElements) {
      const text = await element.textContent();
      errors.push(text);
    }
    
    return errors;
  }
}
