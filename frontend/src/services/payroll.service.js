import http from '../http-common';

class PayrollService {
  // Get all payroll records (filtered by role)
  async getAll(params = {}) {
    const response = await http.get('/payrolls', { params });
    return response.data;
  }

  // Get payroll by ID
  async get(id) {
    const response = await http.get(`/payrolls/${id}`);
    return response.data.data;
  }

  // Create payroll record
  async create(data) {
    const response = await http.post('/payrolls', data);
    return response.data.data;
  }

  // Update payroll status
  async updateStatus(id, status, notes = '') {
    const response = await http.put(`/payrolls/${id}/status`, {
      status,
      notes
    });
    return response.data.data;
  }

  // Get employee payroll summary
  async getEmployeeSummary(employeeId, params = {}) {
    const response = await http.get(`/payrolls/employee/${employeeId}/summary`, { params });
    return response.data.data;
  }

  // Get payroll dashboard
  async getDashboard() {
    const response = await http.get('/payrolls/dashboard');
    return response.data.data;
  }

  // Generate payslip
  async generatePayslip(payrollId) {
    const response = await http.post(`/payrolls/${payrollId}/generate-payslip`);
    return response.data.data;
  }

  // Download payslip
  async downloadPayslip(payrollId, format = 'pdf') {
    const response = await http.get(`/payrolls/${payrollId}/download`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  // Bulk process payroll
  async bulkProcess(data) {
    const response = await http.post('/payrolls/bulk-process', data);
    return response.data.data;
  }
}

export const payrollService = new PayrollService();
