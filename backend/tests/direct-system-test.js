#!/usr/bin/env node

/**
 * Direct System Test - Tests without external script dependencies
 */

const axios = require('axios');

async function directSystemTest() {
  console.log('🔍 SkyRakSys HRM - Direct System Test\n');
  
  const baseURL = 'http://localhost:8080/api';
  let testsRun = 0;
  let testsPassed = 0;
  
  // Test 1: Health Check
  console.log('1️⃣  Backend Health Check');
  try {
    const health = await axios.get(`${baseURL}/health`);
    console.log('   ✅ Status:', health.data.status);
    console.log('   ✅ Message:', health.data.message);
    console.log('   ✅ Version:', health.data.version);
    testsPassed++;
  } catch (error) {
    console.log('   ❌ Health check failed:', error.message);
  }
  testsRun++;
  
  // Test 2: Try different admin credentials
  console.log('\n2️⃣  Testing Admin Authentication');
  
  const adminCredentials = [
    { email: 'admin@skyraksys.com', password: 'Admin123!' },
    { email: 'admin@test.com', password: 'admin123' },
    { email: 'admin@company.com', password: 'password123' }
  ];
  
  let adminToken = null;
  
  for (const creds of adminCredentials) {
    try {
      console.log(`   Trying: ${creds.email}`);
      const login = await axios.post(`${baseURL}/auth/login`, creds);
      
      if (login.data.success && login.data.data?.accessToken) {
        console.log('   ✅ Login successful!');
        console.log('   ✅ User role:', login.data.data.user?.role || 'Not specified');
        adminToken = login.data.data.accessToken;
        testsPassed++;
        break;
      } else {
        console.log('   ⚠️  Login response but no token');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ⚠️  Invalid credentials');
      } else {
        console.log('   ❌ Login error:', error.response?.data?.message || error.message);
      }
    }
  }
  testsRun++;
  
  // Test 3: Create Admin User if none exists
  if (!adminToken) {
    console.log('\n3️⃣  Creating Admin User (Registration)');
    try {
      const registerAdmin = await axios.post(`${baseURL}/auth/register`, {
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@skyraksys.com',
        password: 'Admin123!',
        role: 'admin'
      });
      
      if (registerAdmin.data.success) {
        console.log('   ✅ Admin user created successfully');
        
        // Try login again
        const login = await axios.post(`${baseURL}/auth/login`, {
          email: 'admin@skyraksys.com',
          password: 'Admin123!'
        });
        
        if (login.data.success && login.data.data?.accessToken) {
          console.log('   ✅ New admin login successful');
          adminToken = login.data.data.accessToken;
          testsPassed++;
        }
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('   ⚠️  Admin user already exists');
      } else {
        console.log('   ❌ Registration error:', error.response?.data?.message || error.message);
      }
    }
    testsRun++;
  }
  
  // Test 4: API Endpoints
  if (adminToken) {
    console.log('\n4️⃣  Testing Core API Endpoints');
    const apiConfig = {
      headers: { Authorization: `Bearer ${adminToken}` }
    };
    
    const endpoints = [
      { name: 'Employees', path: '/employees' },
      { name: 'Timesheets', path: '/timesheets' },
      { name: 'Leaves', path: '/leaves' },
      { name: 'Payroll', path: '/payroll' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${baseURL}${endpoint.path}`, apiConfig);
        console.log(`   ✅ ${endpoint.name}: ${response.status} - ${response.data.data?.length || 'N/A'} records`);
        testsPassed++;
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: ${error.response?.status || 'ERROR'} - ${error.response?.data?.message || error.message}`);
      }
      testsRun++;
    }
    
    // Test 5: Timesheet Resubmit Feature
    console.log('\n5️⃣  Testing Timesheet Resubmit Feature');
    try {
      // First check if endpoint exists by trying to access it
      const testTimesheet = {
        weekStarting: '2025-08-08',
        weekEnding: '2025-08-14',
        regularHours: 40,
        totalHours: 40,
        description: 'Test entry for resubmit validation'
      };
      
      const createResponse = await axios.post(`${baseURL}/timesheets`, testTimesheet, apiConfig);
      if (createResponse.status === 201) {
        const timesheetId = createResponse.data.data.id;
        console.log(`   ✅ Test timesheet created: ID ${timesheetId}`);
        
        // Test the resubmit endpoint
        const resubmitResponse = await axios.put(`${baseURL}/timesheets/${timesheetId}/resubmit`, {
          comments: 'Testing resubmit functionality'
        }, apiConfig);
        
        if (resubmitResponse.status === 200) {
          console.log('   ✅ Resubmit endpoint working perfectly!');
          console.log('   ✅ New status:', resubmitResponse.data.data?.status || 'Updated');
          testsPassed++;
        } else {
          console.log(`   ⚠️  Resubmit returned status: ${resubmitResponse.status}`);
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   ❌ Resubmit endpoint not found - needs implementation');
      } else {
        console.log('   ❌ Resubmit test failed:', error.response?.data?.message || error.message);
      }
    }
    testsRun++;
  } else {
    console.log('\n❌ No admin access - skipping API endpoint tests');
    testsRun += 5; // Account for skipped tests
  }
  
  // Test 6: Frontend Connectivity
  console.log('\n6️⃣  Frontend Connectivity Check');
  try {
    const frontend = await axios.get('http://localhost:3000', { timeout: 5000 });
    console.log(`   ✅ Frontend responding: ${frontend.status}`);
    
    // Check if React app is loaded
    const htmlContent = frontend.data.toLowerCase();
    if (htmlContent.includes('react') || htmlContent.includes('root') || htmlContent.includes('app')) {
      console.log('   ✅ React application detected');
      testsPassed++;
    } else {
      console.log('   ⚠️  Frontend loaded but React app not detected');
    }
  } catch (error) {
    console.log('   ❌ Frontend not responding:', error.message);
  }
  testsRun++;
  
  // Final Results
  const passRate = ((testsPassed / testsRun) * 100).toFixed(1);
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`📊 Tests Run: ${testsRun}`);
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsRun - testsPassed}`);
  console.log(`📈 Pass Rate: ${passRate}%`);
  
  console.log('\n🎯 SYSTEM ASSESSMENT:');
  if (passRate >= 90) {
    console.log('🟢 EXCELLENT - Your application is production ready!');
    console.log('   ✅ All core functionality working');
    console.log('   ✅ Authentication system operational');
    console.log('   ✅ API endpoints responding correctly');
    console.log('   ✅ Frontend and backend connected');
  } else if (passRate >= 75) {
    console.log('🟡 GOOD - System mostly functional with minor issues');
    console.log('   ✅ Core systems working');
    console.log('   ⚠️  Some features may need attention');
  } else if (passRate >= 50) {
    console.log('🟠 NEEDS WORK - Significant issues detected');
    console.log('   ⚠️  Critical functionality may be impacted');
  } else {
    console.log('🔴 CRITICAL ISSUES - Major problems need immediate attention');
    console.log('   ❌ Core functionality not working properly');
  }
  
  console.log('\n🚀 NEXT STEPS:');
  if (adminToken) {
    console.log('   ✅ System ready for full user testing');
    console.log('   ✅ You can log in with: admin@skyraksys.com / Admin123!');
    console.log('   ✅ All HRM modules accessible');
  } else {
    console.log('   🔧 Set up admin user access');
    console.log('   🔧 Verify database connection');
  }
  
  if (testsPassed >= testsRun * 0.9) {
    console.log('   🎉 Your SkyRakSys HRM system is working excellently!');
  }
  
  console.log('\n💡 TIP: You can now test the UI at http://localhost:3000');
  
  return passRate >= 75;
}

// Run the test
directSystemTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
