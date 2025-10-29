import http from '../http-common';

class EmployeeService {
  // Get all employees (filtered by role)
  async getAll(params = {}) {
    console.log('🔧 EmployeeService.getAll called with params:', params);
    console.log('🔧 Making GET request to /employees with params:', JSON.stringify(params));
    const response = await http.get('/employees', { params });
    console.log('🔧 EmployeeService.getAll raw axios response:', response);
    console.log('🔧 EmployeeService.getAll config:', response.config);
    console.log('🔧 EmployeeService.getAll URL:', response.config.url);
    return response.data;
  }

  // Get employee by ID
  async get(id) {
    const response = await http.get(`/employees/${id}`);
    return response.data;
  }

  // Get employee by ID (alias for compatibility)
  async getById(id) {
    console.log('getById called with ID:', id);
    const response = await http.get(`/employees/${id}`);
    console.log('getById response:', response.data);
    // Backend returns { success: true, data: employee }, extract the employee object
    return response.data?.data || response.data;
  }

  // Get current user's employee profile
  async getMyProfile() {
    console.log('getMyProfile called');
    const response = await http.get('/employees/me');
    console.log('getMyProfile response:', response.data);
    return response.data;
  }

  // Get audit history for employee (placeholder)
  async getAuditHistory(employeeId) {
    // Return empty audit history for now since the endpoint doesn't exist yet
    return Promise.resolve({ 
      data: { 
        success: true, 
        data: [] 
      } 
    });
  }

  // Create new employee
  async create(data) {
    const response = await http.post('/employees', data);
    return response.data;
  }

  // Create new employee with photo
  async createWithPhoto(data, photo) {
    const formData = new FormData();
    
    // Handle complex objects separately - they need to be stringified for FormData
    const { salaryStructure, salary, ...employeeData } = data;
    
    // Add all simple employee form data (strings, numbers, dates)
    Object.keys(employeeData).forEach(key => {
      const value = employeeData[key];
      // Skip null, undefined, empty strings, and objects (objects should be handled separately)
      if (value !== null && value !== undefined && value !== '' && typeof value !== 'object') {
        formData.append(key, value);
      }
    });
    
    // Add salary as JSON string if it exists (comprehensive salary structure)
    if (salary && typeof salary === 'object') {
      formData.append('salary', JSON.stringify(salary));
    }
    
    // Add salary structure as JSON string if it exists (legacy format)
    if (salaryStructure && typeof salaryStructure === 'object') {
      formData.append('salaryStructure', JSON.stringify(salaryStructure));
    }
    
    // Add photo if provided
    if (photo) {
      formData.append('photo', photo);
    }
    
    const response = await http.post('/employees', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Upload photo for existing employee
  async uploadPhoto(employeeId, photo) {
    const formData = new FormData();
    formData.append('photo', photo);
    
    const response = await http.post(`/employees/${employeeId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Update employee
  async update(id, data) {
    console.log('EmployeeService update called with ID:', id, 'data:', data);
    const response = await http.put(`/employees/${id}`, data);
    console.log('Update response:', response.data);
    // Backend returns { success: true, data: employee }, extract the employee object
    return response.data?.data || response.data;
  }

  // Update employee compensation (salary)
  async updateCompensation(id, salary) {
    console.log('EmployeeService updateCompensation called with ID:', id, 'salary:', salary);
    const response = await http.put(`/employees/${id}/compensation`, { salary });
    console.log('UpdateCompensation response:', response.data);
    return response.data;
  }

  // Delete/deactivate employee
  async delete(id) {
    const response = await http.delete(`/employees/${id}`);
    return response.data;
  }

  // Get employee dashboard stats
  async getDashboardStats() {
    const response = await http.get('/employees/dashboard');
    return response.data;
  }

  // Get departments
  async getDepartments() {
    const response = await http.get('/employees/departments');
    return response;
  }

  // Get positions
  async getPositions() {
    const response = await http.get('/employees/meta/positions');
    return response;
  }

  // Search employees
  async search(query, filters = {}) {
    const params = { search: query, ...filters };
    const response = await http.get('/employees', { params });
    return response.data;
  }

  // Get employee statistics
  async getStatistics() {
    try {
      const response = await http.get('/employees/statistics');
      return response.data;
    } catch (error) {
      // Fallback to basic count if statistics endpoint doesn't exist
      const allEmployees = await this.getAll();
      const employees = allEmployees.data || allEmployees;
      
      const active = employees.filter(emp => emp.status === 'Active').length;
      const inactive = employees.filter(emp => emp.status === 'Inactive').length;
      const thisMonth = employees.filter(emp => {
        const hireDate = new Date(emp.hireDate);
        const now = new Date();
        return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear();
      }).length;

      return {
        data: {
          total: employees.length,
          active,
          inactive,
          newThisMonth: thisMonth
        }
      };
    }
  }

  // Update employee status
  async updateStatus(id, status) {
    const response = await http.patch(`/employees/${id}/status`, { status });
    return response.data;
  }

  // Export employees
  async exportEmployees(filters = {}) {
    const response = await http.get('/employees/export', { 
      params: filters,
      responseType: 'blob'
    });
    return response;
  }

  // Get managers for dropdown
  async getManagers() {
    try {
      const response = await http.get('/employees/managers');
      return response;
    } catch (error) {
      console.error('Error fetching managers:', error);
      // Fallback: get all employees and filter managers
      try {
        const allEmployees = await this.getAll();
        const employees = allEmployees.data || allEmployees;
        const managers = employees.filter(emp => 
          emp.position?.level === 'Manager' || 
          emp.position?.title?.toLowerCase().includes('manager') ||
          emp.role === 'manager'
        );
        return { data: { data: managers } };
      } catch (fallbackError) {
        console.error('Fallback manager fetch failed:', fallbackError);
        return { data: { data: [] } };
      }
    }
  }

  // Bulk operations
  async bulkUpdate(employeeIds, updateData) {
    const response = await http.post('/employees/bulk-update', {
      employeeIds,
      updateData
    });
    return response.data;
  }

  // Get employee by employee ID (not database ID)
  async getByEmployeeId(employeeId) {
    const response = await http.get(`/employees/by-employee-id/${employeeId}`);
    return response.data;
  }
}

export const employeeService = new EmployeeService();
