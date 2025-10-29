// Simple test to verify centralized bcrypt is working
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function simpleTest() {
  console.log('🔐 SIMPLE CENTRALIZED BCRYPT TEST');
  console.log('=================================');
  
  try {
    // 1. Create a test employee
    console.log('\n1️⃣ Creating test employee...');
    
    // First login as admin
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'admin123'
    });
    
    const adminToken = adminLogin.data.accessToken;
    console.log('✅ Admin logged in successfully');
    
    // Create employee with unique email
    const testEmail = `bcrypt.test.${Date.now()}@company.com`;
    const testPassword = 'TestPassword123!';
    
    const employeeData = {
      firstName: 'Bcrypt',
      lastName: 'Test',
      email: testEmail,
      phone: '9999999999',
      hireDate: '15-08-2025',
      dateOfBirth: '15-01-1990',
      gender: 'Male',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      pinCode: '123456',
      basicSalary: 50000,
      userPassword: testPassword,
      userRole: 'employee'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/employees`, employeeData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Employee created successfully');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    
    // 2. Test login with new employee
    console.log('\n2️⃣ Testing employee login...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Employee login SUCCESSFUL!');
    console.log('🎉 CENTRALIZED BCRYPT IS WORKING!');
    
    // 3. Test protected route access
    console.log('\n3️⃣ Testing protected route access...');
    const employeeToken = loginResponse.data.accessToken;
    
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    
    console.log('✅ Protected route access successful');
    console.log(`👤 Profile: ${profileResponse.data.user.firstName} ${profileResponse.data.user.lastName}`);
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Centralized bcrypt implementation is working correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

simpleTest();
