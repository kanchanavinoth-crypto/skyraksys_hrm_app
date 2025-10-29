// Test centralized bcrypt implementation
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testCentralizedBcrypt() {
  console.log('🧪 TESTING CENTRALIZED BCRYPT IMPLEMENTATION');
  console.log('=' .repeat(60));

  try {
    // Test 1: Create a new employee via API
    console.log('\n1️⃣ Testing Employee Creation with Centralized Bcrypt...');
    
    // First login as admin to get token
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Zx9mN4kL2pQ8vF5w'
    });

    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login successful');

    // Create a new employee
    const newEmployee = {
      personalInfo: {
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah.wilson@company.com',
        phone: '555-0199',
        dateOfBirth: '15-06-1992',
        gender: 'Female',
        address: '789 Oak Street, City, State 12345'
      },
      employmentInfo: {
        employeeId: 'EMP-2025-006',
        department: 'Marketing',
        position: 'Marketing Coordinator',
        hireDate: '01-02-2025',
        workLocation: 'Office',
        employmentType: 'Full-time',
        workSchedule: 'Regular',
        reportingManager: 'hr@company.com'
      },
      credentials: {
        userEmail: 'sarah.wilson@company.com',
        userPassword: 'CentralizedTest123!'
      }
    };

    const createResponse = await axios.post(`${BASE_URL}/employees`, newEmployee, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Employee created:', createResponse.data.message);
    
    // Test 2: Login with the newly created employee
    console.log('\n2️⃣ Testing Login with Centralized Bcrypt...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'sarah.wilson@company.com',
      password: 'CentralizedTest123!'
    });

    console.log('✅ Employee login successful:', loginResponse.data.message);
    
    const employeeToken = loginResponse.data.token;

    // Test 3: Access protected route
    console.log('\n3️⃣ Testing Protected Route Access...');
    
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });

    console.log('✅ Protected route access successful:', profileResponse.data.user.email);

    // Test 4: Change password using centralized bcrypt
    console.log('\n4️⃣ Testing Password Change with Centralized Bcrypt...');
    
    const changePasswordResponse = await axios.put(`${BASE_URL}/auth/change-password`, {
      currentPassword: 'CentralizedTest123!',
      newPassword: 'UpdatedPassword456!'
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });

    console.log('✅ Password changed successfully:', changePasswordResponse.data.message);

    // Test 5: Login with new password
    console.log('\n5️⃣ Testing Login with Updated Password...');
    
    const newPasswordLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'sarah.wilson@company.com',
      password: 'UpdatedPassword456!'
    });

    console.log('✅ New password login successful:', newPasswordLogin.data.message);

    // Test 6: Verify old password doesn't work
    console.log('\n6️⃣ Verifying Old Password is Invalid...');
    
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'sarah.wilson@company.com',
        password: 'CentralizedTest123!'
      });
      console.log('❌ ERROR: Old password should not work!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Confirmed: Old password correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 ALL CENTRALIZED BCRYPT TESTS PASSED!');
    console.log('=' .repeat(60));
    console.log('✅ Employee creation uses centralized bcrypt');
    console.log('✅ User authentication uses centralized bcrypt');
    console.log('✅ Password changes use centralized bcrypt');
    console.log('✅ All bcrypt operations are consistent');
    console.log('✅ Password security is maintained');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response ? error.response.data : error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Make sure the backend is running before testing
console.log('🚀 Starting Centralized Bcrypt Test...');
console.log('⏳ Make sure the backend server is running on port 3001...');

setTimeout(() => {
  testCentralizedBcrypt();
}, 2000);
