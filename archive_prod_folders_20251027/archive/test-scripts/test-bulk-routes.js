const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test credentials
const loginData = {
  email: 'employee@company.com',
  password: 'password123'
};

async function testBulkRoutes() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Login successful');

    // Test 1: Simple POST to bulk-save to see if it's working
    console.log('\n1️⃣ Testing bulk-save endpoint...');
    try {
      const testResponse = await axios.post(`${BASE_URL}/timesheets/bulk-save`, 
        { test: 'data' }, 
        { headers }
      );
      console.log('✅ bulk-save responded:', testResponse.status);
    } catch (error) {
      console.log('❌ bulk-save error:', error.response?.status, error.response?.data?.message);
    }

    // Test 2: Simple PUT to bulk-update to see if it's working
    console.log('\n2️⃣ Testing bulk-update endpoint...');
    try {
      const testResponse = await axios.put(`${BASE_URL}/timesheets/bulk-update`, 
        { test: 'data' }, 
        { headers }
      );
      console.log('✅ bulk-update responded:', testResponse.status);
    } catch (error) {
      console.log('❌ bulk-update error:', error.response?.status, error.response?.data?.message);
      console.log('❌ Full error:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 3: Simple POST to bulk-submit to see if it's working
    console.log('\n3️⃣ Testing bulk-submit endpoint...');
    try {
      const testResponse = await axios.post(`${BASE_URL}/timesheets/bulk-submit`, 
        { test: 'data' }, 
        { headers }
      );
      console.log('✅ bulk-submit responded:', testResponse.status);
    } catch (error) {
      console.log('❌ bulk-submit error:', error.response?.status, error.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testBulkRoutes();