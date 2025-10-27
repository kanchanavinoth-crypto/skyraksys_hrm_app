// Test to verify the password field mapping issue
const axios = require('axios');

async function testPasswordField() {
  try {
    const BASE_URL = 'http://localhost:8080/api';
    
    // Get admin token
    const adminResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    
    const adminToken = adminResponse.data.data.accessToken;
    console.log('✅ Admin token obtained');
    
    // Test with logging to see what data is being sent
    const timestamp = Date.now();
    const testData = {
      firstName: 'Password',
      lastName: 'Test',
      email: `password.test.${timestamp}@company.com`,
      hireDate: '2025-08-10',
      userId: `password.test.${timestamp}`,
      password: 'PasswordTest123', // This should map to userPassword
      role: 'employee'
    };
    
    console.log('Sending data to API:', {
      ...testData,
      password: '[REDACTED]',
      passwordLength: testData.password.length
    });
    
    // Add detailed error logging
    try {
      const response = await axios.post(`${BASE_URL}/employees`, testData, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      console.log('✅ Employee created');
      console.log('Response success:', response.data.success);
      console.log('Response message:', response.data.message);
      
      // Wait for DB commit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test login
      console.log('\n🔓 Testing login...');
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testData.email,
        password: testData.password
      });
      
      console.log('✅ LOGIN SUCCESS! The password field mapping works correctly.');
      
    } catch (createError) {
      console.error('❌ Employee creation failed:');
      console.error('Status:', createError.response?.status);
      console.error('Data:', createError.response?.data);
      
      // Check if it's a validation error about missing userPassword
      if (createError.response?.data?.message?.includes('password')) {
        console.log('\n💡 This confirms the password field mapping issue!');
        console.log('The API expects a different field name for password.');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testPasswordField();
