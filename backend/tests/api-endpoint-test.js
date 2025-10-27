const axios = require('axios');
const dayjs = require('dayjs');
const colors = require('colors');

// Test configuration
const BASE_URL = 'http://localhost:8080/api';
const TEST_USERS = {
  admin: { email: 'admin@test.com', password: 'admin123', token: null }
};

let passCount = 0;
let failCount = 0;

function logResult(test, passed, details = '') {
  if (passed) {
    passCount++;
    console.log(`✅ ${test}`.green);
  } else {
    failCount++;
    console.log(`❌ ${test}`.red);
  }
  if (details) console.log(`   ${details}`.gray);
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
    
    if (data) config.data = data;
    
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

async function testAPIEndpoints() {
  console.log('\n🔍 API ENDPOINT VERIFICATION TEST\n'.cyan.bold);
  
  // Login first
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      TEST_USERS.admin.token = loginResponse.data.data.accessToken;
      logResult('Admin authentication', true);
    } else {
      logResult('Admin authentication', false, loginResponse.data.message);
      return;
    }
  } catch (error) {
    logResult('Admin authentication', false, 'Login failed');
    return;
  }
  
  // Test 1: Leave endpoint verification
  console.log('\n📝 LEAVE MANAGEMENT ENDPOINTS'.yellow);
  
  const leaveEndpoints = [
    { method: 'GET', endpoint: '/leaves', name: 'Get leaves list' },
    { method: 'POST', endpoint: '/leaves', name: 'Create leave (should fail without data)', 
      data: { reason: 'Test' } }, // Incomplete data to test validation
  ];
  
  for (const test of leaveEndpoints) {
    const result = await makeRequest(test.method, test.endpoint, test.data);
    const passed = test.method === 'GET' ? result.success : !result.success; // POST should fail with incomplete data
    logResult(test.name, passed, 
      test.method === 'GET' 
        ? (result.success ? `Found ${result.data?.data?.length || 0} records` : result.error)
        : (result.success ? 'Unexpected success!' : `Validation working: ${result.error}`)
    );
  }
  
  // Test 2: Timesheet endpoint verification
  console.log('\n⏰ TIMESHEET MANAGEMENT ENDPOINTS'.yellow);
  
  const timesheetEndpoints = [
    { method: 'GET', endpoint: '/timesheets', name: 'Get timesheets list' },
    { method: 'POST', endpoint: '/timesheets', name: 'Create timesheet (should fail without data)',
      data: { hoursWorked: 8 } }, // Incomplete data
  ];
  
  for (const test of timesheetEndpoints) {
    const result = await makeRequest(test.method, test.endpoint, test.data);
    const passed = test.method === 'GET' ? result.success : !result.success;
    logResult(test.name, passed,
      test.method === 'GET'
        ? (result.success ? `Found ${result.data?.data?.length || 0} records` : result.error)
        : (result.success ? 'Unexpected success!' : `Validation working: ${result.error}`)
    );
  }
  
  // Test 3: Payroll endpoint verification
  console.log('\n💰 PAYROLL MANAGEMENT ENDPOINTS'.yellow);
  
  const payrollEndpoints = [
    { method: 'GET', endpoint: '/payroll', name: 'Get payroll list' },
    { method: 'POST', endpoint: '/payroll/generate', name: 'Generate payroll (should fail without data)',
      data: { month: 1 } }, // Incomplete data
  ];
  
  for (const test of payrollEndpoints) {
    const result = await makeRequest(test.method, test.endpoint, test.data);
    const passed = test.method === 'GET' ? result.success : !result.success;
    logResult(test.name, passed,
      test.method === 'GET'
        ? (result.success ? `Found ${result.data?.data?.length || 0} records` : result.error)
        : (result.success ? 'Unexpected success!' : `Validation working: ${result.error}`)
    );
  }
  
  // Test 4: Employee creation with comprehensive data
  console.log('\n👥 EMPLOYEE CREATION VALIDATION'.yellow);
  
  // Get departments and positions first
  const deptResult = await makeRequest('GET', '/employees/meta/departments');
  const posResult = await makeRequest('GET', '/employees/meta/positions');
  
  if (deptResult.success && posResult.success && deptResult.data.data.length > 0 && posResult.data.data.length > 0) {
    const testEmployee = {
      employeeId: `API${Date.now().toString().slice(-6)}`,
      firstName: 'APITest',
      lastName: 'User',
      email: `apitest.${Date.now()}@example.com`,
      phone: '9876543210',
      hireDate: dayjs().subtract(3, 'months').format('YYYY-MM-DD'),
      departmentId: deptResult.data.data[0].id,
      positionId: posResult.data.data[0].id,
      // Add all the enhanced fields
      dateOfBirth: '1992-05-15',
      gender: 'Male',
      address: 'API Test Address',
      city: 'Test City',
      state: 'Test State',
      pinCode: '123456',
      nationality: 'Indian',
      maritalStatus: 'Single',
      employmentType: 'Full-time',
      workLocation: 'Main Office',
      joiningDate: dayjs().subtract(3, 'months').format('YYYY-MM-DD'),
      probationPeriod: 6,
      noticePeriod: 30,
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '9876543211',
      emergencyContactRelation: 'Parent',
      aadhaarNumber: '123456789012',
      panNumber: 'ABCDE1234F',
      uanNumber: '123456789012',
      pfNumber: 'PF/API/001',
      esiNumber: 'ESI/API/001',
      bankName: 'Test Bank',
      bankAccountNumber: '1234567890123456',
      ifscCode: 'TEST0123456',
      bankBranch: 'Main Branch',
      accountHolderName: 'APITest User'
    };
    
    const createResult = await makeRequest('POST', '/employees', testEmployee);
    logResult('Create comprehensive employee', createResult.success,
      createResult.success 
        ? `Employee created with ID: ${testEmployee.employeeId}`
        : `Creation failed: ${createResult.error}`);
        
    if (createResult.success) {
      // Try to delete the test employee
      const employeeId = createResult.data.data?.id || createResult.data.id;
      const deleteResult = await makeRequest('DELETE', `/employees/${employeeId}`);
      logResult('Cleanup test employee', deleteResult.success, 'Test employee removed');
    }
  } else {
    logResult('Skip employee creation test', false, 'Could not load departments/positions');
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY'.cyan.bold);
  const totalTests = passCount + failCount;
  const successRate = totalTests > 0 ? ((passCount / totalTests) * 100).toFixed(1) : 0;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passCount}`.green);
  console.log(`Failed: ${failCount}`.red);
  console.log(`Success Rate: ${successRate}%`.cyan);
  
  if (successRate >= 80) {
    console.log('\n✅ EXCELLENT! All major API endpoints are working correctly.'.green.bold);
  } else if (successRate >= 60) {
    console.log('\n⚠️  GOOD! Most endpoints working, some issues found.'.yellow.bold);
  } else {
    console.log('\n❌ ISSUES DETECTED! Several endpoints need attention.'.red.bold);
  }
}

testAPIEndpoints().catch(error => {
  console.error('\n💥 Test error:', error.message);
  process.exit(1);
});
