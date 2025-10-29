const axios = require('axios');

// Quick API Fix Test Script
async function testAndFixCriticalAPIs() {
  const baseURL = 'http://localhost:8080/api';
  console.log('🔧 TESTING AND FIXING CRITICAL API ISSUES...\n');

  // Get admin token first
  let adminToken;
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    adminToken = loginResponse.data.data.accessToken;
    console.log('✅ Admin login successful');
  } catch (error) {
    console.log('❌ Cannot get admin token:', error.message);
    return;
  }

  console.log('\n1. Testing GET /auth/me...');
  try {
    const response = await axios.get(`${baseURL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ /auth/me working correctly');
    console.log('   Response:', response.data.success ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.log('❌ /auth/me failed:', error.response?.status, error.response?.data?.message);
    console.log('   This is a CRITICAL issue that needs immediate fixing');
  }

  console.log('\n2. Testing GET /leaves/types...');
  try {
    const response = await axios.get(`${baseURL}/leaves/types`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ /leaves/types working correctly');
    console.log('   Found leave types:', response.data.data?.length || 0);
  } catch (error) {
    console.log('❌ /leaves/types failed:', error.response?.status);
    console.log('   This endpoint is MISSING and prevents leave request creation');
  }

  console.log('\n3. Testing POST /employees (employee creation)...');
  try {
    // First get departments and positions
    const deptResponse = await axios.get(`${baseURL}/employees/meta/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const posResponse = await axios.get(`${baseURL}/employees/meta/positions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (deptResponse.data.data.length > 0 && posResponse.data.data.length > 0) {
      const testEmployee = {
        employeeId: `TEST${Date.now()}`,
        firstName: 'Test',
        lastName: 'Employee',
        email: `test.${Date.now()}@company.com`,
        departmentId: deptResponse.data.data[0].id,
        positionId: posResponse.data.data[0].id,
        hireDate: new Date().toISOString().split('T')[0],
        status: 'active',
        employmentType: 'full-time'
      };

      const response = await axios.post(`${baseURL}/employees`, testEmployee, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Employee creation working correctly');
      console.log('   Created employee ID:', response.data.data?.id);
    } else {
      console.log('⚠️ Cannot test employee creation - missing departments or positions');
    }
  } catch (error) {
    console.log('❌ Employee creation failed:', error.response?.status, error.response?.data?.message);
    console.log('   This prevents adding new employees to the system');
  }

  console.log('\n4. Testing POST /leaves (leave request creation)...');
  try {
    // Try to get leave types first
    let leaveTypeId = null;
    try {
      const typesResponse = await axios.get(`${baseURL}/leaves/types`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (typesResponse.data.data && typesResponse.data.data.length > 0) {
        leaveTypeId = typesResponse.data.data[0].id;
      }
    } catch (e) {
      // Leave types endpoint doesn't exist
    }

    if (leaveTypeId) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const testLeave = {
        leaveTypeId: leaveTypeId,
        startDate: tomorrow.toISOString().split('T')[0],
        endDate: dayAfterTomorrow.toISOString().split('T')[0],
        reason: 'Testing leave request creation',
        isHalfDay: false
      };

      const response = await axios.post(`${baseURL}/leaves`, testLeave, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Leave request creation working correctly');
      console.log('   Created leave request ID:', response.data.data?.id);
    } else {
      console.log('❌ Cannot test leave creation - no leave types available');
    }
  } catch (error) {
    console.log('❌ Leave request creation failed:', error.response?.status, error.response?.data?.message);
    console.log('   This prevents users from requesting leave');
  }

  console.log('\n5. Testing dashboard endpoints...');
  const dashboardEndpoints = [
    '/employees/meta/dashboard',
    '/leaves/statistics', 
    '/timesheets/summary',
    '/payslips/meta/dashboard'
  ];

  for (const endpoint of dashboardEndpoints) {
    try {
      const response = await axios.get(`${baseURL}${endpoint}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`✅ ${endpoint} working`);
    } catch (error) {
      console.log(`❌ ${endpoint} failed: ${error.response?.status || 'Network error'}`);
    }
  }

  console.log('\n📋 SUMMARY OF CRITICAL FIXES NEEDED:');
  console.log('='.repeat(50));
  console.log('🚨 IMMEDIATE ACTION REQUIRED:');
  console.log('   1. Fix GET /auth/me endpoint (400 error)');
  console.log('   2. Implement GET /leaves/types endpoint (404 error)');
  console.log('   3. Fix employee creation validation');
  console.log('   4. Fix leave request creation validation');
  console.log('   5. Implement missing dashboard endpoints');
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('   • Check backend route configurations');
  console.log('   • Verify database schema matches API expectations');
  console.log('   • Test validation schemas for POST requests');
  console.log('   • Implement missing endpoints for complete functionality');
}

testAndFixCriticalAPIs().catch(console.error);
