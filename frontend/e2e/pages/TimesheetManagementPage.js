const { BasePage } = require('./BasePage');

/**
 * Timesheet Management Page Object Model
 * Route: /timesheet-management
 * Main timesheet interface with tabs for weekly entry, history, and approvals
 */
class TimesheetManagementPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Routes
    this.routes = {
      timesheetManagement: '/timesheet-management',
      addTimesheet: '/add-timesheet',
      weeklyTimesheet: '/weekly-timesheet',
      timesheetHistory: '/timesheet-history',
      timesheetManager: '/timesheet-manager'
    };
    
    // Page Header
    this.pageTitle = 'h4:has-text("Timesheet"), h5:has-text("Timesheet")';
    this.addTimesheetButton = 'button:has-text("Add Timesheet"), a[href="/add-timesheet"]';
    this.weeklyTimesheetButton = 'button:has-text("Weekly Timesheet")';
    
    // Tabs (Material-UI Tabs component)
    this.myTimesheetsTab = 'button[role="tab"]:has-text("My Timesheets")';
    this.pendingApprovalsTab = 'button[role="tab"]:has-text("Pending")';
    this.approvedTab = 'button[role="tab"]:has-text("Approved")';
    this.rejectedTab = 'button[role="tab"]:has-text("Rejected")';
    
    // Timesheet Entry Form (WeeklyTimesheet component)
    this.weekSelector = 'input[type="date"], input[name="weekStartDate"]';
    this.projectSelect = 'select[name="project"], div[role="button"]:has-text("Project")';
    this.taskSelect = 'select[name="task"], div[role="button"]:has-text("Task")';
    this.hoursInput = 'input[name="hours"], input[type="number"]';
    this.descriptionTextarea = 'textarea[name="description"], textarea[placeholder*="description"]';
    this.submitButton = 'button[type="submit"]:has-text("Submit")';
    this.saveDraftButton = 'button:has-text("Save Draft")';
    this.cancelButton = 'button:has-text("Cancel")';
    
    // Weekly Timesheet Grid
    this.dayColumn = (day) => `th:has-text("${day}"), td[data-day="${day}"]`;
    this.mondayInput = 'input[name="monday"], input[data-day="monday"]';
    this.tuesdayInput = 'input[name="tuesday"], input[data-day="tuesday"]';
    this.wednesdayInput = 'input[name="wednesday"], input[data-day="wednesday"]';
    this.thursdayInput = 'input[name="thursday"], input[data-day="thursday"]';
    this.fridayInput = 'input[name="friday"], input[data-day="friday"]';
    this.saturdayInput = 'input[name="saturday"], input[data-day="saturday"]';
    this.sundayInput = 'input[name="sunday"], input[data-day="sunday"]';
    this.totalHours = 'text=/Total.*Hours|Total:/';
    
    // Timesheet List / Table
    this.timesheetTable = 'table, [role="table"]';
    this.timesheetRow = 'tr[role="row"], .MuiTableRow-root';
    this.timesheetCard = '.MuiCard-root'; // For mobile view
    this.statusChip = '.MuiChip-root';
    this.viewButton = 'button:has-text("View")';
    this.editButton = 'button[aria-label*="edit"], button:has-text("Edit")';
    this.deleteButton = 'button[aria-label*="delete"], button:has-text("Delete")';
    
    // Filters and Search
    this.searchInput = 'input[placeholder*="Search"], input[type="search"]';
    this.statusFilter = 'select[name="status"], div[role="button"]:has-text("Status")';
    this.periodFilter = 'select[name="period"], div[role="button"]:has-text("Period")';
    this.employeeFilter = 'select[name="employee"], div[role="button"]:has-text("Employee")';
    this.dateRangeFilter = 'input[type="date"]';
    
    // Success/Error Messages (Material-UI Alert and Notistack)
    this.successMessage = '.MuiAlert-standardSuccess, .notistack-MuiContent-success';
    this.errorMessage = '.MuiAlert-standardError, .notistack-MuiContent-error';
    this.validationError = '.MuiFormHelperText-root.Mui-error';
    this.snackbar = '.MuiSnackbar-root';
    
    // Manager Approval Dialog
    this.approveButton = 'button:has-text("Approve")';
    this.rejectButton = 'button:has-text("Reject")';
    this.approvalDialog = '[role="dialog"]';
    this.approvalCommentsTextarea = 'textarea[name="comments"], textarea[placeholder*="comment"]';
    this.confirmApprovalButton = 'button:has-text("Confirm")';
    
    // View Dialog
    this.viewDialog = '[role="dialog"]:has-text("Timesheet Details")';
    this.closeDialogButton = 'button[aria-label="close"], button:has-text("Close")';
    
    // Summary/Statistics
    this.weekSummaryCard = '.MuiCard-root:has-text("Week Summary")';
    this.totalHoursThisWeek = 'text=/Total.*Week|Weekly Total/';
    this.pendingHours = 'text=/Pending/';
    this.approvedHours = 'text=/Approved/';
  }

  /**
   * Navigate to Timesheet Management page
   */
  async navigateToTimesheetManagement() {
    await this.goto(this.routes.timesheetManagement);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Wait for data to load
  }

  /**
   * Navigate to Weekly Timesheet page
   */
  async navigateToWeeklyTimesheet() {
    await this.goto(this.routes.weeklyTimesheet);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to Add Timesheet page
   */
  async navigateToAddTimesheet() {
    await this.goto(this.routes.addTimesheet);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill timesheet entry form
   */
  async fillTimesheetEntry(data) {
    if (data.project) {
      await this.page.click(this.projectSelect);
      await this.page.click(`li:has-text("${data.project}")`);
    }
    
    if (data.task) {
      await this.page.click(this.taskSelect);
      await this.page.click(`li:has-text("${data.task}")`);
    }
    
    if (data.hours) {
      await this.page.fill(this.hoursInput, data.hours.toString());
    }
    
    if (data.description) {
      await this.page.fill(this.descriptionTextarea, data.description);
    }
  }

  /**
   * Fill weekly timesheet grid
   */
  async fillWeeklyTimesheet(weekData) {
    const dayInputs = {
      monday: this.mondayInput,
      tuesday: this.tuesdayInput,
      wednesday: this.wednesdayInput,
      thursday: this.thursdayInput,
      friday: this.fridayInput,
      saturday: this.saturdayInput,
      sunday: this.sundayInput
    };

    for (const [day, hours] of Object.entries(weekData)) {
      if (dayInputs[day.toLowerCase()] && hours) {
        await this.page.fill(dayInputs[day.toLowerCase()], hours.toString());
        await this.page.waitForTimeout(200); // Allow for total calculation
      }
    }
  }

  /**
   * Submit timesheet
   */
  async submitTimesheet() {
    await this.page.click(this.submitButton);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Save as draft
   */
  async saveDraft() {
    const draftBtn = this.page.locator(this.saveDraftButton);
    const isVisible = await draftBtn.isVisible().catch(() => false);
    if (isVisible) {
      await draftBtn.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Filter timesheets by status
   */
  async filterByStatus(status) {
    await this.page.click(this.statusFilter);
    await this.page.click(`li:has-text("${status}")`);
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter by period
   */
  async filterByPeriod(period) {
    await this.page.click(this.periodFilter);
    await this.page.click(`li:has-text("${period}")`);
    await this.page.waitForTimeout(500);
  }

  /**
   * Get timesheet count
   */
  async getTimesheetCount() {
    const rows = await this.page.locator(this.timesheetRow).all();
    return Math.max(0, rows.length - 1); // -1 for header row
  }

  /**
   * View timesheet by index
   */
  async viewTimesheet(index = 0) {
    const viewButtons = this.page.locator(this.viewButton);
    await viewButtons.nth(index).click();
    await this.page.waitForSelector(this.viewDialog);
  }

  /**
   * Approve timesheet by index (Manager only)
   */
  async approveTimesheet(index = 0, comments = '') {
    const approveButtons = this.page.locator(this.approveButton);
    await approveButtons.nth(index).click();
    
    // Wait for confirmation dialog
    await this.page.waitForSelector(this.approvalDialog);
    
    if (comments) {
      await this.page.fill(this.approvalCommentsTextarea, comments);
    }
    
    await this.page.click(this.confirmApprovalButton);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Reject timesheet by index (Manager only)
   */
  async rejectTimesheet(index = 0, comments = '') {
    const rejectButtons = this.page.locator(this.rejectButton);
    await rejectButtons.nth(index).click();
    
    // Wait for confirmation dialog
    await this.page.waitForSelector(this.approvalDialog);
    
    if (comments) {
      await this.page.fill(this.approvalCommentsTextarea, comments);
    }
    
    await this.page.click(this.confirmApprovalButton);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get total hours for the week
   */
  async getTotalHours() {
    const totalElement = this.page.locator(this.totalHours);
    const isVisible = await totalElement.isVisible().catch(() => false);
    
    if (isVisible) {
      const text = await totalElement.textContent();
      const match = text.match(/\d+(\.\d+)?/);
      return match ? parseFloat(match[0]) : 0;
    }
    
    return 0;
  }

  /**
   * Check if validation error exists
   */
  async hasValidationError() {
    const error = this.page.locator(this.validationError);
    return await error.isVisible().catch(() => false);
  }

  /**
   * Check if success message is displayed
   */
  async hasSuccessMessage() {
    const success = this.page.locator(this.successMessage);
    return await success.isVisible().catch(() => false);
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage() {
    const error = this.page.locator(this.errorMessage);
    return await error.isVisible().catch(() => false);
  }

  /**
   * Switch to pending tab
   */
  async switchToPendingTab() {
    await this.page.click(this.pendingApprovalsTab);
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch to approved tab
   */
  async switchToApprovedTab() {
    await this.page.click(this.approvedTab);
    await this.page.waitForTimeout(500);
  }
}

module.exports = { TimesheetManagementPage };
