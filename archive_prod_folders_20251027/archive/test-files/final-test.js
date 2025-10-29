// Simple test to verify employee creation and login
const axios = require('axios');

async function quickTest() {
  try {
    const BASE_URL = 'http://localhost:8080/api';
    
    // Step 1: Get admin token
    const adminResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    
    const adminToken = adminResponse.data.data.accessToken;
    console.log('✅ Admin authenticated');
    
    // Step 2: Create test employee
    const testEmail = `test.${Date.now()}@company.com`;
    const testPassword = 'TestPass123';
    
    const employeeData = {
      firstName: 'Test',
      lastName: 'Employee',
      email: testEmail,
      hireDate: '2025-08-10',
      userId: 'test' + Date.now(),
      password: testPassword,
      role: 'employee'
    };
    
    await axios.post(`${BASE_URL}/employees`, employeeData, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    console.log('✅ Employee created');
    
    // Step 3: Wait and try login
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      
      if (loginResponse.data.success) {
        console.log('✅ LOGIN SUCCESS - API is working correctly!');
        return true;
      }
    } catch (loginError) {
      console.log('❌ LOGIN FAILED');
      console.log('Status:', loginError.response?.status);
      console.log('Message:', loginError.response?.data?.message);
      return false;
    }
    
  } catch (error) {
    console.error('Test error:', error.response?.data?.message || error.message);
    return false;
  }
}

quickTest().then(success => {
  console.log('\nFINAL RESULT:', success ? '🎉 TEST PASSED' : '💥 TEST FAILED');
});
