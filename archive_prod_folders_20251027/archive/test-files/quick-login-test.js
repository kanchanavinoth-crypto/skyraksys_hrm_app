// Simple immediate test
const axios = require('axios');

async function quickTest() {
  const BASE_URL = 'http://localhost:8080/api';
  
  try {
    // Get admin token
    const admin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com', 
      password: 'Kx9mP7qR2nF8sA5t'
    });
    console.log('✅ Admin login OK');
    
    // Create employee
    const testEmail = `immediate.test.${Date.now()}@company.com`;
    const testPassword = 'Immediate123';
    
    await axios.post(`${BASE_URL}/employees`, {
      firstName: 'Immediate',
      lastName: 'Test', 
      email: testEmail,
      hireDate: '2025-08-10',
      userId: 'immediate' + Date.now(),
      password: testPassword,
      role: 'employee'
    }, {
      headers: { 'Authorization': `Bearer ${admin.data.data.accessToken}` }
    });
    
    console.log('✅ Employee created');
    
    // Immediate login test
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    console.log('🎉 LOGIN SUCCESS! API is working correctly.');
    console.log('User:', login.data.data.user.email);
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Login failed - user may not be stored properly');
    } else {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }
  }
}

quickTest();
