const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testEmployeeIdRespected() {
  try {
    console.log('🧪 Testing Employee ID Respect Fix');
    console.log('=====================================');
    
    // First, let's login to get admin token
    console.log('\n🔐 Step 1: Getting admin token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'password123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin token obtained');
    
    // Get departments and positions
    console.log('\n📋 Step 2: Getting departments and positions...');
    const [deptResponse, posResponse] = await Promise.all([
      axios.get(`${BASE_URL}/employees/meta/departments`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }),
      axios.get(`${BASE_URL}/employees/meta/positions`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
    ]);
    
    const departments = deptResponse.data.data;
    const positions = posResponse.data.data;
    
    console.log(`✅ Found ${departments.length} departments and ${positions.length} positions`);
    
    // Test with user-provided employee ID
    const userProvidedId = 'SK022';
    const testEmployeeData = {
      employeeId: userProvidedId,  // This should be respected!
      firstName: 'UserID',
      lastName: 'Test',
      email: `userid.test.${Date.now()}@company.com`,
      phone: '9876543210',
      hireDate: '2025-01-15',
      departmentId: departments[0]?.id,
      positionId: positions[0]?.id,
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345'
    };
    
    console.log(`\n👥 Step 3: Creating employee with user-provided ID: ${userProvidedId}`);
    console.log('📝 Employee data:', {
      employeeId: testEmployeeData.employeeId,
      name: `${testEmployeeData.firstName} ${testEmployeeData.lastName}`,
      email: testEmployeeData.email
    });
    
    const createResponse = await axios.post(`${BASE_URL}/employees`, testEmployeeData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n🎉 RESULT:');
    console.log('==========');
    if (createResponse.data.success) {
      const createdEmployee = createResponse.data.data;
      console.log('✅ Employee created successfully!');
      console.log('📊 Created Employee Details:');
      console.log(`   - Database ID: ${createdEmployee.id}`);
      console.log(`   - Employee ID: ${createdEmployee.employeeId}`);
      console.log(`   - Name: ${createdEmployee.firstName} ${createdEmployee.lastName}`);
      console.log(`   - Email: ${createdEmployee.email}`);
      
      // Check if the employee ID matches what user provided
      if (createdEmployee.employeeId === userProvidedId) {
        console.log(`\n🎯 SUCCESS: Employee ID '${createdEmployee.employeeId}' matches user input '${userProvidedId}'!`);
        console.log('✅ Fix confirmed: User-provided employee IDs are now respected');
      } else {
        console.log(`\n❌ FAILURE: Employee ID '${createdEmployee.employeeId}' does NOT match user input '${userProvidedId}'`);
        console.log('⚠️  Fix not working: System still auto-generating IDs');
      }
    } else {
      console.log('❌ Employee creation failed:', createResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testEmployeeIdRespected();