const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testFullPayrollGeneration() {
  console.log('🎯 Full Payroll Generation Test\n');
  
  try {
    // Step 1: Login as HR
    console.log('1. Logging in as HR...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'hr@company.com',
      password: 'Lw3nQ6xY8mD4vB7h'
    });
    
    const token = loginResponse.data.data.accessToken;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Test POST with detailed error response
    console.log('\n2. Testing POST /api/payroll/generate with full error details...');
    try {
      const generateResponse = await axios.post(`${BASE_URL}/payroll/generate`, {
        month: 8,
        year: 2025
      }, {
        headers: authHeaders
      });
      console.log('✅ SUCCESS! Payroll generation worked!');
      console.log(`   Status: ${generateResponse.status}`);
      console.log(`   Response:`, generateResponse.data);
    } catch (error) {
      console.log('❌ Payroll generation failed:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message}`);
      console.log(`   Full response:`, error.response?.data);
      
      // If it's still "No employees found", let's debug
      if (error.response?.data?.message === 'No employees found') {
        console.log('\n🔍 Debugging employee query...');
        
        // Check employees directly
        const employeesResponse = await axios.get(`${BASE_URL}/employees`, {
          headers: authHeaders
        });
        
        console.log(`   Total employees in system: ${employeesResponse.data.data.length}`);
        employeesResponse.data.data.forEach(emp => {
          console.log(`     - ${emp.firstName} ${emp.lastName}: status="${emp.status}"`);
        });
        
        const activeEmployees = employeesResponse.data.data.filter(emp => emp.status === 'active');
        console.log(`   Employees with status="active": ${activeEmployees.length}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testFullPayrollGeneration();
