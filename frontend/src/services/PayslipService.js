import http from "../http-common";

// Legacy class for backward compatibility
class PayslipDataService {
  getAll() {
    return http.get("/payslips");
  }

  get(id) {
    return http.get(`/payslips/${id}`);
  }

  create(data) {
    return http.post("/payslips", data);
  }

  update(id, data) {
    return http.put(`/payslips/${id}`, data);
  }

  delete(id) {
    return http.delete(`/payslips/${id}`);
  }

  generate(employeeId, payPeriodStart, payPeriodEnd) {
    return http.post("/payslips/generate", {
      employeeId,
      payPeriodStart,
      payPeriodEnd
    });
  }

  process(id, processedBy) {
    return http.put(`/payslips/${id}/process`, { processedBy });
  }

  markAsPaid(id, bankReference = null) {
    return http.put(`/payslips/${id}/paid`, { bankReference });
  }

  getPayrollSummary(month = null, department = null) {
    let url = "/payslips/summary/payroll";
    const params = new URLSearchParams();
    
    if (month) params.append('month', month);
    if (department) params.append('department', department);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return http.get(url);
  }

  findByEmployee(employeeId, year = null, month = null) {
    let url = "/payslips";
    const params = new URLSearchParams();
    
    params.append('employeeId', employeeId);
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    
    url += `?${params.toString()}`;
    return http.get(url);
  }

  findByStatus(status) {
    return http.get(`/payslips?status=${status}`);
  }

  findByMonth(month) {
    return http.get(`/payslips?month=${month}`);
  }

  findByYear(year) {
    return http.get(`/payslips?year=${year}`);
  }
}

// New comprehensive services
export const payslipService = {
  // Get all payslips with filters
  getPayslips: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    const response = await http.get(`/payslips?${params.toString()}`);
    return response.data;
  },

  // Get single payslip
  getPayslip: async (id) => {
    const response = await http.get(`/payslips/${id}`);
    return response.data;
  },

  // Create new payslip
  createPayslip: async (payslipData) => {
    const response = await http.post('/payslips', payslipData);
    return response.data;
  },

  // Update payslip
  updatePayslip: async (id, updateData) => {
    const response = await http.put(`/payslips/${id}`, updateData);
    return response.data;
  },

  // Lock payslip
  lockPayslip: async (id) => {
    const response = await http.post(`/payslips/${id}/lock`);
    return response.data;
  },

  // Unlock payslip
  unlockPayslip: async (id, force = false) => {
    const response = await http.post(`/payslips/${id}/unlock`, { force });
    return response.data;
  },

  // Mark payslip as paid
  markAsPaid: async (id) => {
    const response = await http.post(`/payslips/${id}/mark-paid`);
    return response.data;
  },

  // Download payslip PDF
  downloadPDF: async (id) => {
    const response = await http.get(`/payslips/${id}/pdf`, {
      responseType: 'blob'
    });
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payslip_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },

  // Generate bulk payslips
  generateBulkPayslips: async (payrollDataIds, templateId) => {
    const response = await http.post('/payslips/bulk-generate', {
      payrollDataIds,
      templateId
    });
    return response.data;
  },

  // Delete payslip
  deletePayslip: async (id) => {
    const response = await http.delete(`/payslips/${id}`);
    return response.data;
  }
};

// Payslip Template Service
export const payslipTemplateService = {
  // Get all templates
  getTemplates: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    const response = await http.get(`/payslip-templates?${params.toString()}`);
    return response.data;
  },

  // Get active templates only
  getActiveTemplates: async () => {
    const response = await http.get('/payslip-templates/active');
    return response.data;
  },

  // Get single template
  getTemplate: async (id) => {
    const response = await http.get(`/payslip-templates/${id}`);
    return response.data;
  },

  // Create new template
  createTemplate: async (templateData) => {
    const response = await http.post('/payslip-templates', templateData);
    return response.data;
  },

  // Update template
  updateTemplate: async (id, updateData) => {
    const response = await http.put(`/payslip-templates/${id}`, updateData);
    return response.data;
  },

  // Get default template
  getDefaultTemplate: async () => {
    const response = await http.get('/payslip-templates/default/template');
    return response.data;
  }
};

// Salary Structure Service
export const salaryStructureService = {
  // Get current active salary structure for employee
  getCurrentSalaryStructure: async (employeeId) => {
    const response = await http.get(`/salary-structures/employee/${employeeId}/current`);
    return response.data;
  },

  // Create new salary structure
  createSalaryStructure: async (salaryData) => {
    const response = await http.post('/salary-structures', salaryData);
    return response.data;
  }
};

// Payroll Data Service
export const payrollDataService = {
  // Get all payroll data
  getPayrollData: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    const response = await http.get(`/payroll-data?${params.toString()}`);
    return response.data;
  },

  // Create new payroll data
  createPayrollData: async (payrollData) => {
    const response = await http.post('/payroll-data', payrollData);
    return response.data;
  },

  // Import payroll data from CSV
  importFromCSV: async (csvFile) => {
    const formData = new FormData();
    formData.append('csvFile', csvFile);
    
    const response = await http.post('/payroll-data/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// Utility functions
export const payslipUtils = {
  // Validate and calculate payslip totals
  validatePayslipData: (earnings, deductions) => {
    const earningsTotal = Object.values(earnings || {})
      .reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
    
    const deductionsTotal = Object.values(deductions || {})
      .reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
    
    const netPay = earningsTotal - deductionsTotal;
    
    return {
      grossEarnings: earningsTotal,
      totalDeductions: deductionsTotal,
      netPay,
      isValid: earningsTotal > 0 && netPay >= 0
    };
  },

  // Format currency for display
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  },

  // Get month name from number
  getMonthName: (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  }
};

export default new PayslipDataService();
