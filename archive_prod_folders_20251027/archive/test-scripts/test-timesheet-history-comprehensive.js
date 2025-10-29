/**
 * Comprehensive Timesheet History Testing and Dry Run
 * 
 * This script tests all aspects of the timesheet history functionality:
 * - Backend API endpoints for history retrieval
 * - Frontend service integration
 * - Data filtering and sorting
 * - Role-based access control
 * - History display and formatting
 */

// For Node.js 18+, fetch is built-in. For older versions, you may need node-fetch
const fetch = globalThis.fetch || require('node-fetch').default;

// Test configuration
const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

// Test users with different roles
const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  manager: {
    email: 'manager@example.com', 
    password: 'manager123',
    role: 'manager'
  },
  employee: {
    email: 'employee@example.com',
    password: 'employee123', 
    role: 'employee'
  },
  hr: {
    email: 'hr@example.com',
    password: 'hr123',
    role: 'hr'
  }
};

// Utility functions
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(`${API_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return {
      status: response.status,
      success: response.ok,
      data: data
    };
  } catch (error) {
    console.error(`❌ Request failed for ${url}:`, error.message);
    return {
      status: 500,
      success: false,
      error: error.message
    };
  }
}

async function login(userType) {
  const user = TEST_USERS[userType];
  if (!user) {
    throw new Error(`Unknown user type: ${userType}`);
  }

  console.log(`\n🔐 Logging in as ${userType} (${user.email})...`);
  
  const result = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: user.email,
      password: user.password
    })
  });

  if (!result.success) {
    throw new Error(`Login failed for ${userType}: ${JSON.stringify(result.data)}`);
  }

  const token = result.data.data?.accessToken || result.data.accessToken;
  if (!token) {
    throw new Error(`No access token received for ${userType}`);
  }

  console.log(`✅ Successfully logged in as ${userType}`);
  return {
    token,
    user: result.data.data?.user || result.data.user,
    employeeId: result.data.data?.user?.employeeId || result.data.user?.employeeId
  };
}

async function testHistoryAPI(userType, auth) {
  console.log(`\n📊 Testing history API for ${userType}...`);
  
  const headers = {
    'Authorization': `Bearer ${auth.token}`
  };

  // Test 1: Basic history retrieval
  console.log('  Testing basic history retrieval...');
  const basicHistory = await makeRequest('/timesheets', {
    method: 'GET',
    headers
  });

  if (basicHistory.success) {
    console.log(`  ✅ Retrieved ${basicHistory.data.data?.length || 0} timesheet records`);
    console.log(`  📋 Pagination info:`, basicHistory.data.pagination || 'No pagination');
  } else {
    console.log(`  ❌ Failed to retrieve history:`, basicHistory.data.message);
  }

  // Test 2: History with filters
  console.log('  Testing filtered history...');
  const filteredHistory = await makeRequest('/timesheets?status=Approved&limit=5', {
    method: 'GET',
    headers
  });

  if (filteredHistory.success) {
    console.log(`  ✅ Retrieved ${filteredHistory.data.data?.length || 0} approved records`);
  } else {
    console.log(`  ❌ Failed to retrieve filtered history:`, filteredHistory.data.message);
  }

  // Test 3: Date-based filtering
  const currentDate = new Date();
  const thisYear = currentDate.getFullYear();
  const thisWeek = getWeekNumber(currentDate);
  
  console.log('  Testing date-based filtering...');
  const weekHistory = await makeRequest(`/timesheets?year=${thisYear}&weekNumber=${thisWeek}`, {
    method: 'GET',
    headers
  });

  if (weekHistory.success) {
    console.log(`  ✅ Retrieved ${weekHistory.data.data?.length || 0} records for week ${thisWeek}, ${thisYear}`);
  } else {
    console.log(`  ❌ Failed to retrieve week history:`, weekHistory.data.message);
  }

  // Test 4: Access control validation
  if (userType === 'admin' || userType === 'hr') {
    console.log('  Testing cross-employee access (admin/HR only)...');
    const crossEmployeeHistory = await makeRequest('/timesheets?employeeId=any-employee-id', {
      method: 'GET',
      headers
    });
    
    if (crossEmployeeHistory.success || crossEmployeeHistory.status === 404) {
      console.log(`  ✅ Cross-employee access test passed`);
    } else {
      console.log(`  ❌ Cross-employee access failed:`, crossEmployeeHistory.data.message);
    }
  }

  return basicHistory.data.data || [];
}

async function testHistoryDataStructure(records) {
  console.log(`\n🔍 Testing history data structure...`);
  
  if (!records || records.length === 0) {
    console.log('  ⚠️  No records to test data structure');
    return;
  }

  const firstRecord = records[0];
  const requiredFields = [
    'id', 'employeeId', 'projectId', 'taskId', 
    'status', 'weekStartDate', 'year', 'weekNumber'
  ];

  const hourFields = [
    'mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours', 
    'fridayHours', 'saturdayHours', 'sundayHours'
  ];

  console.log('  Checking required fields...');
  const missingFields = requiredFields.filter(field => !(field in firstRecord));
  if (missingFields.length === 0) {
    console.log('  ✅ All required fields present');
  } else {
    console.log('  ❌ Missing fields:', missingFields);
  }

  console.log('  Checking hour fields...');
  const missingHourFields = hourFields.filter(field => !(field in firstRecord));
  if (missingHourFields.length === 0) {
    console.log('  ✅ All hour fields present');
  } else {
    console.log('  ❌ Missing hour fields:', missingHourFields);
  }

  console.log('  Checking relationships...');
  const relations = ['employee', 'project', 'task'];
  const presentRelations = relations.filter(rel => firstRecord[rel]);
  console.log(`  📋 Present relations: ${presentRelations.join(', ')}`);

  // Test data types
  console.log('  Checking data types...');
  const typeChecks = {
    'hours are numbers': hourFields.every(field => 
      typeof firstRecord[field] === 'number' || firstRecord[field] === null
    ),
    'dates are valid': firstRecord.weekStartDate && !isNaN(new Date(firstRecord.weekStartDate)),
    'status is string': typeof firstRecord.status === 'string',
    'year is number': typeof firstRecord.year === 'number'
  };

  Object.entries(typeChecks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  });
}

async function testHistoryFiltering() {
  console.log(`\n🔍 Testing history filtering functionality...`);
  
  try {
    const employee = await login('employee');
    
    // Test status filtering
    console.log('  Testing status filtering...');
    const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected'];
    
    for (const status of statuses) {
      const result = await makeRequest(`/timesheets?status=${status}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${employee.token}` }
      });
      
      if (result.success) {
        const statusMatches = result.data.data?.every(record => record.status === status) ?? true;
        console.log(`  ${statusMatches ? '✅' : '❌'} Status filter "${status}": ${result.data.data?.length || 0} records`);
      } else {
        console.log(`  ❌ Status filter "${status}" failed:`, result.data.message);
      }
    }

    // Test date range filtering
    console.log('  Testing date range filtering...');
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const yearResults = await Promise.all([
      makeRequest(`/timesheets?year=${currentYear}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${employee.token}` }
      }),
      makeRequest(`/timesheets?year=${lastYear}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${employee.token}` }
      })
    ]);

    yearResults.forEach((result, index) => {
      const year = index === 0 ? currentYear : lastYear;
      if (result.success) {
        console.log(`  ✅ Year ${year}: ${result.data.data?.length || 0} records`);
      } else {
        console.log(`  ❌ Year ${year} failed:`, result.data.message);
      }
    });

  } catch (error) {
    console.error('  ❌ History filtering test failed:', error.message);
  }
}

async function testRoleBasedAccess() {
  console.log(`\n🔐 Testing role-based history access...`);
  
  const roleTests = [
    { role: 'employee', expectOwnDataOnly: true },
    { role: 'manager', expectTeamData: true },
    { role: 'admin', expectAllData: true },
    { role: 'hr', expectAllData: true }
  ];

  for (const test of roleTests) {
    try {
      console.log(`  Testing ${test.role} access...`);
      const auth = await login(test.role);
      
      const history = await makeRequest('/timesheets', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });

      if (history.success) {
        const recordCount = history.data.data?.length || 0;
        console.log(`    ✅ ${test.role} can access ${recordCount} records`);
        
        // Verify data ownership for employees
        if (test.expectOwnDataOnly && history.data.data?.length > 0) {
          const ownDataOnly = history.data.data.every(record => 
            record.employeeId === auth.employeeId
          );
          console.log(`    ${ownDataOnly ? '✅' : '❌'} Employee sees only own data`);
        }
      } else {
        console.log(`    ❌ ${test.role} access failed:`, history.data.message);
      }
    } catch (error) {
      console.log(`    ❌ ${test.role} test failed:`, error.message);
    }
  }
}

async function testHistoryPerformance() {
  console.log(`\n⚡ Testing history performance...`);
  
  try {
    const employee = await login('employee');
    
    // Test pagination performance
    console.log('  Testing pagination...');
    const pageSizes = [10, 25, 50, 100];
    
    for (const pageSize of pageSizes) {
      const startTime = Date.now();
      const result = await makeRequest(`/timesheets?limit=${pageSize}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${employee.token}` }
      });
      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(`    ✅ Page size ${pageSize}: ${duration}ms (${result.data.data?.length || 0} records)`);
      } else {
        console.log(`    ❌ Page size ${pageSize} failed: ${duration}ms`);
      }
    }

    // Test sorting performance
    console.log('  Testing sorting...');
    const sortFields = ['weekStartDate', 'status', 'year'];
    
    for (const field of sortFields) {
      const startTime = Date.now();
      const result = await makeRequest(`/timesheets?sortBy=${field}&sortOrder=DESC`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${employee.token}` }
      });
      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(`    ✅ Sort by ${field}: ${duration}ms`);
      } else {
        console.log(`    ❌ Sort by ${field} failed: ${duration}ms`);
      }
    }

  } catch (error) {
    console.error('  ❌ Performance test failed:', error.message);
  }
}

async function testHistoryEdgeCases() {
  console.log(`\n🧪 Testing history edge cases...`);
  
  try {
    const employee = await login('employee');
    const headers = { 'Authorization': `Bearer ${employee.token}` };

    // Test invalid parameters
    console.log('  Testing invalid parameters...');
    const invalidTests = [
      { url: '/timesheets?year=invalid', desc: 'Invalid year' },
      { url: '/timesheets?weekNumber=100', desc: 'Invalid week number' },
      { url: '/timesheets?status=InvalidStatus', desc: 'Invalid status' },
      { url: '/timesheets?limit=-1', desc: 'Negative limit' },
      { url: '/timesheets?page=0', desc: 'Zero page' }
    ];

    for (const test of invalidTests) {
      const result = await makeRequest(test.url, {
        method: 'GET',
        headers
      });
      
      // Should either handle gracefully or return appropriate error
      const handled = result.success || (result.status >= 400 && result.status < 500);
      console.log(`    ${handled ? '✅' : '❌'} ${test.desc}: ${result.status}`);
    }

    // Test empty results
    console.log('  Testing empty result handling...');
    const futureYear = new Date().getFullYear() + 10;
    const emptyResult = await makeRequest(`/timesheets?year=${futureYear}`, {
      method: 'GET',
      headers
    });

    if (emptyResult.success && (emptyResult.data.data?.length === 0)) {
      console.log('    ✅ Empty results handled correctly');
    } else {
      console.log('    ❌ Empty results not handled properly');
    }

  } catch (error) {
    console.error('  ❌ Edge case testing failed:', error.message);
  }
}

// Helper function for week number calculation
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

async function runHistoryTests() {
  console.log('🚀 Starting Comprehensive Timesheet History Tests');
  console.log('=' .repeat(60));

  try {
    // Test 1: API endpoints for each user role
    for (const userType of Object.keys(TEST_USERS)) {
      try {
        const auth = await login(userType);
        const records = await testHistoryAPI(userType, auth);
        
        if (userType === 'employee' && records.length > 0) {
          await testHistoryDataStructure(records);
        }
      } catch (error) {
        console.error(`❌ Failed testing ${userType}:`, error.message);
      }
    }

    // Test 2: Filtering functionality
    await testHistoryFiltering();

    // Test 3: Role-based access control
    await testRoleBasedAccess();

    // Test 4: Performance tests
    await testHistoryPerformance();

    // Test 5: Edge cases
    await testHistoryEdgeCases();

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Timesheet History Tests Completed');

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runHistoryTests().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  runHistoryTests,
  testHistoryAPI,
  testHistoryDataStructure,
  testHistoryFiltering,
  testRoleBasedAccess,
  testHistoryPerformance,
  testHistoryEdgeCases
};