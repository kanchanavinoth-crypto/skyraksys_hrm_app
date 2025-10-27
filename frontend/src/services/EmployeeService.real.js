import http from "../http-common";

class EmployeeDataService {
  getAll() {
    return http.get("/employees");
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

  // Manager-specific methods
  getTeamMembers() {
    return http.get("/employees/team-members");
  }

  getTeamMembersByManager(managerId) {
    return http.get(`/employees/manager/${managerId}/team`);
  }

  // Additional methods for enhanced functionality
  getManagers() {
    return http.get("/employees/managers");
  }

  getDepartments() {
    return http.get("/employees/departments");
  }

  getPositions() {
    return http.get("/employees/positions");
  }
}

const employeeDataService = new EmployeeDataService();
export default employeeDataService;
