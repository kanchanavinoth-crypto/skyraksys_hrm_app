const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testEmployeeEditFunctionality() {
  try {
    console.log('🧪 Testing Employee Edit Functionality');
    console.log('======================================');
    
    // Login as admin
    console.log('\n🔐 Step 1: Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'password123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Get list of employees to test with
    console.log('\n📋 Step 2: Getting employee list...');
    const employeesResponse = await axios.get(`${BASE_URL}/employees`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const employees = employeesResponse.data.data;
    if (employees.length === 0) {
      console.log('❌ No employees found to test with');
      return;
    }
    
    const testEmployee = employees[0];
    console.log(`✅ Found test employee: ${testEmployee.firstName} ${testEmployee.lastName} (ID: ${testEmployee.employeeId})`);
    
    // Test 1: Basic information update (should work)
    console.log('\n🧪 Test 1: Basic Information Update');
    console.log('-----------------------------------');
    
    const basicUpdateData = {
      firstName: testEmployee.firstName + '_Updated',
      lastName: testEmployee.lastName + '_Test',
      phone: '9876543210',
      address: '123 Updated Street'
    };
    
    try {
      const updateResponse = await axios.put(`${BASE_URL}/employees/${testEmployee.id}`, basicUpdateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Basic information update successful');
        console.log(`   Updated name: ${updateResponse.data.data.firstName} ${updateResponse.data.data.lastName}`);
      } else {
        console.log('❌ Basic information update failed:', updateResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Basic information update error:', error.response?.data?.message || error.message);
    }
    
    // Test 2: Employee ID update to unique value (should work for admin)
    console.log('\n🧪 Test 2: Employee ID Update (Unique Value)');
    console.log('--------------------------------------------');
    
    const uniqueEmployeeId = `TEST_${Date.now()}`;
    
    try {
      const idUpdateResponse = await axios.put(`${BASE_URL}/employees/${testEmployee.id}`, {
        employeeId: uniqueEmployeeId
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (idUpdateResponse.data.success) {
        console.log('✅ Employee ID update successful');
        console.log(`   New employee ID: ${idUpdateResponse.data.data.employeeId}`);
      } else {
        console.log('❌ Employee ID update failed:', idUpdateResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Employee ID update error:', error.response?.data?.message || error.message);
    }
    
    // Test 3: Employee ID update to duplicate value (should fail)
    console.log('\n🧪 Test 3: Employee ID Update (Duplicate Value)');
    console.log('-----------------------------------------------');
    
    if (employees.length > 1) {
      const duplicateEmployeeId = employees[1].employeeId;
      
      try {
        const duplicateUpdateResponse = await axios.put(`${BASE_URL}/employees/${testEmployee.id}`, {
          employeeId: duplicateEmployeeId
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log('❌ UNEXPECTED: Duplicate employee ID update should have failed but succeeded');
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
          console.log('✅ Duplicate employee ID properly rejected');
          console.log(`   Error: ${error.response.data.message}`);
        } else {
          console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
        }
      }
    } else {
      console.log('⚠️  Skipped - only one employee available, cannot test duplicate ID');
    }
    
    // Test 4: Critical field update verification
    console.log('\n🧪 Test 4: Critical Field Update (Admin)');
    console.log('----------------------------------------');
    
    try {
      const criticalUpdateResponse = await axios.put(`${BASE_URL}/employees/${testEmployee.id}`, {
        status: 'Active',
        // departmentId and positionId would require valid IDs
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (criticalUpdateResponse.data.success) {
        console.log('✅ Critical field update successful (admin has permission)');
      } else {
        console.log('❌ Critical field update failed:', criticalUpdateResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Critical field update error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Employee Edit Functionality Test Complete');
    console.log('===========================================');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.response?.data || error.message);
  }
}

// Run the test
testEmployeeEditFunctionality();