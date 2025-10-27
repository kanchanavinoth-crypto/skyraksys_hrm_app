// Quick test script to create mock employee data for testing
const fs = require('fs');
const path = require('path');

// Create a temporary mock service for testing
const mockEmployeeService = `import http from "../http-common";

class EmployeeDataService {
  getAll() {
    // Mock data for testing
    const mockData = {
      data: [
        {
          id: 1,
          employeeId: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          department: 'Engineering',
          position: 'Software Developer',
          status: 'active'
        },
        {
          id: 2,
          employeeId: 'EMP002',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          department: 'HR',
          position: 'HR Manager',
          status: 'active'
        },
        {
          id: 3,
          employeeId: 'EMP003',
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob.johnson@example.com',
          department: 'Finance',
          position: 'Accountant',
          status: 'active'
        }
      ]
    };
    
    return Promise.resolve(mockData);
    
    // Real API call (commented out for testing)
    // return http.get("/employees");
  }

  get(id) {
    return http.get(\`/employees/\${id}\`);
  }

  create(data) {
    return http.post("/employees", data);
  }

  update(id, data) {
    return http.put(\`/employees/\${id}\`, data);
  }

  delete(id) {
    return http.delete(\`/employees/\${id}\`);
  }

  // Manager-specific methods
  getTeamMembers() {
    return http.get("/employees/team-members");
  }

  getTeamMembersByManager(managerId) {
    return http.get(\`/employees/manager/\${managerId}/team\`);
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
`;

// Write the mock service temporarily
const servicePath = path.resolve(__dirname, 'frontend/src/services/EmployeeService.mock.js');
fs.writeFileSync(servicePath, mockEmployeeService);

console.log('✅ Mock employee service created at:', servicePath);
console.log('📝 To use mock data, temporarily rename:');
console.log('   - EmployeeService.js → EmployeeService.real.js');
console.log('   - EmployeeService.mock.js → EmployeeService.js');
console.log('🔄 Don\'t forget to revert after testing!');
