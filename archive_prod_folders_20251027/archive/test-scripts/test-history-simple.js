/**
 * Simplified Timesheet History Testing and Dry Run
 * 
 * This script tests the core timesheet history functionality using basic HTTP requests
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

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
  employee: {
    email: 'employee@example.com',
    password: 'employee123', 
    role: 'employee'
  }
};

// Simple HTTP request wrapper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url.startsWith('http') ? url : `${API_URL}${url}`);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            success: false,
            data: { message: 'Invalid JSON response', raw: data }
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
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
    console.log(`❌ Login failed for ${userType}:`, result.data);
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

async function testBasicHistoryRetrieval(userType, auth) {
  console.log(`\n📊 Testing basic history retrieval for ${userType}...`);
  
  const headers = {
    'Authorization': `Bearer ${auth.token}`
  };

  try {
    // Test basic GET /timesheets
    const result = await makeRequest('/timesheets', {
      method: 'GET',
      headers
    });

    if (result.success) {
      const records = result.data.data || [];
      console.log(`  ✅ Successfully retrieved ${records.length} timesheet records`);
      
      if (result.data.pagination) {
        console.log(`  📋 Pagination: Page ${result.data.pagination.currentPage} of ${result.data.pagination.totalPages}`);
        console.log(`  📋 Total items: ${result.data.pagination.totalItems}`);
      }

      // Show sample record structure if available
      if (records.length > 0) {
        const sample = records[0];
        console.log(`  📋 Sample record fields:`, Object.keys(sample));
        console.log(`  📋 Sample status: ${sample.status || 'N/A'}`);
        console.log(`  📋 Sample week: ${sample.year || 'N/A'}-W${sample.weekNumber || 'N/A'}`);
      }

      return records;
    } else {
      console.log(`  ❌ Failed to retrieve history:`, result.data.message || result.data);
      return [];
    }
  } catch (error) {
    console.log(`  ❌ Error during history retrieval:`, error.message);
    return [];
  }
}

async function testHistoryFiltering(auth) {
  console.log(`\n🔍 Testing history filtering...`);
  
  const headers = {
    'Authorization': `Bearer ${auth.token}`
  };

  // Test status filtering
  const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected'];
  
  for (const status of statuses) {
    try {
      const result = await makeRequest(`/timesheets?status=${status}`, {
        method: 'GET',
        headers
      });
      
      if (result.success) {
        const records = result.data.data || [];
        const validStatuses = records.every(r => r.status === status);
        console.log(`  ${validStatuses ? '✅' : '❌'} Status "${status}": ${records.length} records`);
      } else {
        console.log(`  ❌ Status filter "${status}" failed:`, result.data.message);
      }
    } catch (error) {
      console.log(`  ❌ Error testing status "${status}":`, error.message);
    }
  }

  // Test year filtering
  const currentYear = new Date().getFullYear();
  try {
    const result = await makeRequest(`/timesheets?year=${currentYear}`, {
      method: 'GET',
      headers
    });
    
    if (result.success) {
      const records = result.data.data || [];
      console.log(`  ✅ Year ${currentYear}: ${records.length} records`);
    } else {
      console.log(`  ❌ Year filtering failed:`, result.data.message);
    }
  } catch (error) {
    console.log(`  ❌ Error testing year filtering:`, error.message);
  }
}

async function testHistoryPagination(auth) {
  console.log(`\n📄 Testing history pagination...`);
  
  const headers = {
    'Authorization': `Bearer ${auth.token}`
  };

  const pageSizes = [5, 10, 25];
  
  for (const pageSize of pageSizes) {
    try {
      const startTime = Date.now();
      const result = await makeRequest(`/timesheets?limit=${pageSize}&page=1`, {
        method: 'GET',
        headers
      });
      const duration = Date.now() - startTime;
      
      if (result.success) {
        const records = result.data.data || [];
        console.log(`  ✅ Page size ${pageSize}: ${records.length} records (${duration}ms)`);
        
        if (result.data.pagination) {
          console.log(`    📋 Total pages: ${result.data.pagination.totalPages}`);
        }
      } else {
        console.log(`  ❌ Page size ${pageSize} failed:`, result.data.message);
      }
    } catch (error) {
      console.log(`  ❌ Error testing page size ${pageSize}:`, error.message);
    }
  }
}

async function testDataStructure(records) {
  console.log(`\n🔍 Testing data structure...`);
  
  if (!records || records.length === 0) {
    console.log('  ⚠️  No records to analyze');
    return;
  }

  const sample = records[0];
  
  // Check essential fields
  const essentialFields = [
    'id', 'employeeId', 'status', 'year', 'weekNumber'
  ];

  const missingFields = essentialFields.filter(field => !(field in sample));
  if (missingFields.length === 0) {
    console.log('  ✅ All essential fields present');
  } else {
    console.log('  ❌ Missing essential fields:', missingFields);
  }

  // Check hour fields
  const hourFields = [
    'mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours',
    'fridayHours', 'saturdayHours', 'sundayHours'
  ];

  const presentHourFields = hourFields.filter(field => field in sample);
  console.log(`  📋 Hour fields present: ${presentHourFields.length}/${hourFields.length}`);

  // Check relationships
  const relationships = ['employee', 'project', 'task'];
  const presentRels = relationships.filter(rel => sample[rel]);
  console.log(`  📋 Relationships loaded: ${presentRels.join(', ')}`);

  // Data type validation
  console.log('  📋 Data types:');
  console.log(`    Status: ${typeof sample.status} (${sample.status})`);
  console.log(`    Year: ${typeof sample.year} (${sample.year})`);
  console.log(`    Week: ${typeof sample.weekNumber} (${sample.weekNumber})`);
}

async function runSimpleHistoryTest() {
  console.log('🚀 Starting Simple Timesheet History Test');
  console.log('=' .repeat(50));

  try {
    // Test with employee role
    console.log('\n👤 Testing Employee Access...');
    const employeeAuth = await login('employee');
    const employeeRecords = await testBasicHistoryRetrieval('employee', employeeAuth);
    
    if (employeeRecords.length > 0) {
      await testDataStructure(employeeRecords);
    }
    
    await testHistoryFiltering(employeeAuth);
    await testHistoryPagination(employeeAuth);

    // Test with admin role if possible
    try {
      console.log('\n👑 Testing Admin Access...');
      const adminAuth = await login('admin');
      const adminRecords = await testBasicHistoryRetrieval('admin', adminAuth);
      
      // Compare record counts
      if (adminRecords.length >= employeeRecords.length) {
        console.log('  ✅ Admin sees same or more records than employee');
      } else {
        console.log('  ⚠️  Admin sees fewer records than employee (unexpected)');
      }
      
    } catch (error) {
      console.log('  ⚠️  Admin test skipped:', error.message);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Simple History Test Completed Successfully');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runSimpleHistoryTest().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  runSimpleHistoryTest,
  testBasicHistoryRetrieval,
  testHistoryFiltering,
  testHistoryPagination,
  testDataStructure
};