// Test login with existing user from database  
const axios = require('axios');

async function testLoginWithExistingUser() {
  const BASE_URL = 'http://localhost:8080/api';
  
  // Test with the most recent user we know exists
  const testEmail = 'immediate.test.1754801265203@company.com';
  const testPassword = 'TestPassword@123'; // The password we used in our tests
  
  console.log('🔓 Testing login with existing user from database...');
  console.log('Email:', testEmail);
  console.log('Password: [TestPassword@123]');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    if (response.data.success) {
      console.log('✅ LOGIN SUCCESS!');
      console.log('The employee creation and login API is working correctly!');
      console.log('User data:', response.data.data.user);
      
      // Test protected route
      const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${response.data.data.accessToken}` }
      });
      
      console.log('\n✅ Protected route also works!');
      console.log('Profile:', profileResponse.data.data);
      
    } else {
      console.log('❌ Login failed despite user existing:', response.data);
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data);
    console.log('This confirms there is still a password issue');
    
    // Let's try a few different password variations
    const passwordVariations = [
      'TestPassword@123',
      'TestPassword123', 
      'Simple123',
      'PasswordTest123'
    ];
    
    console.log('\n🔍 Trying different password variations...');
    for (const pwd of passwordVariations) {
      try {
        await axios.post(`${BASE_URL}/auth/login`, {
          email: testEmail,
          password: pwd
        });
        console.log(`✅ SUCCESS with password: ${pwd}`);
        return;
      } catch (e) {
        console.log(`❌ Failed with: ${pwd}`);
      }
    }
  }
}

testLoginWithExistingUser();
