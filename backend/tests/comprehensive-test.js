const axios = require('axios');
const dayjs = require('dayjs');
const colors = require('colors');

// Test configuration
const BASE_URL = 'http://localhost:8080/api';
const TEST_RESULTS = [];
let TEST_COUNT = 0;
let PASS_COUNT = 0;
let FAIL_COUNT = 0;

// Test users with different roles
const TEST_USERS = {
  admin: { email: 'admin@test.com', password: 'admin123', token: null, id: null },
  hr: { email: 'hr@test.com', password: 'admin123', token: null, id: null },
  manager: { email: 'manager@test.com', password: 'admin123', token: null, id: null },
  employee: { email: 'employee@test.com', password: 'admin123', token: null, id: null }
};

// Test data storage
const TEST_DATA = {
  departments: [],
  positions: [],
  employees: [],
  leaveTypes: [],
  leaveRequests: [],
  timesheets: [],
  payrolls: []
};

// Utility functions
function logTest(description, passed, details = '') {
  TEST_COUNT++;
  if (passed) {
    PASS_COUNT++;
    console.log(`✅ ${description}`.green);
    if (details) console.log(`   ${details}`.gray);
  } else {
    FAIL_COUNT++;
    console.log(`❌ ${description}`.red);
    if (details) console.log(`   ${details}`.gray);
  }
  TEST_RESULTS.push({ description, passed, details });
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`.cyan);
  console.log(`  ${title}`.cyan.bold);
  console.log(`${'='.repeat(60)}`.cyan);
}

function logSubSection(title) {
  console.log(`\n${'-'.repeat(40)}`.yellow);
  console.log(`  ${title}`.yellow);
  console.log(`${'-'.repeat(40)}`.yellow);
}

async function makeRequest(method, endpoint, data = null, userType = 'admin') {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_USERS[userType].token}`
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      data: error.response?.data
    };
  }
}

// Test functions
async function testAuthentication() {
  logSection('AUTHENTICATION TESTS');
  
  for (const [role, user] of Object.entries(TEST_USERS)) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: user.email,
        password: user.password
      });
      
      if (response.data.success) {
        user.token = response.data.data.accessToken;
        user.id = response.data.data.user.id;
        user.employeeId = response.data.data.user.employeeId;
        logTest(`${role.toUpperCase()} login`, true, `Token received, User ID: ${user.id}`);
      } else {
        logTest(`${role.toUpperCase()} login`, false, response.data.message);
      }
    } catch (error) {
      logTest(`${role.toUpperCase()} login`, false, error.response?.data?.message || error.message);
    }
  }
}

async function testDepartmentManagement() {
  logSection('DEPARTMENT MANAGEMENT TESTS');
  
  // Test getting departments (All roles)
  for (const role of ['admin', 'hr', 'manager', 'employee']) {
    const result = await makeRequest('GET', '/employees/meta/departments', null, role);
    logTest(`List departments as ${role}`, result.success, 
      result.success ? `Found ${result.data.data?.length || result.data?.length || 0} departments` : result.error);
  }
  
  // Note: Department creation might not be available via API
  // Test creating departments would require direct database access or admin endpoints
}

async function testPositionManagement() {
  logSection('POSITION MANAGEMENT TESTS');
  
  // Test getting positions (All roles)
  for (const role of ['admin', 'hr', 'manager', 'employee']) {
    const result = await makeRequest('GET', '/employees/meta/positions', null, role);
    logTest(`List positions as ${role}`, result.success,
      result.success ? `Found ${result.data.data?.length || result.data?.length || 0} positions` : result.error);
  }
  
  // Note: Position creation might not be available via API
  // Test creating positions would require direct database access or admin endpoints
}

async function testEmployeeManagement() {
  logSection('EMPLOYEE MANAGEMENT TESTS');
  
  // First, get existing departments and positions
  const deptResult = await makeRequest('GET', '/employees/meta/departments', null, 'admin');
  if (deptResult.success) {
    TEST_DATA.departments = deptResult.data.data || deptResult.data || [];
  }
  
  const posResult = await makeRequest('GET', '/employees/meta/positions', null, 'admin');
  if (posResult.success) {
    TEST_DATA.positions = posResult.data.data || posResult.data || [];
  }
  
  // Test listing employees with different roles (to get existing employees)
  for (const role of ['admin', 'hr', 'manager', 'employee']) {
    const result = await makeRequest('GET', '/employees', null, role);
    logTest(`List employees as ${role}`, result.success,
      result.success ? `Found ${result.data.data?.length || result.data?.length || 0} employees` : result.error);
    
    // Store employees from admin result for further tests
    if (role === 'admin' && result.success) {
      TEST_DATA.employees = result.data.data || result.data || [];
    }
  }
  
  // Test creating employees with comprehensive data (only if we have departments and positions)
  if (TEST_DATA.departments.length > 0 && TEST_DATA.positions.length > 0) {
    const employees = [
      {
        employeeId: 'TST001',
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test.employee@example.com',
        phone: '9876543299',
        hireDate: '2024-08-01',
        departmentId: TEST_DATA.departments[0]?.id,
        positionId: TEST_DATA.positions[0]?.id,
        // Personal Details
        dateOfBirth: '1990-05-15',
        gender: 'Male',
        address: '123 Test Street, Sector 1',
        city: 'Test City',
        state: 'Test State',
        pinCode: '123456',
        nationality: 'Indian',
        maritalStatus: 'Single',
        // Employment Details
        employmentType: 'Full-time',
        workLocation: 'Test Office',
        joiningDate: '2024-08-01',
        probationPeriod: 6,
        noticePeriod: 30,
        // Emergency Contact
        emergencyContactName: 'Test Contact',
        emergencyContactPhone: '9876543298',
        emergencyContactRelation: 'Parent',
        // Statutory Information
        aadhaarNumber: '123456789999',
        panNumber: 'TESTPN123Z',
        uanNumber: '123456789999',
        pfNumber: 'PF/TST/001',
        esiNumber: 'ESI/TST/001',
        // Bank Details
        bankName: 'Test Bank',
        bankAccountNumber: '1234567890999999',
        ifscCode: 'TEST0001234',
        bankBranch: 'Test Branch',
        accountHolderName: 'Test Employee'
      }
    ];
    
    // Test creating employees (Admin/HR only)
    for (const emp of employees) {
      const result = await makeRequest('POST', '/employees', emp, 'admin');
      if (result.success) {
        TEST_DATA.employees.push(result.data.data || result.data);
        logTest(`Create employee: ${emp.firstName} ${emp.lastName}`, true, 
          `ID: ${result.data.data?.id || result.data?.id}, Employee ID: ${emp.employeeId}`);
      } else {
        logTest(`Create employee: ${emp.firstName} ${emp.lastName}`, false, result.error);
      }
    }
  } else {
    logTest(`Skip employee creation`, true, 'No departments or positions available for test employee creation');
  }
  
  // Test getting specific employee details
  if (TEST_DATA.employees.length > 0) {
    const employeeId = TEST_DATA.employees[0].id;
    for (const role of ['admin', 'hr', 'manager']) {
      const result = await makeRequest('GET', `/employees/${employeeId}`, null, role);
      logTest(`Get employee details as ${role}`, result.success,
        result.success ? `Retrieved employee: ${result.data.data?.firstName || result.data?.firstName}` : result.error);
    }
  }
  
  // Test updating employee (Admin/HR only)
  if (TEST_DATA.employees.length > 0) {
    const employeeId = TEST_DATA.employees[0].id;
    const updateData = { 
      phone: '9876543299',
      city: 'Updated City',
      bankName: 'Updated Bank'
    };
    
    const result = await makeRequest('PUT', `/employees/${employeeId}`, updateData, 'admin');
    logTest(`Update employee`, result.success,
      result.success ? `Updated employee phone and bank details` : result.error);
  }
}

async function testLeaveManagement() {
  logSection('LEAVE MANAGEMENT TESTS');
  
  // First, test getting leave types
  const leaveTypesResult = await makeRequest('GET', '/leaves/types', null, 'admin');
  if (leaveTypesResult.success) {
    TEST_DATA.leaveTypes = leaveTypesResult.data.data || leaveTypesResult.data || [];
    logTest(`Get leave types`, true, `Found ${TEST_DATA.leaveTypes.length} leave types`);
  } else {
    logTest(`Get leave types`, false, leaveTypesResult.error);
  }
  
  // Test creating leave requests
  if (TEST_DATA.employees.length > 0 && TEST_DATA.leaveTypes.length > 0) {
    const leaveRequests = [
      {
        employeeId: TEST_DATA.employees[0].id,
        leaveTypeId: TEST_DATA.leaveTypes[0].id,
        startDate: dayjs().add(7, 'days').format('YYYY-MM-DD'),
        endDate: dayjs().add(9, 'days').format('YYYY-MM-DD'),
        reason: 'Personal work - family function',
        status: 'pending'
      },
      {
        employeeId: TEST_DATA.employees[0].id,
        leaveTypeId: TEST_DATA.leaveTypes.find(t => t.name === 'Sick Leave')?.id || TEST_DATA.leaveTypes[1]?.id,
        startDate: dayjs().add(15, 'days').format('YYYY-MM-DD'),
        endDate: dayjs().add(16, 'days').format('YYYY-MM-DD'),
        reason: 'Medical checkup',
        status: 'pending'
      }
    ];
    
    for (const leave of leaveRequests) {
      const result = await makeRequest('POST', '/leaves/requests', leave, 'admin');
      if (result.success) {
        TEST_DATA.leaveRequests.push(result.data.data || result.data);
        logTest(`Create leave request`, true, 
          `From ${leave.startDate} to ${leave.endDate}, Type: ${TEST_DATA.leaveTypes.find(t => t.id === leave.leaveTypeId)?.name}`);
      } else {
        logTest(`Create leave request`, false, result.error);
      }
    }
  }
  
  // Test getting leave requests with different roles
  for (const role of ['admin', 'hr', 'manager', 'employee']) {
    const result = await makeRequest('GET', '/leaves/requests', null, role);
    logTest(`List leave requests as ${role}`, result.success,
      result.success ? `Found ${result.data.data?.length || result.data?.length || 0} leave requests` : result.error);
  }
  
  // Test approving leave request (Manager/HR/Admin only)
  if (TEST_DATA.leaveRequests.length > 0) {
    const leaveId = TEST_DATA.leaveRequests[0].id;
    const approvalData = { 
      status: 'approved',
      approverComments: 'Approved for personal work'
    };
    
    const result = await makeRequest('PUT', `/leaves/requests/${leaveId}/approve`, approvalData, 'manager');
    logTest(`Approve leave request as manager`, result.success,
      result.success ? `Leave request approved` : result.error);
  }
  
  // Test leave balance
  if (TEST_DATA.employees.length > 0) {
    const employeeId = TEST_DATA.employees[0].id;
    const result = await makeRequest('GET', `/leaves/balance/${employeeId}`, null, 'admin');
    logTest(`Get leave balance`, result.success,
      result.success ? `Retrieved leave balance for employee` : result.error);
  }
}

async function testTimesheetManagement() {
  logSection('TIMESHEET MANAGEMENT TESTS');
  
  // Test creating timesheets
  if (TEST_DATA.employees.length > 0) {
    const timesheets = [
      {
        employeeId: TEST_DATA.employees[0].id,
        date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        hoursWorked: 8,
        description: 'Development work on HRM system - Employee module',
        projectName: 'HRM System',
        taskType: 'Development',
        status: 'submitted'
      },
      {
        employeeId: TEST_DATA.employees[0].id,
        date: dayjs().subtract(2, 'days').format('YYYY-MM-DD'),
        hoursWorked: 7.5,
        description: 'Code review and testing - Leave management',
        projectName: 'HRM System',
        taskType: 'Review',
        status: 'submitted'
      },
      {
        employeeId: TEST_DATA.employees[0].id,
        date: dayjs().subtract(3, 'days').format('YYYY-MM-DD'),
        hoursWorked: 8,
        description: 'Meeting with team and documentation',
        projectName: 'HRM System',
        taskType: 'Meeting',
        status: 'draft'
      }
    ];
    
    for (const timesheet of timesheets) {
      const result = await makeRequest('POST', '/timesheets', timesheet, 'admin');
      if (result.success) {
        TEST_DATA.timesheets.push(result.data.data || result.data);
        logTest(`Create timesheet entry`, true, 
          `Date: ${timesheet.date}, Hours: ${timesheet.hoursWorked}, Status: ${timesheet.status}`);
      } else {
        logTest(`Create timesheet entry`, false, result.error);
      }
    }
  }
  
  // Test getting timesheets with different roles
  for (const role of ['admin', 'hr', 'manager', 'employee']) {
    const result = await makeRequest('GET', '/timesheets', null, role);
    logTest(`List timesheets as ${role}`, result.success,
      result.success ? `Found ${result.data.data?.length || result.data?.length || 0} timesheet entries` : result.error);
  }
  
  // Test getting timesheet for specific employee
  if (TEST_DATA.employees.length > 0) {
    const employeeId = TEST_DATA.employees[0].id;
    const startDate = dayjs().subtract(7, 'days').format('YYYY-MM-DD');
    const endDate = dayjs().format('YYYY-MM-DD');
    
    const result = await makeRequest('GET', `/timesheets/employee/${employeeId}?startDate=${startDate}&endDate=${endDate}`, null, 'admin');
    logTest(`Get employee timesheet range`, result.success,
      result.success ? `Retrieved timesheet for date range` : result.error);
  }
  
  // Test approving timesheet (Manager/HR/Admin only)
  if (TEST_DATA.timesheets.length > 0) {
    const timesheetId = TEST_DATA.timesheets[0].id;
    const approvalData = { 
      status: 'approved',
      approverComments: 'Good work, approved'
    };
    
    const result = await makeRequest('PUT', `/timesheets/${timesheetId}/approve`, approvalData, 'manager');
    logTest(`Approve timesheet as manager`, result.success,
      result.success ? `Timesheet approved` : result.error);
  }
}

async function testPayrollManagement() {
  logSection('PAYROLL MANAGEMENT TESTS');
  
  // Test creating payroll entries
  if (TEST_DATA.employees.length > 0) {
    const payrolls = [
      {
        employeeId: TEST_DATA.employees[0].id,
        payPeriodStart: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
        payPeriodEnd: dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
        basicSalary: 50000,
        allowances: 15000,
        deductions: 8000,
        grossSalary: 65000,
        netSalary: 57000,
        status: 'processed'
      },
      {
        employeeId: TEST_DATA.employees[1]?.id,
        payPeriodStart: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
        payPeriodEnd: dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
        basicSalary: 60000,
        allowances: 18000,
        deductions: 10000,
        grossSalary: 78000,
        netSalary: 68000,
        status: 'processed'
      }
    ];
    
    for (const payroll of payrolls) {
      if (payroll.employeeId) {
        const result = await makeRequest('POST', '/payroll', payroll, 'admin');
        if (result.success) {
          TEST_DATA.payrolls.push(result.data.data || result.data);
          logTest(`Create payroll entry`, true, 
            `Employee: ${payroll.employeeId}, Net Salary: ₹${payroll.netSalary.toLocaleString('en-IN')}`);
        } else {
          logTest(`Create payroll entry`, false, result.error);
        }
      }
    }
  }
  
  // Test getting payroll with different roles
  for (const role of ['admin', 'hr', 'manager']) {
    const result = await makeRequest('GET', '/payroll', null, role);
    logTest(`List payroll as ${role}`, result.success,
      result.success ? `Found ${result.data.data?.length || result.data?.length || 0} payroll entries` : result.error);
  }
  
  // Test getting payroll for specific employee
  if (TEST_DATA.employees.length > 0 && TEST_DATA.payrolls.length > 0) {
    const employeeId = TEST_DATA.employees[0].id;
    const result = await makeRequest('GET', `/payroll/employee/${employeeId}`, null, 'admin');
    logTest(`Get employee payroll history`, result.success,
      result.success ? `Retrieved payroll history for employee` : result.error);
  }
}

async function testRoleBasedAccess() {
  logSection('ROLE-BASED ACCESS CONTROL TESTS');
  
  // Test employee trying to access admin functions
  const employeeTests = [
    { endpoint: '/employees', method: 'POST', data: { firstName: 'Test', lastName: 'User' } },
    { endpoint: '/employees/meta/departments', method: 'POST', data: { name: 'Test Dept' } },
    { endpoint: '/employees/meta/positions', method: 'POST', data: { title: 'Test Position' } }
  ];
  
  for (const test of employeeTests) {
    const result = await makeRequest(test.method, test.endpoint, test.data, 'employee');
    logTest(`Employee accessing ${test.method} ${test.endpoint}`, !result.success && result.status === 403,
      result.success ? 'Should have been denied' : `Correctly denied: ${result.error}`);
  }
  
  // Test manager accessing HR functions
  if (TEST_DATA.employees.length > 0) {
    const employeeId = TEST_DATA.employees[0].id;
    const result = await makeRequest('DELETE', `/employees/${employeeId}`, null, 'manager');
    logTest(`Manager trying to delete employee`, !result.success,
      result.success ? 'Should have been denied' : `Correctly handled: ${result.error}`);
  }
}

async function testDataIntegrity() {
  logSection('DATA INTEGRITY TESTS');
  
  // Test creating employee with invalid data
  const invalidEmployee = {
    employeeId: '', // Empty employee ID
    firstName: 'A', // Too short
    lastName: 'B', // Too short
    email: 'invalid-email', // Invalid email
    phone: '123', // Too short
    aadhaarNumber: '123', // Invalid length
    panNumber: 'ABC', // Invalid length
    ifscCode: 'INVALID', // Invalid length
    pinCode: '12345' // Invalid length (should be 6)
  };
  
  const result = await makeRequest('POST', '/employees', invalidEmployee, 'admin');
  logTest(`Create employee with invalid data`, !result.success,
    result.success ? 'Should have been rejected' : `Correctly rejected: ${result.error}`);
  
  // Test updating with invalid data
  if (TEST_DATA.employees.length > 0) {
    const employeeId = TEST_DATA.employees[0].id;
    const invalidUpdate = {
      email: 'invalid-email',
      aadhaarNumber: '123'
    };
    
    const updateResult = await makeRequest('PUT', `/employees/${employeeId}`, invalidUpdate, 'admin');
    logTest(`Update employee with invalid data`, !updateResult.success,
      updateResult.success ? 'Should have been rejected' : `Correctly rejected: ${updateResult.error}`);
  }
}

async function generateTestReport() {
  logSection('TEST RESULTS SUMMARY');
  
  console.log(`\nTotal Tests: ${TEST_COUNT}`.bold);
  console.log(`Passed: ${PASS_COUNT}`.green.bold);
  console.log(`Failed: ${FAIL_COUNT}`.red.bold);
  console.log(`Success Rate: ${((PASS_COUNT / TEST_COUNT) * 100).toFixed(2)}%`.cyan.bold);
  
  if (FAIL_COUNT > 0) {
    console.log(`\nFailed Tests:`.red.bold);
    TEST_RESULTS.filter(r => !r.passed).forEach((result, index) => {
      console.log(`${index + 1}. ${result.description}`.red);
      if (result.details) console.log(`   ${result.details}`.gray);
    });
  }
  
  // Test data summary
  console.log(`\nTest Data Created:`.blue.bold);
  console.log(`- Departments: ${TEST_DATA.departments.length}`);
  console.log(`- Positions: ${TEST_DATA.positions.length}`);
  console.log(`- Employees: ${TEST_DATA.employees.length}`);
  console.log(`- Leave Types: ${TEST_DATA.leaveTypes.length}`);
  console.log(`- Leave Requests: ${TEST_DATA.leaveRequests.length}`);
  console.log(`- Timesheets: ${TEST_DATA.timesheets.length}`);
  console.log(`- Payrolls: ${TEST_DATA.payrolls.length}`);
}

// Main test execution
async function runComprehensiveTests() {
  console.log(`
${'*'.repeat(80)}
    HRM SYSTEM - COMPREHENSIVE TEST SUITE
    Testing all modules with role-based access control
    Date: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}
${'*'.repeat(80)}
  `.cyan);
  
  try {
    // Core tests
    await testAuthentication();
    await testDepartmentManagement();
    await testPositionManagement();
    await testEmployeeManagement();
    await testLeaveManagement();
    await testTimesheetManagement();
    await testPayrollManagement();
    
    // Security and integrity tests
    await testRoleBasedAccess();
    await testDataIntegrity();
    
    // Generate final report
    await generateTestReport();
    
    process.exit(FAIL_COUNT > 0 ? 1 : 0);
    
  } catch (error) {
    console.error(`\nCRITICAL ERROR: ${error.message}`.red.bold);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nTest interrupted by user'.yellow);
  process.exit(1);
});

// Run the tests
runComprehensiveTests();
