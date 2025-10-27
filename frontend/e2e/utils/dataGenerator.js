/**
 * Test Data Generator Utilities
 * Generates unique test data for E2E tests
 */

export class DataGenerator {
  /**
   * Generate unique employee ID
   */
  static generateEmployeeId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `SKYT${timestamp}${random}`.substring(0, 15);
  }

  /**
   * Generate unique email
   */
  static generateEmail(prefix = 'test') {
    const timestamp = Date.now();
    return `${prefix}.${timestamp}@skyraksys.com`;
  }

  /**
   * Generate random phone number
   */
  static generatePhoneNumber() {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    return `${areaCode}-${prefix}-${lineNumber}`;
  }

  /**
   * Generate employee data
   */
  static generateEmployeeData(overrides = {}) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    return {
      employeeId: this.generateEmployeeId(),
      firstName: `Test${random}`,
      lastName: `Employee${timestamp}`,
      email: this.generateEmail('employee'),
      phone: this.generatePhoneNumber(),
      dateOfBirth: '1990-01-15',
      gender: 'Male',
      address: `${random} Test Street`,
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country',
      department: 'IT',
      position: 'Software Engineer',
      dateOfJoining: new Date().toISOString().split('T')[0],
      employmentType: 'Full-Time',
      salary: 50000 + Math.floor(Math.random() * 50000),
      ...overrides
    };
  }

  /**
   * Generate timesheet data
   */
  static generateTimesheetData(weekDate, overrides = {}) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const projects = ['Project Alpha', 'Project Beta', 'Project Gamma'];
    const tasks = ['Development', 'Testing', 'Documentation', 'Meetings'];

    return {
      weekStartDate: weekDate,
      project: projects[Math.floor(Math.random() * projects.length)],
      task: tasks[Math.floor(Math.random() * tasks.length)],
      hours: days.reduce((acc, day) => {
        acc[day] = Math.floor(Math.random() * 8) + 1; // 1-8 hours
        return acc;
      }, {}),
      ...overrides
    };
  }

  /**
   * Generate leave request data
   */
  static generateLeaveData(overrides = {}) {
    const leaveTypes = ['Vacation', 'Sick Leave', 'Personal Leave', 'Maternity Leave'];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Start 7 days from now
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1); // 1-5 days

    return {
      leaveType: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      reason: `Test leave request - ${Date.now()}`,
      ...overrides
    };
  }

  /**
   * Generate payroll data
   */
  static generatePayrollData(employeeId, overrides = {}) {
    const baseSalary = 50000 + Math.floor(Math.random() * 50000);
    
    return {
      employeeId,
      baseSalary,
      bonus: Math.floor(baseSalary * 0.1),
      deductions: Math.floor(baseSalary * 0.15),
      netSalary: baseSalary + Math.floor(baseSalary * 0.1) - Math.floor(baseSalary * 0.15),
      payPeriod: new Date().toISOString().split('T')[0],
      ...overrides
    };
  }

  /**
   * Generate random string
   */
  static randomString(length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random number
   */
  static randomNumber(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate date in format YYYY-MM-DD
   */
  static generateDate(daysFromNow = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get current week start date (Monday)
   */
  static getCurrentWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return monday.toISOString().split('T')[0];
  }

  /**
   * Get previous week start date
   */
  static getPreviousWeekStart() {
    const currentWeek = this.getCurrentWeekStart();
    const date = new Date(currentWeek);
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate valid ESI number
   */
  static generateESINumber() {
    const random = Math.floor(Math.random() * 100000000);
    return `ESI${random.toString().padStart(8, '0')}`;
  }

  /**
   * Generate valid PF number
   */
  static generatePFNumber() {
    const random = Math.floor(Math.random() * 100000000);
    return `PF${random.toString().padStart(8, '0')}`;
  }

  /**
   * Generate bulk employee data
   */
  static generateBulkEmployees(count = 10) {
    const employees = [];
    for (let i = 0; i < count; i++) {
      employees.push(this.generateEmployeeData({
        firstName: `TestUser${i}`,
        lastName: `Bulk${i}`
      }));
    }
    return employees;
  }

  /**
   * Generate test credentials
   */
  static generateTestCredentials() {
    return {
      username: `test_user_${Date.now()}`,
      password: `Test@${this.randomString(8)}`,
      email: this.generateEmail('testuser')
    };
  }
}

export default DataGenerator;
