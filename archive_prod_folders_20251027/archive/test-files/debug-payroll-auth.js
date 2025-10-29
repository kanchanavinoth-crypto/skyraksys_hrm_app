const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testPayrollAuthentication() {
  console.log('🔍 Testing Payroll Authentication Issue\n');
  
  try {
    // Step 1: Login with correct HR credentials
    console.log('1. Logging in as HR...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'hr@company.com',
      password: 'Lw3nQ6xY8mD4vB7h'
    });
    
    console.log('✅ Login successful');
    console.log('   User:', loginResponse.data.data.user.firstName, loginResponse.data.data.user.lastName);
    console.log('   Role:', loginResponse.data.data.user.role);
    console.log('   Token type:', typeof loginResponse.data.data.accessToken);
    console.log('   Token length:', loginResponse.data.data.accessToken?.length);
    
    const token = loginResponse.data.data.accessToken;
    
    // Step 2: Test the JWT token directly 
    console.log('\n2. Testing JWT token validation...');
    try {
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64'));
      console.log('✅ Token decoded successfully');
      console.log('   Token payload:', decoded);
      console.log('   Expires at:', new Date(decoded.exp * 1000));
      console.log('   Is expired?', Date.now() > decoded.exp * 1000);
    } catch (e) {
      console.log('❌ Token decode failed:', e.message);
    }
    
    // Step 3: Test auth/me endpoint first (should work)
    console.log('\n3. Testing /auth/me endpoint...');
    try {
      const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ /auth/me works!');
      console.log('   User ID:', meResponse.data.data.id);
      console.log('   Employee ID:', meResponse.data.data.employee?.id);
    } catch (error) {
      console.log('❌ /auth/me failed:', error.response?.data?.message || error.message);
      return; // If auth/me fails, payroll will definitely fail
    }
    
    // Step 4: Test payroll endpoint with detailed error analysis
    console.log('\n4. Testing /payroll endpoint with detailed analysis...');
    try {
      const payrollResponse = await axios.get(`${BASE_URL}/payroll`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ /payroll works!');
      console.log('   Status:', payrollResponse.status);
      console.log('   Data:', payrollResponse.data);
    } catch (error) {
      console.log('❌ /payroll failed with detailed analysis:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      console.log('   Full error response:', JSON.stringify(error.response?.data, null, 2));
      
      // Check if it's a role-based issue
      if (error.response?.data?.message === 'Invalid token') {
        console.log('\n🔍 Token validation debugging:');
        console.log('   Authorization header format: Bearer [token]');
        console.log('   Token starts with:', token.substring(0, 20) + '...');
        console.log('   Backend might be having JWT verification issues');
      }
    }
    
    // Step 5: Test POST /payroll/generate endpoint
    console.log('\n5. Testing POST /payroll/generate endpoint...');
    try {
      const generateResponse = await axios.post(`${BASE_URL}/payroll/generate`, {
        month: 8,
        year: 2025
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ POST /payroll/generate works!');
      console.log('   Response:', generateResponse.data);
    } catch (error) {
      console.log('❌ POST /payroll/generate failed:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      if (error.response?.data?.message === 'Invalid token') {
        console.log('   🚨 AUTHENTICATION ISSUE CONFIRMED!');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testPayrollAuthentication().then(() => {
  console.log('\n🎯 Authentication testing completed!');
  process.exit(0);
}).catch(console.error);
