const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function createSalaryStructuresForActiveEmployees() {
  console.log('💰 Creating Salary Structures for Active Employees\n');
  
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
    
    // Step 2: Get active employees
    console.log('\n2. Fetching active employees...');
    const employeesResponse = await axios.get(`${BASE_URL}/employees?status=active`, {
      headers: authHeaders
    });
    
    const activeEmployees = employeesResponse.data.data;
    console.log(`Found ${activeEmployees.length} active employees`);
    
    // Step 3: Create salary structures directly in database (since we don't have API endpoint)
    console.log('\n3. Testing payroll generation with existing employees...');
    
    // Try payroll generation to see what happens
    try {
      const payrollGenResponse = await axios.post(`${BASE_URL}/payroll/generate`, {
        month: 8,
        year: 2025
      }, {
        headers: authHeaders
      });
      
      console.log('✅ Payroll generation successful!');
      console.log(`Generated payroll IDs: ${payrollGenResponse.data.data.generatedPayrollIds}`);
    } catch (error) {
      console.log(`❌ Payroll generation failed: ${error.response?.data?.message}`);
      console.log(`   Status: ${error.response?.status}`);
      
      if (error.response?.data?.message === 'No employees found') {
        console.log('\n🔍 DEBUGGING: Let me check what the payroll generation expects...');
        
        // Debug: Check what employees the payroll route actually finds
        activeEmployees.forEach(emp => {
          console.log(`   Employee: ${emp.firstName} ${emp.lastName}`);
          console.log(`     ID: ${emp.id}`);
          console.log(`     Status: "${emp.status}"`);
          console.log(`     Salary: ${emp.salary}`);
        });
      }
    }
    
    // Step 4: Try getting payroll records
    console.log('\n4. Checking existing payroll records...');
    const payrollResponse = await axios.get(`${BASE_URL}/payroll`, {
      headers: authHeaders
    });
    
    console.log(`Found ${payrollResponse.data.data.length} payroll records`);
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    console.log('Full error:', error.response?.data);
  }
}

createSalaryStructuresForActiveEmployees();
