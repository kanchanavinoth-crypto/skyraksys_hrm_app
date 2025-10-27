const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function checkDemoUsers() {
  try {
    // Try different demo credentials
    const testCredentials = [
      { email: 'admin@skyraksys.com', password: 'admin123' },
      { email: 'john.smith@skyraksys.com', password: 'password123' },
      { email: 'jane.doe@skyraksys.com', password: 'password123' },
      { email: 'mike.johnson@skyraksys.com', password: 'password123' }
    ];

    for (const creds of testCredentials) {
      try {
        console.log(`🔐 Testing login: ${creds.email}`);
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, creds);
        console.log(`✅ Login successful for ${creds.email}`);
        console.log(`👤 User: ${loginResponse.data.user.name} (${loginResponse.data.user.role})`);
        
        // Try to get profile if it's not admin
        if (loginResponse.data.user.role !== 'admin') {
          const headers = { Authorization: `Bearer ${loginResponse.data.token}` };
          try {
            const profileResponse = await axios.get(`${BASE_URL}/employees/profile`, { headers });
            console.log(`📋 Employee ID: ${profileResponse.data.employee.id}`);
          } catch (profileError) {
            console.log(`❌ Could not get employee profile: ${profileError.response?.data?.message}`);
          }
        }
        console.log('');
        return { creds, token: loginResponse.data.token, user: loginResponse.data.user };
      } catch (error) {
        console.log(`❌ Failed for ${creds.email}: ${error.response?.data?.message}`);
      }
    }
    
    console.log('❌ No valid credentials found');
    return null;
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    return null;
  }
}

checkDemoUsers();