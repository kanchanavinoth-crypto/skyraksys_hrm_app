import http from '../http-common';

class SalaryService {
  // Get salary structure for an employee
  async getSalaryStructure(employeeId) {
    const response = await http.get(`/salary-structures/employee/${employeeId}`);
    return response.data.data;
  }

  // Create salary structure for an employee
  async createSalaryStructure(employeeId, salaryData) {
    const response = await http.post('/salary-structures', {
      employeeId,
      ...salaryData,
      effectiveFrom: new Date().toISOString().split('T')[0] // Today's date
    });
    return response.data.data;
  }

  // Update salary structure
  async updateSalaryStructure(salaryStructureId, salaryData) {
    const response = await http.put(`/salary-structures/${salaryStructureId}`, salaryData);
    return response.data.data;
  }

  // Get all salary structures (admin/hr only)
  async getAllSalaryStructures() {
    const response = await http.get('/salary-structures');
    return response.data.data;
  }
}

export const salaryService = new SalaryService();
