const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testPayrollEndpoints() {
  console.log('🧪 Testing Payroll Endpoints After Route Registration Fix\n');
  
  try {
    // First login as HR to get auth token
    console.log('1. Logging in as HR...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'hr@company.com',
      password: 'Lw3nQ6xY8mD4vB7h'
    });
    
    console.log('   Login response keys:', Object.keys(loginResponse.data.data));
    
    const token = loginResponse.data.data?.accessToken || loginResponse.data.data?.token || loginResponse.data.token;
    if (!token) {
      console.log('❌ No token found in response');
      return;
    }
    console.log('✅ Login successful');
    console.log('   Token (first 50 chars):', token.substring(0, 50) + '...');
    
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test 2: Check GET /api/payroll
    console.log('\n2. Testing GET /api/payroll...');
    try {
      const payrollResponse = await axios.get(`${BASE_URL}/payroll`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/payroll works!');
      console.log(`   Status: ${payrollResponse.status}`);
      console.log(`   Response: ${JSON.stringify(payrollResponse.data, null, 2)}`);
    } catch (error) {
      if (error.response) {
        console.log(`⚠️  GET /api/payroll returned ${error.response.status}`);
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.log(`❌ GET /api/payroll error: ${error.message}`);
      }
    }
    
    // Test 3: Test POST /api/payroll/generate (should fail with validation)
    console.log('\n3. Testing POST /api/payroll/generate (validation test)...');
    try {
      const generateResponse = await axios.post(`${BASE_URL}/payroll/generate`, {
        // Missing required month/year to test validation
      }, {
        headers: authHeaders
      });
      console.log(`⚠️  POST /api/payroll/generate unexpectedly succeeded: ${generateResponse.status}`);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ POST /api/payroll/generate validation working!');
        console.log(`   Status: 400 (expected for missing month/year)`);
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        console.log(`❌ POST /api/payroll/generate error: ${error.response ? error.response.status : error.message}`);
      }
    }
    
    // Test 4: Test POST /api/payroll/generate with proper data
    console.log('\n4. Testing POST /api/payroll/generate with valid data...');
    try {
      const generateValidResponse = await axios.post(`${BASE_URL}/payroll/generate`, {
        month: 8,
        year: 2025
      }, {
        headers: authHeaders
      });
      console.log('✅ POST /api/payroll/generate works!');
      console.log(`   Status: ${generateValidResponse.status}`);
      console.log(`   Response: ${JSON.stringify(generateValidResponse.data, null, 2)}`);
    } catch (error) {
      if (error.response) {
        console.log(`⚠️  POST /api/payroll/generate returned ${error.response.status}`);
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.log(`❌ POST /api/payroll/generate error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testPayrollEndpoints().then(() => {
  console.log('\n🎯 Payroll endpoint testing completed!');
  process.exit(0);
}).catch(console.error);
