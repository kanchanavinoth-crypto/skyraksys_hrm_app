import http from "../http-common";

/**
 * Enhanced API service with error handling and response transformation
 */
class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  // Generic API call method with error handling
  async apiCall(method, url, data = null, config = {}) {
    try {
      const response = await http({
        method,
        url: `${this.baseUrl}${url}`,
        data,
        ...config
      });
      
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: response.data.message || 'Operation successful'
      };
    } catch (error) {
      console.error(`API Error (${method.toUpperCase()} ${url}):`, error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'An unexpected error occurred';
      
      return {
        success: false,
        data: null,
        status: error.response?.status || 500,
        message: errorMessage,
        error: error.response?.data || error
      };
    }
  }

  // GET request
  async get(url, config = {}) {
    return this.apiCall('GET', url, null, config);
  }

  // POST request
  async post(url, data, config = {}) {
    return this.apiCall('POST', url, data, config);
  }

  // PUT request
  async put(url, data, config = {}) {
    return this.apiCall('PUT', url, data, config);
  }

  // DELETE request
  async delete(url, config = {}) {
    return this.apiCall('DELETE', url, null, config);
  }

  // PATCH request
  async patch(url, data, config = {}) {
    return this.apiCall('PATCH', url, data, config);
  }
}

/**
 * Enhanced Employee Service
 */
class EmployeeService extends ApiService {
  constructor() {
    super('/employees');
  }

  // Get all employees with optional filters
  async getAll(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `?${queryParams}` : '';
    return this.get(url);
  }

  // Get employee by ID
  async getById(id) {
    return this.get(`/${id}`);
  }

  // Create new employee
  async create(data) {
    return this.post('', data);
  }

  // Update employee
  async update(id, data) {
    return this.put(`/${id}`, data);
  }

  // Delete employee
  async delete(id) {
    return this.delete(`/${id}`);
  }

  // Get employees by department
  async getByDepartment(department) {
    return this.get(`?department=${encodeURIComponent(department)}`);
  }

  // Search employees
  async search(searchTerm) {
    return this.get(`/search?q=${encodeURIComponent(searchTerm)}`);
  }

  // Get employee statistics
  async getStatistics() {
    return this.get('/statistics');
  }
}

/**
 * Enhanced Leave Service
 */
class LeaveService extends ApiService {
  constructor() {
    super('/leaves');
  }

  // Get all leave requests with optional filters
  async getAll(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `?${queryParams}` : '';
    return this.get(url);
  }

  // Get leave request by ID
  async getById(id) {
    return this.get(`/${id}`);
  }

  // Create leave request
  async create(data) {
    return this.post('', data);
  }

  // Update leave request
  async update(id, data) {
    return this.put(`/${id}`, data);
  }

  // Delete leave request
  async delete(id) {
    return this.delete(`/${id}`);
  }

  // Get leave requests by employee
  async getByEmployee(employeeId) {
    return this.get(`?employeeId=${employeeId}`);
  }

  // Get leave balance for employee
  async getBalance(employeeId) {
    return this.get(`/balance/${employeeId}`);
  }

  // Approve leave request
  async approve(id, data = {}) {
    return this.patch(`/${id}/approve`, data);
  }

  // Reject leave request
  async reject(id, data = {}) {
    return this.patch(`/${id}/reject`, data);
  }

  // Get leave statistics
  async getStatistics() {
    return this.get('/statistics');
  }
}

/**
 * Enhanced Timesheet Service
 */
class TimesheetService extends ApiService {
  constructor() {
    super('/timesheets');
  }

  // Get all timesheets with optional filters
  async getAll(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `?${queryParams}` : '';
    return this.get(url);
  }

  // Get timesheet by ID
  async getById(id) {
    return this.get(`/${id}`);
  }

  // Create timesheet
  async create(data) {
    return this.post('', data);
  }

  // Update timesheet
  async update(id, data) {
    return this.put(`/${id}`, data);
  }

  // Delete timesheet
  async delete(id) {
    return this.delete(`/${id}`);
  }

  // Get timesheets by employee
  async getByEmployee(employeeId, dateRange = {}) {
    const params = new URLSearchParams({ employeeId, ...dateRange });
    return this.get(`?${params.toString()}`);
  }

  // Get timesheet summary
  async getSummary(employeeId, period) {
    return this.get(`/summary/${employeeId}?period=${period}`);
  }

  // Submit timesheet for approval
  async submit(id) {
    return this.patch(`/${id}/submit`);
  }

  // Approve timesheet
  async approve(id, data = {}) {
    return this.patch(`/${id}/approve`, data);
  }

  // Reject timesheet
  async reject(id, data = {}) {
    return this.patch(`/${id}/reject`, data);
  }
}

/**
 * Enhanced Payslip Service
 */
class PayslipService extends ApiService {
  constructor() {
    super('/payslips');
  }

  // Get all payslips with optional filters
  async getAll(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `?${queryParams}` : '';
    return this.get(url);
  }

  // Get payslip by ID
  async getById(id) {
    return this.get(`/${id}`);
  }

  // Create payslip
  async create(data) {
    return this.post('', data);
  }

  // Update payslip
  async update(id, data) {
    return this.put(`/${id}`, data);
  }

  // Delete payslip
  async delete(id) {
    return this.delete(`/${id}`);
  }

  // Get payslips by employee
  async getByEmployee(employeeId) {
    return this.get(`?employeeId=${employeeId}`);
  }

  // Generate payslip
  async generate(employeeId, payPeriod) {
    return this.post('/generate', { employeeId, payPeriod });
  }

  // Download payslip PDF
  async downloadPdf(id) {
    return this.get(`/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  // Get payroll statistics
  async getStatistics() {
    return this.get('/statistics');
  }
}

// Create service instances
export const employeeService = new EmployeeService();
export const leaveService = new LeaveService();
export const timesheetService = new TimesheetService();
export const payslipService = new PayslipService();

// Export individual services for backward compatibility
export default {
  employee: employeeService,
  leave: leaveService,
  timesheet: timesheetService,
  payslip: payslipService
};
