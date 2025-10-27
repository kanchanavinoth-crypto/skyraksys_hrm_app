const axios = require('axios');

async function finalTest() {
  console.log('🔬 FINAL COMPREHENSIVE TEST');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Admin login (this works)
    console.log('1. Testing admin login...');
    const adminResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'admin@company.com', 
      password: 'Kx9mP7qR2nF8sA5t'
    });
    console.log('✅ Admin login works');
    
    const adminToken = adminResponse.data.data.accessToken;
    
    // Test 2: Create a simple employee
    console.log('\n2. Creating simple test employee...');
    const testData = {
      firstName: 'Final',
      lastName: 'Test', 
      email: 'final.test.12345@company.com',
      hireDate: '2025-08-10',
      userId: 'final.test.12345',
      password: 'FinalTest123',
      role: 'employee'
    };
    
    const createResponse = await axios.post('http://localhost:8080/api/employees', testData, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Employee creation works');
    
    // Test 3: Immediate login attempt
    console.log('\n3. Testing immediate login...');
    try {
      const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
        email: testData.email,
        password: testData.password
      });
      console.log('🎉 SUCCESS! Login works immediately!');
      console.log('✅ Employee creation and login API is working correctly!');
      return;
    } catch (loginError) {
      console.log('❌ Login failed immediately after creation');
    }
    
    // Test 4: Wait and try again
    console.log('\n4. Waiting 3 seconds and trying again...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const delayedLoginResponse = await axios.post('http://localhost:8080/api/auth/login', {
        email: testData.email,
        password: testData.password
      });
      console.log('✅ SUCCESS after delay! There was a timing issue.');
      return;
    } catch (delayedError) {
      console.log('❌ Still failed after delay');
    }
    
    // Test 5: Try with existing user
    console.log('\n5. Testing with existing user...');
    try {
      await axios.post('http://localhost:8080/api/auth/login', {
        email: 'immediate.test.1754801265203@company.com',
        password: 'TestPassword@123'
      });
      console.log('✅ Existing user login works - issue is with new users only');
    } catch (existingError) {
      console.log('❌ Even existing user login fails - password hash issue');
      console.log('💡 CONCLUSION: Password hashing/verification is broken');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

finalTest();
