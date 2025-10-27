import { BasePage } from './BasePage';

/**
 * Employee Management Page Object Model
 */
export class EmployeePage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.addEmployeeButton = 'button:has-text("Add Employee"), [aria-label="Add Employee"]';
    this.employeeTable = 'table, .employee-list, [role="grid"]';
    this.searchInput = 'input[placeholder*="Search"], .search-input';
    this.filterButton = 'button:has-text("Filter"), [aria-label="Filter"]';
    this.editButton = 'button:has-text("Edit"), [aria-label="Edit"]';
    this.deleteButton = 'button:has-text("Delete"), [aria-label="Delete"]';
    this.viewButton = 'button:has-text("View"), [aria-label="View"]';
    
    // Form fields
    this.firstNameInput = 'input[name="firstName"]';
    this.lastNameInput = 'input[name="lastName"]';
    this.emailInput = 'input[name="email"]';
    this.phoneInput = 'input[name="phone"]';
    this.employeeIdInput = 'input[name="employeeId"]';
    this.departmentSelect = 'select[name="department"], [aria-label="Department"]';
    this.positionSelect = 'select[name="position"], [aria-label="Position"]';
    this.saveButton = 'button[type="submit"], button:has-text("Save")';
    this.cancelButton = 'button:has-text("Cancel")';
  }

  /**
   * Navigate to employee page
   */
  async navigate() {
    await this.goto('/employees');
    await this.waitForElement(this.employeeTable);
  }

  /**
   * Click add employee button
   */
  async clickAddEmployee() {
    await this.click(this.addEmployeeButton);
  }

  /**
   * Fill employee form
   */
  async fillEmployeeForm(employeeData) {
    if (employeeData.firstName) {
      await this.fill(this.firstNameInput, employeeData.firstName);
    }
    if (employeeData.lastName) {
      await this.fill(this.lastNameInput, employeeData.lastName);
    }
    if (employeeData.email) {
      await this.fill(this.emailInput, employeeData.email);
    }
    if (employeeData.phone) {
      await this.fill(this.phoneInput, employeeData.phone);
    }
    if (employeeData.employeeId) {
      await this.fill(this.employeeIdInput, employeeData.employeeId);
    }
    if (employeeData.department) {
      await this.selectOption(this.departmentSelect, employeeData.department);
    }
    if (employeeData.position) {
      await this.selectOption(this.positionSelect, employeeData.position);
    }
  }

  /**
   * Save employee
   */
  async saveEmployee() {
    await this.click(this.saveButton);
    await this.waitForNavigation();
  }

  /**
   * Cancel employee form
   */
  async cancelEmployeeForm() {
    await this.click(this.cancelButton);
  }

  /**
   * Search employee
   */
  async searchEmployee(searchTerm) {
    await this.fill(this.searchInput, searchTerm);
    await this.press(this.searchInput, 'Enter');
    await this.page.waitForTimeout(1000); // Wait for search results
  }

  /**
   * Get employee count
   */
  async getEmployeeCount() {
    const rows = await this.getElements('tbody tr, .employee-row');
    return rows.length;
  }

  /**
   * Click edit for employee
   */
  async editEmployee(employeeId) {
    const row = `tr:has-text("${employeeId}"), .employee-row:has-text("${employeeId}")`;
    await this.page.locator(row).locator(this.editButton).click();
  }

  /**
   * Click view for employee
   */
  async viewEmployee(employeeId) {
    const row = `tr:has-text("${employeeId}"), .employee-row:has-text("${employeeId}")`;
    await this.page.locator(row).locator(this.viewButton).click();
  }

  /**
   * Delete employee
   */
  async deleteEmployee(employeeId) {
    const row = `tr:has-text("${employeeId}"), .employee-row:has-text("${employeeId}")`;
    await this.page.locator(row).locator(this.deleteButton).click();
    
    // Confirm deletion if modal appears
    const confirmButton = 'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")';
    await this.click(confirmButton);
    await this.waitForNavigation();
  }

  /**
   * Check if employee exists in table
   */
  async employeeExists(employeeId) {
    const row = `tr:has-text("${employeeId}"), .employee-row:has-text("${employeeId}")`;
    return await this.isVisible(row);
  }

  /**
   * Get employee details from table
   */
  async getEmployeeDetails(employeeId) {
    const row = await this.page.locator(`tr:has-text("${employeeId}")`).first();
    const cells = await row.locator('td').allTextContents();
    return cells;
  }
}
