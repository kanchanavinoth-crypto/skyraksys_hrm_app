const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';
const FRONTEND_URL = 'http://localhost:3000';

// Test Credentials for Different Roles (Updated with actual working credentials)
const TEST_USERS = {
  admin: {
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t',
    role: 'admin'
  },
  hr: {
    email: 'hr@company.com', 
    password: 'Lw3nQ6xY8mD4vB7h',
    role: 'hr'
  },
  manager: {
    email: 'manager@test.com',
    password: 'Qy8nR6wA2mS5kD7j',
    role: 'manager'
  },
  employee: {
    email: 'employee@company.com',
    password: 'Mv4pS9wE2nR6kA8j', 
    role: 'employee'
  }
};

// Test Results Storage
const testResults = {
  admin: { passed: 0, failed: 0, tests: [] },
  hr: { passed: 0, failed: 0, tests: [] },
  manager: { passed: 0, failed: 0, tests: [] },
  employee: { passed: 0, failed: 0, tests: [] },
  summary: { totalTests: 0, totalPassed: 0, totalFailed: 0 }
};

// Authentication tokens storage
const tokens = {};

// Helper function to make authenticated API calls
async function apiCall(method, endpoint, data = null, userRole = 'admin') {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Add authentication header if user is logged in
    if (tokens[userRole]) {
      config.headers['Authorization'] = `Bearer ${tokens[userRole]}`;
    }

    // Add data for POST/PUT requests
    if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      details: error.response?.data
    };
  }
}

// Helper function to record test results
function recordTest(userRole, testName, passed, details = '') {
  testResults[userRole].tests.push({
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
  
  if (passed) {
    testResults[userRole].passed++;
    testResults.summary.totalPassed++;
  } else {
    testResults[userRole].failed++;
    testResults.summary.totalFailed++;
  }
  
  testResults.summary.totalTests++;
  
  console.log(`${passed ? '✅' : '❌'} [${userRole.toUpperCase()}] ${testName} ${passed ? 'PASSED' : 'FAILED'}`);
  if (details) console.log(`   Details: ${details}`);
}

// Authentication Tests
async function testAuthentication(userRole) {
  console.log(`\n🔐 Testing Authentication for ${userRole.toUpperCase()}...`);
  
  const user = TEST_USERS[userRole];
  
  // Test 1: Login
  const loginResult = await apiCall('POST', '/auth/login', {
    email: user.email,
    password: user.password
  });
  
  if (loginResult.success && loginResult.data.data?.accessToken) {
    tokens[userRole] = loginResult.data.data.accessToken || loginResult.data.token;
    recordTest(userRole, 'Authentication - Login', true, `Token received`);
    
    // Test 2: Get Profile
    const profileResult = await apiCall('GET', '/auth/profile', null, userRole);
    recordTest(userRole, 'Authentication - Get Profile', 
      profileResult.success && profileResult.data.data?.email === user.email,
      profileResult.success ? 'Profile data retrieved' : profileResult.error
    );
    
    return true;
  } else {
    recordTest(userRole, 'Authentication - Login', false, loginResult.error);
    return false;
  }
}

// Employee Management Tests
async function testEmployeeManagement(userRole) {
  console.log(`\n👥 Testing Employee Management for ${userRole.toUpperCase()}...`);
  
  // Test 1: Get All Employees
  const getEmployeesResult = await apiCall('GET', '/employees', null, userRole);
  recordTest(userRole, 'Employees - Get All', 
    getEmployeesResult.success, 
    getEmployeesResult.success ? `Found ${getEmployeesResult.data.data?.length || 0} employees` : getEmployeesResult.error
  );
  
  // Test 2: Get Departments (Metadata)
  const getDepartmentsResult = await apiCall('GET', '/employees/meta/departments', null, userRole);
  recordTest(userRole, 'Employees - Get Departments', 
    getDepartmentsResult.success,
    getDepartmentsResult.success ? `Found ${getDepartmentsResult.data.data?.length || 0} departments` : getDepartmentsResult.error
  );
  
  // Test 3: Get Positions (Metadata)
  const getPositionsResult = await apiCall('GET', '/employees/meta/positions', null, userRole);
  recordTest(userRole, 'Employees - Get Positions',
    getPositionsResult.success,
    getPositionsResult.success ? `Found ${getPositionsResult.data.data?.length || 0} positions` : getPositionsResult.error
  );
  
  // Test 4: Create Employee (Admin/HR only)
  if (['admin', 'hr'].includes(userRole)) {
    const newEmployeeData = {
      firstName: `Test${Date.now()}`,
      lastName: 'Employee',
      email: `test.emp.${Date.now()}@company.com`,
      phone: '9876543210',
      dateOfBirth: '1990-05-15',
      gender: 'Male',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      hireDate: '2024-01-15',
      employeeId: `EMP${Date.now()}`,
      salary: 75000,
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '9876543211',
      emergencyContactRelation: 'Father'
    };
    
    const createResult = await apiCall('POST', '/employees', newEmployeeData, userRole);
    recordTest(userRole, 'Employees - Create New', 
      createResult.success,
      createResult.success ? 'Employee created successfully' : createResult.error
    );
    
    // Test 5: Update Employee (if creation was successful)
    if (createResult.success && createResult.data.data?.id) {
      const employeeId = createResult.data.data.id;
      const updateResult = await apiCall('PUT', `/employees/${employeeId}`, {
        firstName: 'Updated',
        lastName: 'Employee'
      }, userRole);
      recordTest(userRole, 'Employees - Update', 
        updateResult.success,
        updateResult.success ? 'Employee updated successfully' : updateResult.error
      );
    }
  } else {
    recordTest(userRole, 'Employees - Create New', false, 'Access denied (expected for non-admin/hr roles)');
  }
  
  // Test 6: Dashboard Stats
  const dashboardResult = await apiCall('GET', '/employees/meta/dashboard', null, userRole);
  recordTest(userRole, 'Employees - Dashboard Stats',
    dashboardResult.success,
    dashboardResult.success ? 'Dashboard data retrieved' : dashboardResult.error
  );
}

// Leave Management Tests
async function testLeaveManagement(userRole) {
  console.log(`\n🏖️ Testing Leave Management for ${userRole.toUpperCase()}...`);
  
  // Test 1: Get All Leaves
  const getLeavesResult = await apiCall('GET', '/leaves', null, userRole);
  recordTest(userRole, 'Leaves - Get All',
    getLeavesResult.success,
    getLeavesResult.success ? `Found ${getLeavesResult.data.data?.length || 0} leave requests` : getLeavesResult.error
  );
  
  // Test 2: Get Leave Types
  const getLeaveTypesResult = await apiCall('GET', '/leaves/types', null, userRole);
  recordTest(userRole, 'Leaves - Get Types',
    getLeaveTypesResult.success,
    getLeaveTypesResult.success ? `Found ${getLeaveTypesResult.data.data?.length || 0} leave types` : getLeaveTypesResult.error
  );
  
  // Test 3: Get Leave Balance
  const getLeaveBalanceResult = await apiCall('GET', '/leaves/balance', null, userRole);
  recordTest(userRole, 'Leaves - Get Balance',
    getLeaveBalanceResult.success,
    getLeaveBalanceResult.success ? 'Leave balance retrieved' : getLeaveBalanceResult.error
  );
  
  // Test 4: Create Leave Request (All users can create)
  const newLeaveRequest = {
    leaveType: 'Annual',
    startDate: '2024-02-01',
    endDate: '2024-02-03',
    reason: 'Personal vacation',
    isHalfDay: false
  };
  
  const createLeaveResult = await apiCall('POST', '/leaves', newLeaveRequest, userRole);
  recordTest(userRole, 'Leaves - Create Request',
    createLeaveResult.success,
    createLeaveResult.success ? 'Leave request created' : createLeaveResult.error
  );
  
  // Test 5: Leave Statistics
  const getLeaveStatsResult = await apiCall('GET', '/leaves/statistics', null, userRole);
  recordTest(userRole, 'Leaves - Get Statistics',
    getLeaveStatsResult.success,
    getLeaveStatsResult.success ? 'Leave statistics retrieved' : getLeaveStatsResult.error
  );
}

// Timesheet Management Tests
async function testTimesheetManagement(userRole) {
  console.log(`\n⏰ Testing Timesheet Management for ${userRole.toUpperCase()}...`);
  
  // Test 1: Get All Timesheets
  const getTimesheetsResult = await apiCall('GET', '/timesheets', null, userRole);
  recordTest(userRole, 'Timesheets - Get All',
    getTimesheetsResult.success,
    getTimesheetsResult.success ? `Found ${getTimesheetsResult.data.data?.length || 0} timesheets` : getTimesheetsResult.error
  );
  
  // Test 2: Get Projects (Metadata)
  const getProjectsResult = await apiCall('GET', '/timesheets/meta/projects', null, userRole);
  recordTest(userRole, 'Timesheets - Get Projects',
    getProjectsResult.success,
    getProjectsResult.success ? `Found ${getProjectsResult.data.data?.length || 0} projects` : getProjectsResult.error
  );
  
  // Test 3: Get Timesheet Summary
  const getTimesheetSummaryResult = await apiCall('GET', '/timesheets/summary', null, userRole);
  recordTest(userRole, 'Timesheets - Get Summary',
    getTimesheetSummaryResult.success,
    getTimesheetSummaryResult.success ? 'Timesheet summary retrieved' : getTimesheetSummaryResult.error
  );
  
  // Test 4: Create Timesheet Entry (All users can create)
  const newTimesheetEntry = {
    date: '2024-01-15',
    hoursWorked: 8,
    projectName: 'General',
    taskDescription: 'Daily development work',
    status: 'draft'
  };
  
  const createTimesheetResult = await apiCall('POST', '/timesheets', newTimesheetEntry, userRole);
  recordTest(userRole, 'Timesheets - Create Entry',
    createTimesheetResult.success,
    createTimesheetResult.success ? 'Timesheet entry created' : createTimesheetResult.error
  );
}

// Payroll Management Tests  
async function testPayrollManagement(userRole) {
  console.log(`\n💰 Testing Payroll Management for ${userRole.toUpperCase()}...`);
  
  // Test 1: Get Payroll Records
  const getPayrollResult = await apiCall('GET', '/payroll', null, userRole);
  recordTest(userRole, 'Payroll - Get Records',
    getPayrollResult.success,
    getPayrollResult.success ? `Found ${getPayrollResult.data.data?.length || 0} payroll records` : getPayrollResult.error
  );
  
  // Test 2: Get Payroll Dashboard (Admin/HR only)
  const getPayrollDashboardResult = await apiCall('GET', '/payroll/meta/dashboard', null, userRole);
  if (['admin', 'hr'].includes(userRole)) {
    recordTest(userRole, 'Payroll - Get Dashboard',
      getPayrollDashboardResult.success,
      getPayrollDashboardResult.success ? 'Payroll dashboard retrieved' : getPayrollDashboardResult.error
    );
  } else {
    recordTest(userRole, 'Payroll - Get Dashboard',
      !getPayrollDashboardResult.success,
      'Access properly denied for non-admin/hr role'
    );
  }
  
  // Test 3: Generate Payroll (Admin/HR only)
  if (['admin', 'hr'].includes(userRole)) {
    const generatePayrollResult = await apiCall('POST', '/payroll/generate', {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    }, userRole);
    recordTest(userRole, 'Payroll - Generate',
      generatePayrollResult.success,
      generatePayrollResult.success ? 'Payroll generation triggered' : generatePayrollResult.error
    );
  } else {
    recordTest(userRole, 'Payroll - Generate', false, 'Access denied (expected for non-admin/hr roles)');
  }
}

// Business Use Case: Complete Employee Lifecycle
async function testCompleteEmployeeLifecycle(userRole) {
  console.log(`\n🔄 Testing Complete Employee Lifecycle for ${userRole.toUpperCase()}...`);
  
  if (!['admin', 'hr'].includes(userRole)) {
    recordTest(userRole, 'Employee Lifecycle - Complete Flow', false, 'Skipped - requires admin/hr role');
    return;
  }
  
  try {
    // Step 1: Create Employee
    const newEmployee = {
      firstName: `Lifecycle${Date.now()}`,
      lastName: 'TestEmployee',
      email: `lifecycle.${Date.now()}@company.com`,
      phone: '9876543210',
      dateOfBirth: '1990-05-15',
      gender: 'Male',
      address: '123 Lifecycle Street',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      hireDate: '2024-01-15',
      employeeId: `LIFE${Date.now()}`,
      salary: 80000,
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '9876543211',
      emergencyContactRelation: 'Spouse'
    };
    
    const createResult = await apiCall('POST', '/employees', newEmployee, userRole);
    if (!createResult.success) {
      recordTest(userRole, 'Employee Lifecycle - Complete Flow', false, `Failed at creation: ${createResult.error}`);
      return;
    }
    
    const employeeId = createResult.data.data.id;
    
    // Step 2: Update Employee Details
    const updateResult = await apiCall('PUT', `/employees/${employeeId}`, {
      firstName: 'Updated',
      salary: 85000
    }, userRole);
    
    if (!updateResult.success) {
      recordTest(userRole, 'Employee Lifecycle - Complete Flow', false, `Failed at update: ${updateResult.error}`);
      return;
    }
    
    // Step 3: Get Employee Details
    const getResult = await apiCall('GET', `/employees/${employeeId}`, null, userRole);
    if (!getResult.success) {
      recordTest(userRole, 'Employee Lifecycle - Complete Flow', false, `Failed at retrieval: ${getResult.error}`);
      return;
    }
    
    recordTest(userRole, 'Employee Lifecycle - Complete Flow', true, 
      `Successfully created, updated, and retrieved employee ${employeeId}`);
    
  } catch (error) {
    recordTest(userRole, 'Employee Lifecycle - Complete Flow', false, `Unexpected error: ${error.message}`);
  }
}

// Business Use Case: Leave Approval Workflow
async function testLeaveApprovalWorkflow(userRole) {
  console.log(`\n📝 Testing Leave Approval Workflow for ${userRole.toUpperCase()}...`);
  
  try {
    // Step 1: Create Leave Request
    const leaveRequest = {
      leaveType: 'Annual',
      startDate: '2024-03-01',
      endDate: '2024-03-05',
      reason: 'Family vacation',
      isHalfDay: false
    };
    
    const createResult = await apiCall('POST', '/leaves', leaveRequest, userRole);
    if (!createResult.success) {
      recordTest(userRole, 'Leave Workflow - Request & Approval', false, `Failed to create leave: ${createResult.error}`);
      return;
    }
    
    const leaveId = createResult.data.data.id;
    
    // Step 2: Try to Approve (Manager/Admin/HR only)
    if (['admin', 'hr', 'manager'].includes(userRole)) {
      const approvalResult = await apiCall('PUT', `/leaves/${leaveId}/status`, {
        status: 'approved',
        comments: 'Approved by automated test'
      }, userRole);
      
      recordTest(userRole, 'Leave Workflow - Request & Approval', 
        approvalResult.success,
        approvalResult.success ? `Leave created and approved successfully` : `Created but failed to approve: ${approvalResult.error}`
      );
    } else {
      recordTest(userRole, 'Leave Workflow - Request & Approval', true, 
        'Leave request created successfully (approval requires manager+ role)'
      );
    }
    
  } catch (error) {
    recordTest(userRole, 'Leave Workflow - Request & Approval', false, `Unexpected error: ${error.message}`);
  }
}

// Business Use Case: Timesheet Submission Workflow
async function testTimesheetWorkflow(userRole) {
  console.log(`\n⏱️ Testing Timesheet Workflow for ${userRole.toUpperCase()}...`);
  
  try {
    // Step 1: Create Timesheet
    const timesheetEntry = {
      date: '2024-01-16',
      hoursWorked: 8,
      projectName: 'Test Project',
      taskDescription: 'Automated testing workflow',
      status: 'draft'
    };
    
    const createResult = await apiCall('POST', '/timesheets', timesheetEntry, userRole);
    if (!createResult.success) {
      recordTest(userRole, 'Timesheet Workflow - Submit & Approve', false, `Failed to create timesheet: ${createResult.error}`);
      return;
    }
    
    const timesheetId = createResult.data.data.id;
    
    // Step 2: Submit Timesheet
    const submitResult = await apiCall('PUT', `/timesheets/${timesheetId}/submit`, {}, userRole);
    
    if (!submitResult.success) {
      recordTest(userRole, 'Timesheet Workflow - Submit & Approve', false, `Created but failed to submit: ${submitResult.error}`);
      return;
    }
    
    // Step 3: Try to Approve (Manager/Admin/HR only)
    if (['admin', 'hr', 'manager'].includes(userRole)) {
      const approvalResult = await apiCall('PUT', `/timesheets/${timesheetId}/status`, {
        status: 'approved',
        comments: 'Approved by automated workflow test'
      }, userRole);
      
      recordTest(userRole, 'Timesheet Workflow - Submit & Approve',
        approvalResult.success,
        approvalResult.success ? 'Complete timesheet workflow successful' : `Submitted but failed to approve: ${approvalResult.error}`
      );
    } else {
      recordTest(userRole, 'Timesheet Workflow - Submit & Approve', true,
        'Timesheet created and submitted successfully (approval requires manager+ role)'
      );
    }
    
  } catch (error) {
    recordTest(userRole, 'Timesheet Workflow - Submit & Approve', false, `Unexpected error: ${error.message}`);
  }
}

// Main test runner
async function runComprehensiveE2ETests() {
  console.log('🚀 **COMPREHENSIVE E2E API TESTING - ALL ROLES & BUSINESS USE CASES**');
  console.log('=' * 80);
  
  const startTime = Date.now();
  
  // Test each user role
  for (const [userRole, userData] of Object.entries(TEST_USERS)) {
    console.log(`\n🎯 **TESTING ROLE: ${userRole.toUpperCase()}**`);
    console.log('-' * 50);
    
    // Step 1: Authentication
    const isAuthenticated = await testAuthentication(userRole);
    
    if (!isAuthenticated) {
      console.log(`❌ Skipping further tests for ${userRole} due to authentication failure`);
      continue;
    }
    
    // Step 2: Core Module Tests
    await testEmployeeManagement(userRole);
    await testLeaveManagement(userRole);
    await testTimesheetManagement(userRole);
    await testPayrollManagement(userRole);
    
    // Step 3: Business Use Case Tests
    await testCompleteEmployeeLifecycle(userRole);
    await testLeaveApprovalWorkflow(userRole);
    await testTimesheetWorkflow(userRole);
  }
  
  // Generate Final Report
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log('\n' + '=' * 80);
  console.log('📊 **FINAL E2E TEST REPORT**');
  console.log('=' * 80);
  
  // Role-by-role summary
  for (const [role, results] of Object.entries(testResults)) {
    if (role === 'summary') continue;
    
    const successRate = results.passed + results.failed > 0 ? 
      ((results.passed / (results.passed + results.failed)) * 100).toFixed(1) : 0;
    
    console.log(`\n🎯 **${role.toUpperCase()} ROLE RESULTS:**`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📊 Success Rate: ${successRate}%`);
    
    if (results.failed > 0) {
      console.log(`   ⚠️  Failed Tests:`);
      results.tests
        .filter(test => !test.passed)
        .forEach(test => console.log(`      - ${test.name}: ${test.details}`));
    }
  }
  
  // Overall summary
  const overallSuccessRate = testResults.summary.totalTests > 0 ?
    ((testResults.summary.totalPassed / testResults.summary.totalTests) * 100).toFixed(1) : 0;
  
  console.log('\n🎯 **OVERALL SYSTEM RESULTS:**');
  console.log(`   📋 Total Tests: ${testResults.summary.totalTests}`);
  console.log(`   ✅ Total Passed: ${testResults.summary.totalPassed}`);  
  console.log(`   ❌ Total Failed: ${testResults.summary.totalFailed}`);
  console.log(`   📊 Overall Success Rate: ${overallSuccessRate}%`);
  console.log(`   ⏱️  Total Duration: ${duration}s`);
  
  // System Status Assessment
  console.log('\n🏆 **SYSTEM STATUS ASSESSMENT:**');
  if (overallSuccessRate >= 95) {
    console.log('   🟢 **EXCELLENT** - System is production-ready');
  } else if (overallSuccessRate >= 85) {
    console.log('   🟡 **GOOD** - System is stable with minor issues');
  } else if (overallSuccessRate >= 70) {
    console.log('   🟠 **FAIR** - System needs improvement');
  } else {
    console.log('   🔴 **CRITICAL** - System requires immediate attention');
  }
  
  console.log('\n✅ **E2E API TESTING COMPLETED**');
  console.log(`📧 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔗 Backend API: ${API_BASE_URL}`);
  console.log('=' * 80);
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    duration,
    overallSuccessRate: parseFloat(overallSuccessRate),
    summary: testResults.summary,
    roleResults: Object.fromEntries(
      Object.entries(testResults).filter(([key]) => key !== 'summary')
    ),
    config: {
      apiBaseUrl: API_BASE_URL,
      frontendUrl: FRONTEND_URL,
      testUsers: Object.keys(TEST_USERS)
    }
  };
  
  require('fs').writeFileSync(
    `e2e-api-test-report-${Date.now()}.json`,
    JSON.stringify(reportData, null, 2)
  );
  
  console.log('\n💾 Detailed JSON report saved to e2e-api-test-report-[timestamp].json');
}

// Execute tests
if (require.main === module) {
  runComprehensiveE2ETests().catch(console.error);
}

module.exports = {
  runComprehensiveE2ETests,
  testResults,
  apiCall
};
