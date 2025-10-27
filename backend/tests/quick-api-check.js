#!/usr/bin/env node

/**
 * Quick API Health Check
 * Tests if the backend APIs are responding for workflow operations
 */

const axios = require('axios');

async function quickAPICheck() {
  console.log('🔧 QUICK API HEALTH CHECK');
  console.log('Testing backend API endpoints...\n');
  
  const baseURL = 'http://localhost:8080/api';
  
  try {
    // Test basic endpoints
    const tests = [
      { name: 'Health Check', url: `${baseURL}/health`, expectAuth: false },
      { name: 'Auth Login', url: `${baseURL}/auth/login`, method: 'POST', data: { email: 'admin@test.com', password: 'admin123' }, expectAuth: false }
    ];
    
    for (const test of tests) {
      try {
        const config = { timeout: 5000 };
        let response;
        
        if (test.method === 'POST' && test.data) {
          response = await axios.post(test.url, test.data, config);
        } else {
          response = await axios.get(test.url, config);
        }
        
        console.log(`✅ ${test.name}: ${response.status} - ${response.statusText}`);
        
        if (test.name === 'Auth Login' && response.data?.accessToken) {
          console.log(`   🔑 Login successful - Token received`);
          
          // Test authenticated endpoints
          const token = response.data.accessToken;
          const authHeaders = { Authorization: `Bearer ${token}` };
          
          const authTests = [
            { name: 'Get Employees', url: `${baseURL}/employees` },
            { name: 'Get Timesheets', url: `${baseURL}/timesheets` },
            { name: 'Get Leave Requests', url: `${baseURL}/leave-requests` }
          ];
          
          for (const authTest of authTests) {
            try {
              const authResponse = await axios.get(authTest.url, { headers: authHeaders, timeout: 5000 });
              console.log(`✅ ${authTest.name}: ${authResponse.status} - Found ${authResponse.data?.length || 0} records`);
            } catch (authError) {
              console.log(`❌ ${authTest.name}: ${authError.response?.status || 'Error'} - ${authError.response?.data?.message || authError.message}`);
            }
          }
        }
        
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`❌ ${test.name}: Connection refused - Backend may not be running`);
        } else {
          console.log(`❌ ${test.name}: ${error.response?.status || 'Error'} - ${error.response?.data?.message || error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ API check failed:', error.message);
  }
  
  console.log('\n🎯 API Status Summary:');
  console.log('   Backend is needed for E2E workflow validation');
  console.log('   If APIs are failing, E2E UI tests may not work properly');
}

quickAPICheck();
