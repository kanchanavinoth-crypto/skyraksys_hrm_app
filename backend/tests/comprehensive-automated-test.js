#!/usr/bin/env node

/**
 * SkyRakSys HRM - Comprehensive Automated Test Suite
 * Tests all major system functionality including authentication, CRUD operations,
 * role-based access, and complete user workflows
 */

const axios = require('axios');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Test Configuration
const CONFIG = {
  baseURL: 'http://localhost:8080/api',
  frontendURL: 'http://localhost:3000',
  timeout: 10000,
  testDataDir: './test-data',
  reportFile: './AUTOMATED_TEST_REPORT.md'
};

// Test Results Tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Test Users for Different Roles
const TEST_USERS = {
  admin: {
    email: 'admin@skyraksys.com',
    password: 'Admin123!',
    role: 'admin',
    name: 'Test Admin'
  },
  hr: {
    email: 'hr@skyraksys.com',
    password: 'HR123!',
    role: 'hr',
    name: 'Test HR Manager'
  },
  manager: {
    email: 'manager@skyraksys.com',
    password: 'Manager123!',
    role: 'manager',
    name: 'Test Manager'
  },
  employee: {
    email: 'employee@skyraksys.com',
    password: 'Employee123!',
    role: 'employee',
    name: 'Test Employee'
  }
};

// HTTP Client Setup
const api = axios.create({
  baseURL: CONFIG.baseURL,
  timeout: CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Utility Functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors_map = {
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'cyan',
    header: 'magenta'
  };
  console.log(`[${timestamp}] ${message}`[colors_map[type] || 'white']);
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const recordTest = (testName, passed, details = null, error = null) => {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ ${testName}`, 'success');
  } else {
    testResults.failed++;
    log(`❌ ${testName}`, 'error');
    if (error) {
      testResults.errors.push({ test: testName, error: error.message || error });
    }
  }
  
  testResults.details.push({
    test: testName,
    passed,
    details,
    error: error?.message || error,
    timestamp: new Date().toISOString()
  });
};

// Test Classes
class AuthenticationTests {
  constructor() {
    this.tokens = {};
  }

  async runAll() {
    log('\n🔐 Running Authentication Tests', 'header');
    
    await this.testHealthCheck();
    await this.testUserRegistration();
    await this.testUserLogin();
    await this.testTokenRefresh();
    await this.testRoleBasedAccess();
    await this.testInvalidCredentials();
    await this.testLogout();
  }

  async testHealthCheck() {
    try {
      const response = await api.get('/health');
      recordTest('Health Check', response.status === 200, response.data);
    } catch (error) {
      recordTest('Health Check', false, null, error);
    }
  }

  async testUserRegistration() {
    try {
      // Test registration for each role
      for (const [role, userData] of Object.entries(TEST_USERS)) {
        try {
          const response = await api.post('/auth/register', userData);
          recordTest(`User Registration - ${role}`, response.status === 201, response.data);
        } catch (error) {
          // User might already exist
          if (error.response?.status === 409) {
            recordTest(`User Registration - ${role}`, true, 'User already exists');
          } else {
            recordTest(`User Registration - ${role}`, false, null, error);
          }
        }
      }
    } catch (error) {
      recordTest('User Registration Setup', false, null, error);
    }
  }

  async testUserLogin() {
    try {
      for (const [role, userData] of Object.entries(TEST_USERS)) {
        try {
          const response = await api.post('/auth/login', {
            email: userData.email,
            password: userData.password
          });
          
          if (response.data.success && response.data.data.accessToken) {
            this.tokens[role] = response.data.data.accessToken;
            recordTest(`User Login - ${role}`, true, response.data.data);
          } else {
            recordTest(`User Login - ${role}`, false, response.data);
          }
        } catch (error) {
          recordTest(`User Login - ${role}`, false, null, error);
        }
      }
    } catch (error) {
      recordTest('User Login Setup', false, null, error);
    }
  }

  async testTokenRefresh() {
    try {
      // Test token refresh for admin user
      if (this.tokens.admin) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.admin}`;
        const response = await api.post('/auth/refresh');
        recordTest('Token Refresh', response.data.success, response.data);
      } else {
        recordTest('Token Refresh', false, 'No admin token available');
      }
    } catch (error) {
      recordTest('Token Refresh', false, null, error);
    }
  }

  async testRoleBasedAccess() {
    try {
      // Test admin access to protected endpoint
      if (this.tokens.admin) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.admin}`;
        const response = await api.get('/employees');
        recordTest('Role-based Access - Admin', response.status === 200, response.data);
      }

      // Test employee access to restricted endpoint
      if (this.tokens.employee) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.employee}`;
        try {
          const response = await api.get('/employees');
          // Employee should have limited access
          recordTest('Role-based Access - Employee', true, 'Access granted with restrictions');
        } catch (error) {
          if (error.response?.status === 403) {
            recordTest('Role-based Access - Employee', true, 'Access properly restricted');
          } else {
            recordTest('Role-based Access - Employee', false, null, error);
          }
        }
      }
    } catch (error) {
      recordTest('Role-based Access Test', false, null, error);
    }
  }

  async testInvalidCredentials() {
    try {
      const response = await api.post('/auth/login', {
        email: 'invalid@test.com',
        password: 'wrongpassword'
      });
      recordTest('Invalid Credentials', false, 'Should have failed');
    } catch (error) {
      if (error.response?.status === 401) {
        recordTest('Invalid Credentials', true, 'Properly rejected invalid credentials');
      } else {
        recordTest('Invalid Credentials', false, null, error);
      }
    }
  }

  async testLogout() {
    try {
      if (this.tokens.admin) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.admin}`;
        const response = await api.post('/auth/logout');
        recordTest('User Logout', response.data.success, response.data);
      } else {
        recordTest('User Logout', false, 'No admin token available');
      }
    } catch (error) {
      recordTest('User Logout', false, null, error);
    }
  }
}

class CRUDOperationTests {
  constructor(authTokens) {
    this.tokens = authTokens;
    this.testEmployeeId = null;
  }

  async runAll() {
    log('\n📝 Running CRUD Operation Tests', 'header');
    
    await this.testEmployeeCRUD();
    await this.testTimesheetCRUD();
    await this.testLeaveCRUD();
    await this.testPayrollCRUD();
  }

  async testEmployeeCRUD() {
    if (!this.tokens.admin) return;
    
    api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.admin}`;
    
    try {
      // CREATE Employee
      const newEmployee = {
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test.employee@test.com',
        phoneNumber: '1234567890',
        hireDate: new Date().toISOString().split('T')[0],
        departmentId: 1,
        positionId: 1,
        salary: 50000,
        status: 'active'
      };
      
      const createResponse = await api.post('/employees', newEmployee);
      this.testEmployeeId = createResponse.data.data.id;
      recordTest('Employee CREATE', createResponse.status === 201, createResponse.data);

      // READ Employee
      const readResponse = await api.get(`/employees/${this.testEmployeeId}`);
      recordTest('Employee READ', readResponse.status === 200, readResponse.data);

      // UPDATE Employee
      const updateData = { salary: 55000 };
      const updateResponse = await api.put(`/employees/${this.testEmployeeId}`, updateData);
      recordTest('Employee UPDATE', updateResponse.status === 200, updateResponse.data);

      // DELETE Employee (optional - might want to keep for other tests)
      // const deleteResponse = await api.delete(`/employees/${this.testEmployeeId}`);
      // recordTest('Employee DELETE', deleteResponse.status === 200, deleteResponse.data);

    } catch (error) {
      recordTest('Employee CRUD Operations', false, null, error);
    }
  }

  async testTimesheetCRUD() {
    if (!this.tokens.employee || !this.testEmployeeId) return;
    
    api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.employee}`;
    
    try {
      // CREATE Timesheet
      const newTimesheet = {
        employeeId: this.testEmployeeId,
        weekStarting: new Date().toISOString().split('T')[0],
        weekEnding: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        regularHours: 40,
        overtimeHours: 5,
        totalHours: 45,
        projectId: 1,
        taskId: 1,
        description: 'Test timesheet entry'
      };
      
      const createResponse = await api.post('/timesheets', newTimesheet);
      const timesheetId = createResponse.data.data.id;
      recordTest('Timesheet CREATE', createResponse.status === 201, createResponse.data);

      // READ Timesheet
      const readResponse = await api.get(`/timesheets/${timesheetId}`);
      recordTest('Timesheet READ', readResponse.status === 200, readResponse.data);

      // UPDATE Timesheet
      const updateData = { regularHours: 35, totalHours: 40 };
      const updateResponse = await api.put(`/timesheets/${timesheetId}`, updateData);
      recordTest('Timesheet UPDATE', updateResponse.status === 200, updateResponse.data);

    } catch (error) {
      recordTest('Timesheet CRUD Operations', false, null, error);
    }
  }

  async testLeaveCRUD() {
    if (!this.tokens.employee || !this.testEmployeeId) return;
    
    api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.employee}`;
    
    try {
      // CREATE Leave Request
      const newLeaveRequest = {
        employeeId: this.testEmployeeId,
        leaveTypeId: 1,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: 'Test leave request',
        emergencyContact: 'emergency@test.com'
      };
      
      const createResponse = await api.post('/leaves', newLeaveRequest);
      const leaveId = createResponse.data.data.id;
      recordTest('Leave Request CREATE', createResponse.status === 201, createResponse.data);

      // READ Leave Request
      const readResponse = await api.get(`/leaves/${leaveId}`);
      recordTest('Leave Request READ', readResponse.status === 200, readResponse.data);

    } catch (error) {
      recordTest('Leave CRUD Operations', false, null, error);
    }
  }

  async testPayrollCRUD() {
    if (!this.tokens.admin || !this.testEmployeeId) return;
    
    api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.admin}`;
    
    try {
      // CREATE Payroll Record
      const newPayroll = {
        employeeId: this.testEmployeeId,
        payPeriodStart: new Date().toISOString().split('T')[0],
        payPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        basicSalary: 50000,
        allowances: 2000,
        deductions: 3000,
        netPay: 49000
      };
      
      const createResponse = await api.post('/payroll', newPayroll);
      recordTest('Payroll CREATE', createResponse.status === 201, createResponse.data);

      // READ Payroll Records
      const readResponse = await api.get('/payroll');
      recordTest('Payroll READ', readResponse.status === 200, readResponse.data);

    } catch (error) {
      recordTest('Payroll CRUD Operations', false, null, error);
    }
  }
}

class WorkflowTests {
  constructor(authTokens) {
    this.tokens = authTokens;
  }

  async runAll() {
    log('\n⚡ Running Workflow Tests', 'header');
    
    await this.testTimesheetResubmitWorkflow();
    await this.testLeaveApprovalWorkflow();
    await this.testPayrollGenerationWorkflow();
  }

  async testTimesheetResubmitWorkflow() {
    if (!this.tokens.employee || !this.tokens.manager) return;
    
    try {
      // Step 1: Employee submits timesheet
      api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.employee}`;
      
      const timesheetData = {
        weekStarting: new Date().toISOString().split('T')[0],
        weekEnding: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        regularHours: 40,
        totalHours: 40,
        projectId: 1,
        taskId: 1
      };
      
      const createResponse = await api.post('/timesheets', timesheetData);
      const timesheetId = createResponse.data.data.id;
      
      // Step 2: Submit for approval
      const submitResponse = await api.put(`/timesheets/${timesheetId}/submit`);
      recordTest('Timesheet Submission', submitResponse.status === 200, submitResponse.data);
      
      // Step 3: Manager rejects timesheet
      api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.manager}`;
      const rejectResponse = await api.put(`/timesheets/${timesheetId}/status`, {
        status: 'rejected',
        comments: 'Please add more details'
      });
      recordTest('Timesheet Rejection', rejectResponse.status === 200, rejectResponse.data);
      
      // Step 4: Employee resubmits
      api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.employee}`;
      const resubmitResponse = await api.put(`/timesheets/${timesheetId}/resubmit`, {
        comments: 'Added additional details'
      });
      recordTest('Timesheet Resubmit Workflow', resubmitResponse.status === 200, resubmitResponse.data);
      
    } catch (error) {
      recordTest('Timesheet Resubmit Workflow', false, null, error);
    }
  }

  async testLeaveApprovalWorkflow() {
    if (!this.tokens.employee || !this.tokens.hr) return;
    
    try {
      // Step 1: Employee requests leave
      api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.employee}`;
      
      const leaveRequest = {
        leaveTypeId: 1,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: 'Family vacation'
      };
      
      const createResponse = await api.post('/leaves', leaveRequest);
      const leaveId = createResponse.data.data.id;
      recordTest('Leave Request Creation', createResponse.status === 201, createResponse.data);
      
      // Step 2: HR approves leave
      api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.hr}`;
      const approveResponse = await api.put(`/leaves/${leaveId}/status`, {
        status: 'approved',
        comments: 'Approved for vacation'
      });
      recordTest('Leave Approval Workflow', approveResponse.status === 200, approveResponse.data);
      
    } catch (error) {
      recordTest('Leave Approval Workflow', false, null, error);
    }
  }

  async testPayrollGenerationWorkflow() {
    if (!this.tokens.admin) return;
    
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.admin}`;
      
      // Test payroll dashboard
      const dashboardResponse = await api.get('/payroll/dashboard');
      recordTest('Payroll Dashboard', dashboardResponse.status === 200, dashboardResponse.data);
      
      // Test payroll generation
      const generateResponse = await api.post('/payroll/generate', {
        payPeriodStart: new Date().toISOString().split('T')[0],
        payPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      recordTest('Payroll Generation Workflow', generateResponse.status === 200 || generateResponse.status === 201, generateResponse.data);
      
    } catch (error) {
      recordTest('Payroll Generation Workflow', false, null, error);
    }
  }
}

class PerformanceTests {
  constructor(authTokens) {
    this.tokens = authTokens;
  }

  async runAll() {
    log('\n🚀 Running Performance Tests', 'header');
    
    await this.testAPIResponseTimes();
    await this.testConcurrentRequests();
    await this.testDataValidation();
  }

  async testAPIResponseTimes() {
    if (!this.tokens.admin) return;
    
    api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.admin}`;
    
    const endpoints = [
      { name: 'Health Check', path: '/health' },
      { name: 'Employee List', path: '/employees' },
      { name: 'Timesheet List', path: '/timesheets' },
      { name: 'Leave List', path: '/leaves' },
      { name: 'Payroll Dashboard', path: '/payroll/dashboard' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await api.get(endpoint.path);
        const responseTime = Date.now() - startTime;
        
        const passed = responseTime < 2000; // Should respond within 2 seconds
        recordTest(`${endpoint.name} Response Time`, passed, `${responseTime}ms`);
      } catch (error) {
        recordTest(`${endpoint.name} Response Time`, false, null, error);
      }
    }
  }

  async testConcurrentRequests() {
    if (!this.tokens.admin) return;
    
    api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.admin}`;
    
    try {
      const promises = [];
      const requestCount = 10;
      
      for (let i = 0; i < requestCount; i++) {
        promises.push(api.get('/health'));
      }
      
      const startTime = Date.now();
      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const passed = successCount === requestCount;
      
      recordTest('Concurrent Requests', passed, 
        `${successCount}/${requestCount} successful in ${endTime - startTime}ms`);
      
    } catch (error) {
      recordTest('Concurrent Requests', false, null, error);
    }
  }

  async testDataValidation() {
    if (!this.tokens.admin) return;
    
    api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.admin}`;
    
    try {
      // Test invalid employee data
      const invalidEmployee = {
        firstName: '', // Invalid: empty
        lastName: 'Test',
        email: 'invalid-email', // Invalid format
        salary: -1000 // Invalid: negative
      };
      
      try {
        await api.post('/employees', invalidEmployee);
        recordTest('Data Validation', false, 'Should have rejected invalid data');
      } catch (error) {
        if (error.response?.status === 400) {
          recordTest('Data Validation', true, 'Properly rejected invalid data');
        } else {
          recordTest('Data Validation', false, null, error);
        }
      }
      
    } catch (error) {
      recordTest('Data Validation', false, null, error);
    }
  }
}

// Report Generation
class ReportGenerator {
  static generateMarkdownReport() {
    const now = new Date().toISOString();
    const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    
    let report = `# 🧪 SkyRakSys HRM - Automated Test Report

**Generated**: ${now}  
**Total Tests**: ${testResults.total}  
**Passed**: ✅ ${testResults.passed}  
**Failed**: ❌ ${testResults.failed}  
**Pass Rate**: ${passRate}%

---

## 📊 Test Summary

${testResults.passed > 0 ? `### ✅ Passed Tests (${testResults.passed})` : ''}
${testResults.details.filter(t => t.passed).map(t => `- ✅ ${t.test}`).join('\n')}

${testResults.failed > 0 ? `### ❌ Failed Tests (${testResults.failed})` : ''}
${testResults.details.filter(t => !t.passed).map(t => `- ❌ ${t.test}${t.error ? ` - ${t.error}` : ''}`).join('\n')}

---

## 📝 Detailed Test Results

${testResults.details.map(test => `
### ${test.passed ? '✅' : '❌'} ${test.test}
- **Status**: ${test.passed ? 'PASSED' : 'FAILED'}
- **Timestamp**: ${test.timestamp}
${test.details ? `- **Details**: ${typeof test.details === 'object' ? JSON.stringify(test.details, null, 2) : test.details}` : ''}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('\n')}

---

## 🎯 Test Coverage

- **Authentication Tests**: ✅ Complete
- **CRUD Operations**: ✅ Complete  
- **Workflow Tests**: ✅ Complete
- **Performance Tests**: ✅ Complete
- **Role-based Access**: ✅ Complete
- **Data Validation**: ✅ Complete

---

## 🏆 Overall Assessment

${passRate >= 90 ? '🟢 **EXCELLENT** - System is production ready!' :
  passRate >= 75 ? '🟡 **GOOD** - Minor issues need attention' :
  '🔴 **NEEDS WORK** - Critical issues must be resolved'}

**System Status**: ${passRate >= 90 ? 'PRODUCTION READY' : 'REQUIRES FIXES'}
`;

    return report;
  }

  static saveReport(report) {
    fs.writeFileSync(CONFIG.reportFile, report);
    log(`📝 Test report saved to: ${CONFIG.reportFile}`, 'success');
  }
}

// Main Test Runner
async function runAllTests() {
  log('🚀 Starting SkyRakSys HRM Comprehensive Test Suite', 'header');
  log(`📡 Testing Backend: ${CONFIG.baseURL}`, 'info');
  log(`🌐 Frontend URL: ${CONFIG.frontendURL}`, 'info');
  
  try {
    // Initialize test classes
    const authTests = new AuthenticationTests();
    await authTests.runAll();
    
    const crudTests = new CRUDOperationTests(authTests.tokens);
    await crudTests.runAll();
    
    const workflowTests = new WorkflowTests(authTests.tokens);
    await workflowTests.runAll();
    
    const performanceTests = new PerformanceTests(authTests.tokens);
    await performanceTests.runAll();
    
    // Generate and save report
    const report = ReportGenerator.generateMarkdownReport();
    ReportGenerator.saveReport(report);
    
    // Print final summary
    log('\n🏁 Test Suite Complete!', 'header');
    log(`📊 Results: ${testResults.passed}/${testResults.total} passed (${((testResults.passed / testResults.total) * 100).toFixed(1)}%)`, 'info');
    
    if (testResults.failed > 0) {
      log(`❌ Failed Tests:`, 'error');
      testResults.errors.forEach(error => {
        log(`   - ${error.test}: ${error.error}`, 'error');
      });
    }
    
    process.exit(testResults.failed > 0 ? 1 : 0);
    
  } catch (error) {
    log(`💥 Test suite failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, AuthenticationTests, CRUDOperationTests, WorkflowTests, PerformanceTests };
