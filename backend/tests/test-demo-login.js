const axios = require('axios');

async function testDemoLogin() {
  console.log('Testing demo user login...\n');
  
  const demoUsers = [
    { email: 'admin@test.com', role: 'admin' },
    { email: 'hr@test.com', role: 'hr' },
    { email: 'manager@test.com', role: 'manager' },
    { email: 'employee@test.com', role: 'employee' }
  ];
  
  for (const user of demoUsers) {
    try {
      console.log(`Testing ${user.email} (${user.role})...`);
      
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email: user.email,
        password: 'admin123'
      });
      
      if (response.data.success) {
        const userData = response.data.data.user;
        console.log(`✅ Login successful for ${user.email}`);
        console.log(`   - ID: ${userData.id}`);
        console.log(`   - Name: ${userData.firstName} ${userData.lastName}`);
        console.log(`   - Role: ${userData.role}`);
        console.log(`   - Token length: ${response.data.data.accessToken.length}`);
      } else {
        console.log(`❌ Login failed for ${user.email}: ${response.data.message}`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Login failed for ${user.email}: ${error.response.data.message || error.response.status}`);
      } else {
        console.log(`❌ Network error for ${user.email}: ${error.message}`);
      }
    }
    console.log('');
  }
}

testDemoLogin()
  .then(() => {
    console.log('Demo login testing complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test error:', error.message);
    process.exit(1);
  });
