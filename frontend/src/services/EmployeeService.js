import http from "../http-common";

class EmployeeDataService {
  getAll(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Always request a high limit to get all employees (backend will enforce role-based max)
    queryParams.append('limit', '1000');
    
    if (params.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    
    const queryString = queryParams.toString();
    return http.get(`/employees${queryString ? `?${queryString}` : ''}`);
  }

  get(id) {
    return http.get(`/employees/${id}`);
  }

  create(data) {
    return http.post("/employees", data);
  }

  update(id, data) {
    return http.put(`/employees/${id}`, data);
  }

  delete(id) {
    return http.delete(`/employees/${id}`);
  }

  // Get active employees
  getActiveEmployees() {
    return this.getAll({ status: 'Active' });
  }
}

const employeeDataService = new EmployeeDataService();
export default employeeDataService;
