// Simple test with proper token handling
const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testAuth() {
  try {
    console.log('🔐 Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'employee@company.com',
      password: 'password123'
    });

    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    if (loginResponse.data.success && loginResponse.data.data.accessToken) {
      const token = loginResponse.data.data.accessToken;
      console.log('\n📅 Testing timesheet history...');
      
      const historyResponse = await axios.get(`${BASE_URL}/timesheets/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('History response:', JSON.stringify(historyResponse.data, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testAuth();