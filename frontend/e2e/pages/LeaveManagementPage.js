const { BasePage } = require('./BasePage');

/**
 * Leave Management Page Object Model
 * Route: /leave-management
 * Main leave management interface with tabs for requests, balance, and approvals
 */
class LeaveManagementPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Routes
    this.routes = {
      leaveManagement: '/leave-management',
      addLeaveRequest: '/add-leave-request',
      leaveRequests: '/leave-requests',
      leaveBalances: '/admin/leave-balances'
    };
    
    // Tabs (Material-UI Tabs component)
    this.myRequestsTab = 'button[role="tab"]:has-text("All")';
    this.newRequestButton = 'button:has-text("Add Request")';
    this.pendingTab = 'button[role="tab"]:has-text("Pending")';
    this.approvedTab = 'button[role="tab"]:has-text("Approved")';
    this.rejectedTab = 'button[role="tab"]:has-text("Rejected")';
    
    // Add Leave Request Form (AddLeaveRequestModern component with ValidatedLeaveRequestForm)
    this.leaveTypeSelect = 'select#leaveTypeId, div[role="button"]:has-text("Select Leave Type")';
    this.startDateInput = 'input[name="startDate"], input#startDate';
    this.endDateInput = 'input[name="endDate"], input#endDate';
    this.reasonTextarea = 'textarea[name="reason"], textarea#reason';
    this.isStartHalfDayCheckbox = 'input[name="isStartHalfDay"]';
    this.isEndHalfDayCheckbox = 'input[name="isEndHalfDay"]';
    this.submitButton = 'button[type="submit"]:has-text("Submit")';
    this.cancelButton = 'button:has-text("Cancel")';
    
    // Request List / Table
    this.requestsTable = 'table, [role="table"]';
    this.requestRow = 'tr[role="row"], .MuiTableRow-root';
    this.requestCard = '.MuiCard-root'; // For mobile view
    this.statusChip = '.MuiChip-root';
    this.viewButton = 'button:has-text("View")';
    this.editButton = 'button[aria-label*="edit"], button:has-text("Edit")';
    this.deleteButton = 'button[aria-label*="delete"], button:has-text("Delete")';
    
    // Filters and Search
    this.searchInput = 'input[placeholder*="Search"], input[type="search"]';
    this.statusFilter = 'select[name="status"], [role="button"]:has-text("Status")';
    this.typeFilter = 'select[name="type"], [role="button"]:has-text("Type")';
    this.filterButton = 'button[aria-label="filter"], button:has-text("Filter")';
    
    // Success/Error Messages (Material-UI Alert and Notistack)
    this.successMessage = '.MuiAlert-standardSuccess, .notistack-MuiContent-success';
    this.errorMessage = '.MuiAlert-standardError, .notistack-MuiContent-error';
    this.snackbar = '.MuiSnackbar-root';
    
    // Manager Approval Dialog
    this.approveButton = 'button:has-text("Approve")';
    this.rejectButton = 'button:has-text("Reject")';
    this.approvalDialog = '[role="dialog"]';
    this.approvalCommentsTextarea = 'textarea[name="comments"], textarea[placeholder*="comment"]';
    this.confirmApprovalButton = 'button:has-text("Confirm")';
    
    // Leave Balance Section
    this.leaveBalanceCard = '.MuiCard-root:has-text("Leave Balance")';
    this.annualLeaveBalance = 'text=Annual Leave';
    this.sickLeaveBalance = 'text=Sick Leave';
  }

  /**
   * Navigate to Leave Management page
   */
  async navigateToLeaveManagement() {
    await this.goto(this.routes.leaveManagement);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Wait for data to load
  }

  /**
   * Switch to New Request tab
   */
  async clickNewRequestTab() {
    await this.page.click(this.newRequestTab);
    await this.waitForElement(this.leaveTypeSelect);
  }

  /**
   * Fill leave request form
   * @param {Object} leaveData - Leave request data
   */
  async fillLeaveRequestForm({ leaveType, startDate, endDate, reason }) {
    if (leaveType) {
      await this.page.selectOption(this.leaveTypeSelect, leaveType);
    }
    
    if (startDate) {
      await this.page.fill(this.startDateInput, startDate);
    }
    
    if (endDate) {
      await this.page.fill(this.endDateInput, endDate);
    }
    
    if (reason) {
      await this.page.fill(this.reasonTextarea, reason);
    }
  }

  /**
   * Submit leave request
   */
  async submitLeaveRequest() {
    await this.page.click(this.submitButton);
    await this.page.waitForTimeout(1000); // Wait for submission
  }

  /**
   * Create a complete leave request
   * @param {Object} leaveData - Leave request data
   */
  async createLeaveRequest(leaveData) {
    await this.clickNewRequestTab();
    await this.fillLeaveRequestForm(leaveData);
    await this.submitLeaveRequest();
  }

  /**
   * Get all leave requests from table
   * @returns {Array} Array of leave request data
   */
  async getLeaveRequests() {
    const rows = await this.page.$$(this.requestRow);
    const requests = [];
    
    for (const row of rows) {
      const text = await row.textContent();
      if (text && !text.includes('Leave Type')) { // Skip header
        requests.push(text);
      }
    }
    
    return requests;
  }

  /**
   * Check if leave request exists
   * @param {string} searchText - Text to search for in requests
   * @returns {boolean}
   */
  async leaveRequestExists(searchText) {
    const requests = await this.getLeaveRequests();
    return requests.some(req => req.includes(searchText));
  }

  /**
   * Get status of first leave request
   * @returns {string} Status text
   */
  async getFirstRequestStatus() {
    const statusElement = await this.page.$(this.statusChip);
    if (statusElement) {
      return await statusElement.textContent();
    }
    return null;
  }

  /**
   * Filter leave requests by status
   * @param {string} status - Status to filter by
   */
  async filterByStatus(status) {
    await this.page.selectOption(this.statusFilter, status);
    await this.page.waitForTimeout(500);
  }

  /**
   * Click My Requests tab
   */
  async clickMyRequestsTab() {
    await this.page.click(this.myRequestsTab);
    await this.page.waitForTimeout(500);
  }

  /**
   * Click Leave Balance tab
   */
  async clickLeaveBalanceTab() {
    await this.page.click(this.leaveBalanceTab);
    await this.page.waitForTimeout(500);
  }

  /**
   * Approve a leave request (for managers)
   * @param {string} employeeName - Name of employee
   * @param {string} comments - Approval comments
   */
  async approveLeaveRequest(employeeName, comments) {
    // Find the request row
    const row = await this.page.$(`tr:has-text("${employeeName}")`);
    if (row) {
      await row.click();
    }
    
    if (comments) {
      await this.page.fill(this.approvalCommentsTextarea, comments);
    }
    
    await this.page.click(this.approveButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Reject a leave request (for managers)
   * @param {string} employeeName - Name of employee
   * @param {string} comments - Rejection comments
   */
  async rejectLeaveRequest(employeeName, comments) {
    const row = await this.page.$(`tr:has-text("${employeeName}")`);
    if (row) {
      await row.click();
    }
    
    if (comments) {
      await this.page.fill(this.approvalCommentsTextarea, comments);
    }
    
    await this.page.click(this.rejectButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify success message is displayed
   * @param {string} expectedText - Expected success message text
   * @returns {boolean}
   */
  async verifySuccessMessage(expectedText) {
    const message = await this.page.textContent(this.successMessage);
    return message && message.includes(expectedText);
  }

  /**
   * Verify error message is displayed
   * @param {string} expectedText - Expected error message text
   * @returns {boolean}
   */
  async verifyErrorMessage(expectedText) {
    const message = await this.page.textContent(this.errorMessage);
    return message && message.includes(expectedText);
  }
}

module.exports = { LeaveManagementPage };
