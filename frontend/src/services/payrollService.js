import http from "../http-common";

class PayrollDataService {
  getAll() {
    return http.get("/payroll");
  }

  get(id) {
    return http.get(`/payroll/${id}`);
  }

  create(data) {
    return http.post("/payroll", data);
  }

  update(id, data) {
    return http.put(`/payroll/${id}`, data);
  }

  delete(id) {
    return http.delete(`/payroll/${id}`);
  }

  generatePayroll(data) {
    return http.post("/payroll/generate", data);
  }

  getByEmployeeId(employeeId) {
    return http.get(`/payroll?employeeId=${employeeId}`);
  }

  getPayslip(payrollId) {
    return http.get(`/payroll/${payrollId}/payslip`);
  }

  downloadPayslip(payrollId) {
    return http.get(`/payroll/${payrollId}/payslip/download`, {
      responseType: 'blob'
    });
  }

  // Payslip Template Management
  getPayslipTemplates() {
    return http.get("/payroll/templates");
  }

  getPayslipTemplate(id) {
    return http.get(`/payroll/templates/${id}`);
  }

  createPayslipTemplate(data) {
    return http.post("/payroll/templates", data);
  }

  updatePayslipTemplate(id, data) {
    return http.put(`/payroll/templates/${id}`, data);
  }

  deletePayslipTemplate(id) {
    return http.delete(`/payroll/templates/${id}`);
  }

  setDefaultPayslipTemplate(id) {
    return http.put(`/payroll/templates/${id}/set-default`);
  }

  getDefaultPayslipTemplate() {
    return http.get("/payroll/templates/default");
  }

  // Payroll Processing
  processPayroll(data) {
    return http.post("/payroll/process", data);
  }

  approvePayroll(payrollId, data) {
    return http.put(`/payroll/${payrollId}/approve`, data);
  }

  rejectPayroll(payrollId, data) {
    return http.put(`/payroll/${payrollId}/reject`, data);
  }

  // Payroll Reports
  getPayrollSummary(month, year) {
    return http.get(`/payroll/summary?month=${month}&year=${year}`);
  }

  getPayrollReport(params) {
    return http.get("/payroll/report", { params });
  }

  exportPayrollReport(params) {
    return http.get("/payroll/report/export", { 
      params,
      responseType: 'blob'
    });
  }
}

const payrollDataService = new PayrollDataService();
export default payrollDataService;
