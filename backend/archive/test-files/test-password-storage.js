// Test to inspect actual database password storage during employee creation
const axios = require('axios');

async function testPasswordStorage() {
  console.log('🔍 Testing actual password storage during employee creation...');
  
  try {
    const BASE_URL = 'http://localhost:8080/api';
    
    // Get admin token
    const adminResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    const adminToken = adminResponse.data.data.accessToken;
    console.log('✅ Admin token obtained');
    
    // Create a test employee with a simple password
    const testPassword = 'Simple123';
    const testEmail = `password.debug.${Date.now()}@company.com`;
    
    console.log(`📝 Creating employee with password: ${testPassword}`);
    console.log(`📧 Email: ${testEmail}`);
    
    const employeeData = {
      firstName: 'Password',
      lastName: 'Debug',
      email: testEmail,
      hireDate: '2025-08-10',
      userId: `password.debug.${Date.now()}`,
      password: testPassword,
      role: 'employee'
    };
    
    // Create the employee
    const createResponse = await axios.post(`${BASE_URL}/employees`, employeeData, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (createResponse.data.success) {
      console.log('✅ Employee created successfully');
      
      // Wait for database commit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Now check what was actually saved by attempting login with different passwords
      console.log('\n🔐 Testing different password variations...');
      
      const passwordsToTest = [
        testPassword,                    // Original password
        testPassword.toLowerCase(),      // lowercase
        testPassword.toUpperCase(),      // UPPERCASE  
        '',                             // Empty password
        'undefined',                    // String 'undefined'
        null,                          // null (will cause error)
      ];
      
      for (const pwd of passwordsToTest) {
        if (pwd === null) continue; // Skip null test
        
        try {
          const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: testEmail,
            password: pwd
          });
          
          if (loginResponse.data.success) {
            console.log(`✅ SUCCESS with password: "${pwd}"`);
            console.log('🎉 Found the working password!');
            return; // Exit on first success
          }
          
        } catch (loginError) {
          console.log(`❌ Failed with password: "${pwd}"`);
        }
      }
      
      console.log('\n❌ None of the password variations worked');
      console.log('💡 This suggests the password hash is not being stored correctly');
      
      // Additional debugging - check if the user was created at all
      console.log('\n🔍 Testing if user exists by trying with admin password...');
      try {
        await axios.post(`${BASE_URL}/auth/login`, {
          email: testEmail,
          password: 'Kx9mP7qR2nF8sA5t' // Admin password
        });
        console.log('❌ Should not work with admin password');
      } catch (e) {
        console.log('✅ Correctly rejected admin password for user');
      }
      
    } else {
      console.error('❌ Employee creation failed:', createResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testPasswordStorage();
