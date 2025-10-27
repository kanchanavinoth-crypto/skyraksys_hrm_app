const axios = require('axios');
const bcrypt = require('bcryptjs');

const BASE_URL = 'http://localhost:8080/api';

async function testDirectUserCreation() {
  try {
    console.log('🧪 Testing direct user creation and login...');
    
    // Create a test password and hash it manually
    const testPassword = 'TestPassword123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    console.log('Password test:');
    console.log('Original password:', testPassword);
    console.log('Hashed password (first 20 chars):', hashedPassword.substring(0, 20) + '...');
    
    // Verify the hash works
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log('Hash verification test:', isValid ? '✅ PASS' : '❌ FAIL');
    
    if (!isValid) {
      console.error('❌ bcrypt hash/compare is not working correctly!');
      return;
    }
    
    // Now test the actual API
    console.log('\n📝 Testing employee creation API...');
    
    // Get admin token
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    
    if (!adminLogin.data.success) {
      console.error('❌ Admin login failed');
      return;
    }
    
    const adminToken = adminLogin.data.data.accessToken;
    
    // Create employee with explicit debug info
    const timestamp = Date.now();
    const testUser = {
      firstName: 'API',
      lastName: 'Test',
      email: `api.test.${timestamp}@company.com`,
      hireDate: '2025-08-10',
      userId: `api.test.${timestamp}`,
      password: testPassword, // Use the same test password
      role: 'employee'
    };
    
    console.log('Creating user:', {
      email: testUser.email,
      userId: testUser.userId,
      passwordLength: testUser.password.length
    });
    
    const createResponse = await axios.post(`${BASE_URL}/employees`, testUser, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!createResponse.data.success) {
      console.error('❌ Employee creation failed:', createResponse.data);
      return;
    }
    
    console.log('✅ Employee created successfully');
    console.log('Response message:', createResponse.data.message);
    
    // Wait for database commit
    console.log('\n⏳ Waiting 2 seconds for database commit...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Attempt login
    console.log('🔓 Attempting login...');
    console.log('Login credentials:', {
      email: testUser.email,
      passwordToTest: testPassword
    });
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testPassword
      });
      
      if (loginResponse.data.success) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('User data:', {
          id: loginResponse.data.data.user.id,
          email: loginResponse.data.data.user.email,
          role: loginResponse.data.data.user.role,
          hasToken: !!loginResponse.data.data.accessToken
        });
        
        // Test protected route
        console.log('\n🛡️  Testing protected route...');
        const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${loginResponse.data.data.accessToken}`
          }
        });
        
        console.log('✅ Protected route access successful');
        console.log('Profile:', {
          id: profileResponse.data.data.id,
          email: profileResponse.data.data.email,
          hasEmployee: !!profileResponse.data.data.employee
        });
        
        console.log('\n🎉 ALL TESTS PASSED! The employee creation and login API is working correctly.');
        
      } else {
        console.error('❌ Login failed:', loginResponse.data);
      }
      
    } catch (loginError) {
      console.error('❌ Login request failed:', loginError.response?.data || loginError.message);
      
      // Additional debugging
      console.log('\n🔍 Debug info:');
      console.log('- Email sent to API:', testUser.email);
      console.log('- Password sent to API length:', testPassword.length);
      console.log('- Response status:', loginError.response?.status);
      console.log('- Response data:', loginError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDirectUserCreation();
