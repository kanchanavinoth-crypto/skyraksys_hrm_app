const axios = require('axios');
const fs = require('fs');

// Comprehensive API and Use Case Testing - Scenario by Scenario
const API_BASE_URL = 'http://localhost:8080/api';

// Working credentials
const TEST_USERS = {
  admin: { email: 'admin@company.com', password: 'Kx9mP7qR2nF8sA5t', role: 'admin' },
  hr: { email: 'hr@company.com', password: 'Lw3nQ6xY8mD4vB7h', role: 'hr' },
  manager: { email: 'admin@test.com', password: 'Nx7rT5yU3mK9sD6g', role: 'manager' },
  employee: { email: 'employee@company.com', password: 'Mv4pS9wE2nR6kA8j', role: 'employee' }
};

// Complete API endpoint mapping
const API_ENDPOINTS = {
  // Authentication APIs
  auth: {
    login: { method: 'POST', path: '/auth/login', roles: ['public'] },
    profile: { method: 'GET', path: '/auth/me', roles: ['all'] },
    changePassword: { method: 'PUT', path: '/auth/change-password', roles: ['all'] },
    register: { method: 'POST', path: '/auth/register', roles: ['admin', 'hr'] },
    resetPassword: { method: 'POST', path: '/auth/reset-password', roles: ['admin', 'hr'] }
  },
  
  // Employee Management APIs
  employees: {
    getAll: { method: 'GET', path: '/employees', roles: ['all'] },
    getById: { method: 'GET', path: '/employees/:id', roles: ['all'] },
    create: { method: 'POST', path: '/employees', roles: ['admin', 'hr'] },
    update: { method: 'PUT', path: '/employees/:id', roles: ['admin', 'hr', 'self'] },
    delete: { method: 'DELETE', path: '/employees/:id', roles: ['admin', 'hr'] },
    getDepartments: { method: 'GET', path: '/employees/meta/departments', roles: ['all'] },
    getPositions: { method: 'GET', path: '/employees/meta/positions', roles: ['all'] },
    getDashboard: { method: 'GET', path: '/employees/meta/dashboard', roles: ['all'] }
  },
  
  // Leave Management APIs
  leaves: {
    getAll: { method: 'GET', path: '/leaves', roles: ['all'] },
    getById: { method: 'GET', path: '/leaves/:id', roles: ['all'] },
    create: { method: 'POST', path: '/leaves', roles: ['all'] },
    updateStatus: { method: 'PUT', path: '/leaves/:id/status', roles: ['manager', 'admin', 'hr'] },
    cancel: { method: 'PUT', path: '/leaves/:id/cancel', roles: ['self'] },
    getBalance: { method: 'GET', path: '/leaves/balance', roles: ['all'] },
    getTypes: { method: 'GET', path: '/leaves/types', roles: ['all'] },
    getStatistics: { method: 'GET', path: '/leaves/statistics', roles: ['all'] }
  },
  
  // Timesheet Management APIs
  timesheets: {
    getAll: { method: 'GET', path: '/timesheets', roles: ['all'] },
    getById: { method: 'GET', path: '/timesheets/:id', roles: ['all'] },
    create: { method: 'POST', path: '/timesheets', roles: ['all'] },
    update: { method: 'PUT', path: '/timesheets/:id', roles: ['self'] },
    submit: { method: 'PUT', path: '/timesheets/:id/submit', roles: ['self'] },
    updateStatus: { method: 'PUT', path: '/timesheets/:id/status', roles: ['manager', 'admin', 'hr'] },
    delete: { method: 'DELETE', path: '/timesheets/:id', roles: ['self'] },
    getSummary: { method: 'GET', path: '/timesheets/summary', roles: ['all'] },
    getProjects: { method: 'GET', path: '/timesheets/meta/projects', roles: ['all'] },
    getProjectTasks: { method: 'GET', path: '/timesheets/meta/projects/:id/tasks', roles: ['all'] }
  },
  
  // Payroll/Payslip Management APIs
  payslips: {
    getAll: { method: 'GET', path: '/payslips', roles: ['admin', 'hr', 'self'] },
    getById: { method: 'GET', path: '/payslips/:id', roles: ['admin', 'hr', 'self'] },
    generate: { method: 'POST', path: '/payslips/generate', roles: ['admin', 'hr'] },
    updateStatus: { method: 'PUT', path: '/payslips/:id/status', roles: ['admin', 'hr'] },
    getDashboard: { method: 'GET', path: '/payslips/meta/dashboard', roles: ['admin', 'hr'] },
    getEmployeeSummary: { method: 'GET', path: '/payslips/employee/:id/summary', roles: ['all'] }
  }
};

// Business use case scenarios
const BUSINESS_SCENARIOS = {
  // Scenario 1: Complete Authentication Flow
  authenticationFlow: {
    name: 'Complete Authentication & Authorization Flow',
    description: 'Test all authentication endpoints with all user roles',
    apis: ['auth.login', 'auth.profile', 'auth.changePassword'],
    steps: [
      { step: 1, action: 'Login with Admin', api: 'auth.login', role: 'admin' },
      { step: 2, action: 'Get Admin Profile', api: 'auth.profile', role: 'admin' },
      { step: 3, action: 'Login with HR', api: 'auth.login', role: 'hr' },
      { step: 4, action: 'Get HR Profile', api: 'auth.profile', role: 'hr' },
      { step: 5, action: 'Login with Manager', api: 'auth.login', role: 'manager' },
      { step: 6, action: 'Get Manager Profile', api: 'auth.profile', role: 'manager' },
      { step: 7, action: 'Login with Employee', api: 'auth.login', role: 'employee' },
      { step: 8, action: 'Get Employee Profile', api: 'auth.profile', role: 'employee' }
    ]
  },

  // Scenario 2: Employee Management Lifecycle
  employeeLifecycle: {
    name: 'Complete Employee Management Lifecycle',
    description: 'Full CRUD operations on employee data',
    apis: ['employees.getAll', 'employees.getDepartments', 'employees.getPositions', 'employees.create', 'employees.getById', 'employees.update', 'employees.getDashboard'],
    steps: [
      { step: 1, action: 'Get All Employees', api: 'employees.getAll', role: 'admin' },
      { step: 2, action: 'Get Departments', api: 'employees.getDepartments', role: 'admin' },
      { step: 3, action: 'Get Positions', api: 'employees.getPositions', role: 'admin' },
      { step: 4, action: 'Create New Employee', api: 'employees.create', role: 'admin', data: 'newEmployee' },
      { step: 5, action: 'Get Created Employee', api: 'employees.getById', role: 'admin', useCreatedId: true },
      { step: 6, action: 'Update Employee Info', api: 'employees.update', role: 'admin', useCreatedId: true },
      { step: 7, action: 'Get Dashboard Stats', api: 'employees.getDashboard', role: 'admin' },
      { step: 8, action: 'HR Access Test', api: 'employees.getAll', role: 'hr' },
      { step: 9, action: 'Employee Self-View', api: 'employees.getAll', role: 'employee' }
    ]
  },

  // Scenario 3: Leave Management Workflow
  leaveManagement: {
    name: 'Complete Leave Management Workflow',
    description: 'Leave request, approval, and balance management',
    apis: ['leaves.getTypes', 'leaves.getBalance', 'leaves.create', 'leaves.getAll', 'leaves.updateStatus', 'leaves.getStatistics'],
    steps: [
      { step: 1, action: 'Get Leave Types', api: 'leaves.getTypes', role: 'employee' },
      { step: 2, action: 'Check Leave Balance', api: 'leaves.getBalance', role: 'employee' },
      { step: 3, action: 'Create Leave Request', api: 'leaves.create', role: 'employee', data: 'leaveRequest' },
      { step: 4, action: 'Manager Reviews Leaves', api: 'leaves.getAll', role: 'manager' },
      { step: 5, action: 'Manager Approves Leave', api: 'leaves.updateStatus', role: 'manager', useCreatedId: true },
      { step: 6, action: 'Employee Checks Status', api: 'leaves.getAll', role: 'employee' },
      { step: 7, action: 'HR Views Statistics', api: 'leaves.getStatistics', role: 'hr' },
      { step: 8, action: 'Admin Access Test', api: 'leaves.getAll', role: 'admin' }
    ]
  },

  // Scenario 4: Timesheet Management Workflow
  timesheetManagement: {
    name: 'Complete Timesheet Management Workflow',
    description: 'Timesheet creation, submission, and approval',
    apis: ['timesheets.getProjects', 'timesheets.create', 'timesheets.submit', 'timesheets.getAll', 'timesheets.updateStatus', 'timesheets.getSummary'],
    steps: [
      { step: 1, action: 'Get Available Projects', api: 'timesheets.getProjects', role: 'employee' },
      { step: 2, action: 'Create Timesheet Entry', api: 'timesheets.create', role: 'employee', data: 'timesheetEntry' },
      { step: 3, action: 'Submit Timesheet', api: 'timesheets.submit', role: 'employee', useCreatedId: true },
      { step: 4, action: 'Manager Reviews Timesheets', api: 'timesheets.getAll', role: 'manager' },
      { step: 5, action: 'Manager Approves Timesheet', api: 'timesheets.updateStatus', role: 'manager', useCreatedId: true },
      { step: 6, action: 'Get Timesheet Summary', api: 'timesheets.getSummary', role: 'employee' },
      { step: 7, action: 'HR Access Test', api: 'timesheets.getAll', role: 'hr' },
      { step: 8, action: 'Admin Oversight', api: 'timesheets.getAll', role: 'admin' }
    ]
  },

  // Scenario 5: Payroll Processing Workflow
  payrollProcessing: {
    name: 'Complete Payroll Processing Workflow',
    description: 'Payroll generation and payslip management',
    apis: ['payslips.getDashboard', 'payslips.generate', 'payslips.getAll', 'payslips.getEmployeeSummary'],
    steps: [
      { step: 1, action: 'HR Access Dashboard', api: 'payslips.getDashboard', role: 'hr' },
      { step: 2, action: 'Generate Monthly Payroll', api: 'payslips.generate', role: 'hr', data: 'payrollData' },
      { step: 3, action: 'Review Generated Payslips', api: 'payslips.getAll', role: 'hr' },
      { step: 4, action: 'Employee View Payslips', api: 'payslips.getAll', role: 'employee' },
      { step: 5, action: 'Get Employee Summary', api: 'payslips.getEmployeeSummary', role: 'employee' },
      { step: 6, action: 'Admin Oversight', api: 'payslips.getAll', role: 'admin' }
    ]
  },

  // Scenario 6: Role-Based Access Control Testing
  accessControlTesting: {
    name: 'Role-Based Access Control Validation',
    description: 'Test access permissions for all roles across all endpoints',
    apis: ['employees.create', 'leaves.updateStatus', 'timesheets.updateStatus', 'payslips.generate'],
    steps: [
      { step: 1, action: 'Admin Create Employee', api: 'employees.create', role: 'admin', data: 'newEmployee' },
      { step: 2, action: 'HR Create Employee', api: 'employees.create', role: 'hr', data: 'newEmployee' },
      { step: 3, action: 'Employee Create Employee (Should Fail)', api: 'employees.create', role: 'employee', data: 'newEmployee', expectFail: true },
      { step: 4, action: 'Manager Approve Leave', api: 'leaves.updateStatus', role: 'manager', data: 'approval' },
      { step: 5, action: 'Employee Approve Leave (Should Fail)', api: 'leaves.updateStatus', role: 'employee', data: 'approval', expectFail: true },
      { step: 6, action: 'HR Generate Payroll', api: 'payslips.generate', role: 'hr', data: 'payrollData' },
      { step: 7, action: 'Manager Generate Payroll (Should Fail)', api: 'payslips.generate', role: 'manager', data: 'payrollData', expectFail: true }
    ]
  }
};

// Test data templates
const TEST_DATA = {
  newEmployee: {
    firstName: 'AutoTest',
    lastName: 'Employee',
    email: `autotest.${Date.now()}@company.com`,
    phone: '9876543210',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    hireDate: new Date().toISOString().split('T')[0],
    employeeId: `AUTO${Date.now()}`,
    salary: 50000,
    emergencyContactName: 'Test Contact',
    emergencyContactPhone: '9876543211',
    emergencyContactRelation: 'Spouse'
  },
  
  leaveRequest: {
    leaveType: 'Annual',
    startDate: '2024-03-01',
    endDate: '2024-03-03',
    reason: 'Automated test leave request',
    isHalfDay: false
  },
  
  timesheetEntry: {
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 8,
    projectName: 'Automated Testing',
    taskDescription: 'API testing and validation',
    status: 'draft'
  },
  
  payrollData: {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  },
  
  approval: {
    status: 'approved',
    comments: 'Approved via automated testing'
  }
};

// Global state
const tokens = {};
const createdRecords = {};
const testResults = {
  scenarios: {},
  apiEndpoints: {},
  summary: { total: 0, passed: 0, failed: 0 }
};

// Helper functions
async function login(role) {
  const user = TEST_USERS[role];
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password
    });
    
    if (response.data.success && response.data.data?.accessToken) {
      tokens[role] = response.data.data.accessToken;
      return { success: true, token: tokens[role] };
    }
    return { success: false, error: 'No token received' };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

async function callAPI(endpoint, role, data = null, recordId = null) {
  if (!tokens[role]) {
    const loginResult = await login(role);
    if (!loginResult.success) {
      return { success: false, error: `Login failed for ${role}: ${loginResult.error}` };
    }
  }

  try {
    const apiConfig = getAPIConfig(endpoint);
    let url = `${API_BASE_URL}${apiConfig.path}`;
    
    // Replace :id with actual ID if needed
    if (url.includes(':id') && recordId) {
      url = url.replace(':id', recordId);
    }

    const config = {
      method: apiConfig.method,
      url,
      headers: {
        'Authorization': `Bearer ${tokens[role]}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(apiConfig.method)) {
      config.data = data;
    }

    const response = await axios(config);
    return { 
      success: true, 
      data: response.data, 
      status: response.status,
      recordId: response.data.data?.id 
    };

  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      details: error.response?.data
    };
  }
}

function getAPIConfig(endpoint) {
  const [category, action] = endpoint.split('.');
  return API_ENDPOINTS[category][action];
}

function logResult(scenario, step, success, details = '') {
  const status = success ? '✅' : '❌';
  console.log(`      Step ${step}: ${status} ${details}`);
}

// Main testing function
async function runScenarioByScenarioTesting() {
  console.log('🎯 **COMPREHENSIVE API & USE CASE TESTING - SCENARIO BY SCENARIO**');
  console.log('=' * 100);
  
  const startTime = Date.now();

  for (const [scenarioKey, scenario] of Object.entries(BUSINESS_SCENARIOS)) {
    console.log(`\n📋 **SCENARIO: ${scenario.name}**`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   APIs Tested: ${scenario.apis.join(', ')}`);
    
    testResults.scenarios[scenarioKey] = {
      name: scenario.name,
      steps: [],
      passed: 0,
      failed: 0,
      apisCovered: scenario.apis
    };

    for (const stepInfo of scenario.steps) {
      const stepResult = {
        step: stepInfo.step,
        action: stepInfo.action,
        api: stepInfo.api,
        role: stepInfo.role,
        success: false,
        details: ''
      };

      try {
        let data = null;
        if (stepInfo.data && TEST_DATA[stepInfo.data]) {
          data = TEST_DATA[stepInfo.data];
        }

        let recordId = null;
        if (stepInfo.useCreatedId && createdRecords[stepInfo.api]) {
          recordId = createdRecords[stepInfo.api];
        }

        const result = await callAPI(stepInfo.api, stepInfo.role, data, recordId);
        
        // Handle expected failures
        if (stepInfo.expectFail) {
          stepResult.success = !result.success;
          stepResult.details = result.success ? 
            'Expected failure but API call succeeded' : 
            `Expected failure confirmed: ${result.error}`;
        } else {
          stepResult.success = result.success;
          stepResult.details = result.success ? 
            `Success (${result.status})` : 
            `Failed: ${result.error}`;
          
          // Store created record ID for future steps
          if (result.success && result.recordId) {
            createdRecords[stepInfo.api] = result.recordId;
          }
        }

        // Track API endpoint usage
        if (!testResults.apiEndpoints[stepInfo.api]) {
          testResults.apiEndpoints[stepInfo.api] = { tested: 0, passed: 0, failed: 0 };
        }
        testResults.apiEndpoints[stepInfo.api].tested++;
        if (stepResult.success) {
          testResults.apiEndpoints[stepInfo.api].passed++;
        } else {
          testResults.apiEndpoints[stepInfo.api].failed++;
        }

      } catch (error) {
        stepResult.success = false;
        stepResult.details = `Unexpected error: ${error.message}`;
      }

      testResults.scenarios[scenarioKey].steps.push(stepResult);
      if (stepResult.success) {
        testResults.scenarios[scenarioKey].passed++;
      } else {
        testResults.scenarios[scenarioKey].failed++;
      }

      logResult(scenarioKey, stepInfo.step, stepResult.success, 
        `${stepInfo.action} (${stepInfo.role}) - ${stepResult.details}`);
    }

    const scenarioSuccess = testResults.scenarios[scenarioKey].passed;
    const scenarioTotal = testResults.scenarios[scenarioKey].steps.length;
    console.log(`   📊 Scenario Result: ${scenarioSuccess}/${scenarioTotal} steps passed`);
  }

  // Calculate overall results
  testResults.summary.total = Object.values(testResults.scenarios)
    .reduce((sum, scenario) => sum + scenario.steps.length, 0);
  testResults.summary.passed = Object.values(testResults.scenarios)
    .reduce((sum, scenario) => sum + scenario.passed, 0);
  testResults.summary.failed = testResults.summary.total - testResults.summary.passed;

  // Generate comprehensive report
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log('\n' + '=' * 100);
  console.log('📊 **COMPREHENSIVE TESTING REPORT**');
  console.log('=' * 100);

  // Scenario-by-scenario results
  console.log('\n🎯 **SCENARIO RESULTS:**');
  for (const [key, scenario] of Object.entries(testResults.scenarios)) {
    const total = scenario.steps.length;
    const successRate = total > 0 ? ((scenario.passed / total) * 100).toFixed(1) : 0;
    const status = scenario.passed === total ? '✅' : scenario.passed > 0 ? '⚠️' : '❌';
    
    console.log(`   ${status} ${scenario.name}: ${scenario.passed}/${total} (${successRate}%)`);
    if (scenario.failed > 0) {
      scenario.steps.filter(step => !step.success).forEach(step => {
        console.log(`      - Step ${step.step}: ${step.details}`);
      });
    }
  }

  // API endpoint coverage
  console.log('\n🔗 **API ENDPOINT COVERAGE:**');
  const totalEndpoints = Object.keys(API_ENDPOINTS).reduce((sum, category) => 
    sum + Object.keys(API_ENDPOINTS[category]).length, 0);
  const testedEndpoints = Object.keys(testResults.apiEndpoints).length;
  
  console.log(`   📋 Total Endpoints Available: ${totalEndpoints}`);
  console.log(`   🧪 Endpoints Tested: ${testedEndpoints}`);
  console.log(`   📊 Coverage: ${((testedEndpoints / totalEndpoints) * 100).toFixed(1)}%`);

  for (const [endpoint, stats] of Object.entries(testResults.apiEndpoints)) {
    const successRate = stats.tested > 0 ? ((stats.passed / stats.tested) * 100).toFixed(1) : 0;
    const status = stats.passed === stats.tested ? '✅' : stats.passed > 0 ? '⚠️' : '❌';
    console.log(`   ${status} ${endpoint}: ${stats.passed}/${stats.tested} (${successRate}%)`);
  }

  // Overall summary
  const overallSuccessRate = testResults.summary.total > 0 ? 
    ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1) : 0;

  console.log('\n🏆 **OVERALL RESULTS:**');
  console.log(`   📋 Total Tests: ${testResults.summary.total}`);
  console.log(`   ✅ Passed: ${testResults.summary.passed}`);
  console.log(`   ❌ Failed: ${testResults.summary.failed}`);
  console.log(`   📊 Success Rate: ${overallSuccessRate}%`);
  console.log(`   ⏱️  Duration: ${duration.toFixed(1)}s`);

  // System readiness assessment
  console.log('\n🎯 **SYSTEM READINESS ASSESSMENT:**');
  if (overallSuccessRate >= 90) {
    console.log('   🟢 **PRODUCTION READY** - All systems operational');
  } else if (overallSuccessRate >= 75) {
    console.log('   🟡 **MOSTLY READY** - Minor issues to address');
  } else if (overallSuccessRate >= 60) {
    console.log('   🟠 **NEEDS IMPROVEMENT** - Core functions work but refinement needed');
  } else {
    console.log('   🔴 **REQUIRES ATTENTION** - Major issues need resolution');
  }

  console.log('\n✅ **COMPREHENSIVE TESTING COMPLETED**');
  console.log('🌐 Frontend: http://localhost:3000');
  console.log('🔗 Backend: http://localhost:8080/api');
  console.log('=' * 100);

  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    duration,
    testResults,
    summary: {
      totalScenarios: Object.keys(BUSINESS_SCENARIOS).length,
      totalAPIs: totalEndpoints,
      testedAPIs: testedEndpoints,
      overallSuccessRate: parseFloat(overallSuccessRate)
    },
    workingCredentials: Object.keys(TEST_USERS)
  };

  const reportFileName = `comprehensive-scenario-testing-report-${Date.now()}.json`;
  fs.writeFileSync(reportFileName, JSON.stringify(reportData, null, 2));
  
  console.log(`\n💾 Detailed report saved: ${reportFileName}`);
  
  return reportData;
}

// Execute comprehensive testing
if (require.main === module) {
  runScenarioByScenarioTesting().catch(console.error);
}

module.exports = {
  runScenarioByScenarioTesting,
  BUSINESS_SCENARIOS,
  API_ENDPOINTS,
  TEST_DATA
};
