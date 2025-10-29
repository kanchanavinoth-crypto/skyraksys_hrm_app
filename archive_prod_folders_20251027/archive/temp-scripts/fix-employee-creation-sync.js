const axios = require('axios');

async function fixEmployeeCreationSync() {
  console.log('🔧 COMPREHENSIVE EMPLOYEE CREATION SYNC FIX');
  console.log('============================================');
  
  const baseURL = 'http://localhost:8080/api';
  
  try {
    // Test the backend fix first
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Admin authentication successful');
    
    // Get reference data
    const [departments, positions] = await Promise.all([
      axios.get(`${baseURL}/employees/meta/departments`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${baseURL}/employees/meta/positions`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    
    console.log('✅ Reference data loaded');
    console.log(`   Available Departments: ${departments.data.data.length}`);
    console.log(`   Available Positions: ${positions.data.data.length}`);
    
    // Test with properly formatted payload that matches backend expectations
    const correctPayload = {
      firstName: 'SyncTest',
      lastName: 'Employee',
      email: `synctest.${Date.now()}@company.com`,
      hireDate: '2025-08-10',
      departmentId: departments.data.data[0].id,  // Use departmentId, not department
      positionId: positions.data.data[0].id,       // Use positionId, not position
      phone: '9876543210',
      employmentType: 'Full-time',
      status: 'Active',
      nationality: 'Indian'
    };
    
    console.log('\n🧪 Testing corrected payload format:');
    console.log(JSON.stringify(correctPayload, null, 2));
    
    try {
      const response = await axios.post(`${baseURL}/employees`, correctPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('\n🎉 SUCCESS! Backend fix is working!');
      console.log(`✅ Employee Created: ${response.data.data.firstName} ${response.data.data.lastName}`);
      console.log(`✅ Employee ID: ${response.data.data.employeeId}`);
      console.log(`✅ Database ID: ${response.data.data.id}`);
      console.log(`✅ User Account: Created with ID ${response.data.data.userId}`);
      
      // Test that the employee can login
      try {
        const loginTest = await axios.post(`${baseURL}/auth/login`, {
          email: correctPayload.email,
          password: 'password123'  // Default password
        });
        console.log('✅ User Login: New employee can authenticate');
        console.log(`   Token received for: ${loginTest.data.data.user.firstName} ${loginTest.data.data.user.lastName}`);
        
        return {
          success: true,
          employee: response.data.data,
          loginWorking: true,
          correctPayloadFormat: correctPayload
        };
        
      } catch (loginError) {
        console.log('⚠️ User Login: Authentication needs review');
        return {
          success: true,
          employee: response.data.data,
          loginWorking: false,
          correctPayloadFormat: correctPayload
        };
      }
      
    } catch (error) {
      console.log('\n❌ Backend fix failed:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message}`);
      console.log(`   Error: ${error.response?.data?.error}`);
      return {
        success: false,
        error: error.response?.data
      };
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the comprehensive test
fixEmployeeCreationSync()
  .then(result => {
    console.log('\n' + '='.repeat(50));
    console.log('🎯 SYNC FIX RESULTS');
    console.log('='.repeat(50));
    
    if (result.success) {
      console.log('✅ BACKEND: Employee creation is now WORKING!');
      console.log('✅ API: Proper payload format identified');
      console.log(`✅ USER ACCOUNT: ${result.loginWorking ? 'Working' : 'Needs review'}`);
      
      console.log('\n📋 CORRECT PAYLOAD FORMAT for Frontend:');
      console.log(JSON.stringify(result.correctPayloadFormat, null, 2));
      
      console.log('\n🔧 FRONTEND FIXES NEEDED:');
      console.log('1. Use departmentId instead of department');
      console.log('2. Use positionId instead of position');
      console.log('3. Ensure hireDate is included');
      console.log('4. Send status as "Active" (capitalized)');
      
      console.log('\n🎉 EMPLOYEE CREATION: FIXED AND OPERATIONAL!');
    } else {
      console.log('❌ BACKEND: Still has issues');
      console.log('❌ Additional investigation needed');
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });
