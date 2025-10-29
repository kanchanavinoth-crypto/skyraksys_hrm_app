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

  // ============================================
  // Payslip Template Management
  // ============================================
  
  // Get all payslip templates
  async getPayslipTemplates() {
    const response = await http.get('/payslip-templates');
    return response.data;
  }

  // Get payslip template by ID
  async getPayslipTemplate(id) {
    const response = await http.get(`/payslip-templates/${id}`);
    return response.data;
  }

  // Create payslip template
  async createPayslipTemplate(data) {
    const response = await http.post('/payslip-templates', data);
    return response.data;
  }

  // Update payslip template
  async updatePayslipTemplate(id, data) {
    const response = await http.put(`/payslip-templates/${id}`, data);
    return response.data;
  }

  // Delete payslip template
  async deletePayslipTemplate(id) {
    const response = await http.delete(`/payslip-templates/${id}`);
    return response.data;
  }

  // Set default payslip template
  async setDefaultPayslipTemplate(id) {
    const response = await http.put(`/payslip-templates/${id}/set-default`);
    return response.data;
  }
}

export const payrollService = new PayrollService();
