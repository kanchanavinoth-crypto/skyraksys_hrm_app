const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testPayrollGenerationOnly() {
  console.log('🧪 Testing Payroll Generation with Active Employees\n');
  
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
    
    // Step 2: Check active employees
    console.log('\n2. Checking active employees...');
    const employeesResponse = await axios.get(`${BASE_URL}/employees?status=Active`, {
      headers: authHeaders
    });
    
    console.log(`✅ Found ${employeesResponse.data.data.length} active employees`);
    
    // Step 3: Try payroll generation
    console.log('\n3. Testing payroll generation...');
    try {
      const payrollGenResponse = await axios.post(`${BASE_URL}/payroll/generate`, {
        month: 8,
        year: 2025
      }, {
        headers: authHeaders
      });
      
      console.log('🎉 SUCCESS: Payroll generation worked!');
      console.log(`   Generated payrolls: ${payrollGenResponse.data.data.generatedPayrollIds.length}`);
      console.log(`   Payroll IDs: ${payrollGenResponse.data.data.generatedPayrollIds}`);
      
      console.log('\n✅ RESULT: Calculate Payroll button should now work in frontend!');
      
    } catch (payrollError) {
      console.log('❌ Payroll generation failed:');
      console.log(`   Status: ${payrollError.response?.status}`);
      console.log(`   Message: ${payrollError.response?.data?.message}`);
      
      if (payrollError.response?.data?.message === 'No employees found') {
        console.log('\n🔍 The issue is still with employee status filtering in payroll routes');
      }
      
      if (payrollError.response?.data?.message?.includes('salary structure')) {
        console.log('\n🔍 The issue is missing salary structures for employees');
      }
    }
    
    // Step 4: Test GET payroll endpoint
    console.log('\n4. Testing GET payroll records...');
    const payrollResponse = await axios.get(`${BASE_URL}/payroll`, {
      headers: authHeaders
    });
    
    console.log(`✅ Payroll records found: ${payrollResponse.data.data.length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testPayrollGenerationOnly();
