const { BasePage } = require('./BasePage');

/**
 * Employee List Page Object Model
 * Route: /employees
 * Main employee management interface with search, filters, and CRUD operations
 */
class EmployeeListPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Routes
    this.routes = {
      employeeList: '/employees',
      addEmployee: '/employees/add',
      addEmployeeModern: '/employees/add-modern',
      employeeProfile: (id) => `/employees/${id}`,
      editEmployee: (id) => `/employees/${id}/edit`,
      myProfile: '/my-profile'
    };
    
    // Page Header
    this.pageTitle = 'h4:has-text("Employee"), h5:has-text("Employee"), h6:has-text("Employee")';
    this.addEmployeeButton = 'button:has-text("Add Employee"), a[href="/employees/add"], button[aria-label*="add"]';
    this.addEmployeeFab = 'button.MuiFab-root:has-text("Add")';
    
    // Search and Filters
    this.searchInput = 'input[placeholder*="Search"], input[type="search"]';
    this.searchButton = 'button[aria-label="search"]';
    this.departmentFilter = 'select[name="department"], div[role="button"]:has-text("Department")';
    this.positionFilter = 'select[name="position"], div[role="button"]:has-text("Position")';
    this.statusFilter = 'select[name="status"], div[role="button"]:has-text("Status")';
    
    // View Toggle
    this.cardViewButton = 'button[aria-label*="card"], button:has(svg[data-testid="ViewModuleIcon"])';
    this.tableViewButton = 'button[aria-label*="table"], button:has(svg[data-testid="ViewListIcon"])';
    
    // Employee List - Card View
    this.employeeCard = '.MuiCard-root';
    this.employeeName = '.MuiCard-root h6, .MuiCard-root .MuiTypography-h6';
    this.employeeEmail = 'a[href^="mailto:"]';
    this.employeeDepartment = 'text=/Department|Dept/';
    this.employeePosition = 'text=/Position|Role/';
    this.employeeStatus = '.MuiChip-root';
    
    // Employee List - Table View
    this.employeeTable = 'table, [role="table"]';
    this.employeeTableRow = 'tr[role="row"], .MuiTableRow-root';
    this.employeeTableHeader = 'thead tr, [role="rowheader"]';
    this.employeeAvatar = '.MuiAvatar-root';
    
    // Action Buttons
    this.viewButton = 'button[aria-label*="view"], button:has-text("View")';
    this.editButton = 'button[aria-label*="edit"], button:has-text("Edit")';
    this.deleteButton = 'button[aria-label*="delete"], button:has-text("Delete")';
    this.moreActionsButton = 'button[aria-label="more"], button[aria-haspopup="menu"]';
    
    // Pagination
    this.pagination = '.MuiTablePagination-root';
    this.nextPageButton = 'button[aria-label="Go to next page"]';
    this.previousPageButton = 'button[aria-label="Go to previous page"]';
    this.rowsPerPageSelect = '.MuiTablePagination-select';
    
    // Delete Confirmation Dialog
    this.deleteDialog = '[role="dialog"]';
    this.confirmDeleteButton = 'button:has-text("Delete"), button:has-text("Confirm")';
    this.cancelDeleteButton = 'button:has-text("Cancel")';
    
    // Messages
    this.successMessage = '.MuiAlert-standardSuccess, .notistack-MuiContent-success';
    this.errorMessage = '.MuiAlert-standardError, .notistack-MuiContent-error';
    this.snackbar = '.MuiSnackbar-root';
    this.noDataMessage = 'text=/No employees|No data|No results/';
  }

  /**
   * Navigate to Employee List page
   */
  async navigateToEmployeeList() {
    await this.goto(this.routes.employeeList);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Navigate to Add Employee page
   */
  async navigateToAddEmployee() {
    await this.goto(this.routes.addEmployee);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search for employees
   */
  async searchEmployees(searchTerm) {
    await this.page.fill(this.searchInput, searchTerm);
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get all employee cards
   */
  async getEmployeeCards() {
    return await this.page.locator(this.employeeCard).all();
  }

  /**
   * Get all employee table rows
   */
  async getEmployeeRows() {
    return await this.page.locator(this.employeeTableRow).all();
  }

  /**
   * Get employee count
   */
  async getEmployeeCount() {
    const cards = await this.getEmployeeCards();
    const rows = await this.getEmployeeRows();
    return Math.max(cards.length, rows.length - 1); // -1 for header row
  }

  /**
   * Click on first employee in list
   */
  async clickFirstEmployee() {
    const firstCard = this.page.locator(this.employeeCard).first();
    const isVisible = await firstCard.isVisible().catch(() => false);
    
    if (isVisible) {
      await firstCard.click();
    } else {
      const firstRow = this.page.locator(this.employeeTableRow).nth(1); // Skip header
      await firstRow.click();
    }
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter employees by department
   */
  async filterByDepartment(department) {
    await this.page.click(this.departmentFilter);
    await this.page.click(`li:has-text("${department}")`);
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter employees by status
   */
  async filterByStatus(status) {
    await this.page.click(this.statusFilter);
    await this.page.click(`li:has-text("${status}")`);
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch to card view
   */
  async switchToCardView() {
    const cardViewBtn = this.page.locator(this.cardViewButton);
    const isVisible = await cardViewBtn.isVisible().catch(() => false);
    if (isVisible) {
      await cardViewBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Switch to table view
   */
  async switchToTableView() {
    const tableViewBtn = this.page.locator(this.tableViewButton);
    const isVisible = await tableViewBtn.isVisible().catch(() => false);
    if (isVisible) {
      await tableViewBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Delete employee by index
   */
  async deleteEmployee(index = 0) {
    const deleteButtons = this.page.locator(this.deleteButton);
    await deleteButtons.nth(index).click();
    
    // Wait for confirmation dialog
    await this.page.waitForSelector(this.deleteDialog);
    await this.page.click(this.confirmDeleteButton);
    await this.page.waitForLoadState('networkidle');
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
}

module.exports = { EmployeeListPage };
