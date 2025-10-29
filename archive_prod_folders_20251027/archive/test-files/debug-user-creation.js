const axios = require('axios');
const BASE_URL = 'http://localhost:8080/api';

async function debugUserCreation() {
  try {
    console.log('🔍 Debugging user creation issue...');
    
    // Get admin token first
    console.log('Getting admin token...');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    
    if (!adminLogin.data.success) {
      console.error('Admin login failed');
      return;
    }
    
    const adminToken = adminLogin.data.data.accessToken;
    console.log('✅ Admin token obtained');
    
    // Create a simple employee with minimal data
    const timestamp = Date.now();
    const simpleEmployee = {
      firstName: 'Debug',
      lastName: 'User',
      email: `debug.user.${timestamp}@company.com`,
      phone: '1234567890',
      hireDate: '2025-08-10',
      userId: `debug.user.${timestamp}`,
      password: 'DebugPassword123',
      role: 'employee'
    };
    
    console.log('\n📋 Creating employee with minimal data...');
    console.log('Employee data:', {
      email: simpleEmployee.email,
      userId: simpleEmployee.userId,
      firstName: simpleEmployee.firstName
    });
    
    const createResponse = await axios.post(`${BASE_URL}/employees`, simpleEmployee, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (createResponse.data.success) {
      console.log('✅ Employee created successfully');
      console.log('Response:', createResponse.data.message);
      console.log('Credentials message:', createResponse.data.credentials?.message);
      
      // Wait a moment for database to commit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to login with the new user
      console.log('\n🔓 Attempting login with new user...');
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: simpleEmployee.email,
        password: simpleEmployee.password
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Login successful!');
        console.log('User data:', loginResponse.data.data.user);
      }
    } else {
      console.error('❌ Employee creation failed');
      console.error('Response:', createResponse.data);
    }
    
  } catch (error) {
    console.error('Error during debugging:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔍 Login failed - checking possible issues:');
      console.log('1. Password might not be hashed correctly');
      console.log('2. User record might not be created');
      console.log('3. Email might not match exactly');
      console.log('4. User account might not be active');
    }
  }
}

debugUserCreation();
