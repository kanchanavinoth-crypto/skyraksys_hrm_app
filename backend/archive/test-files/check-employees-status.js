const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function checkEmployeeStatus() {
  console.log('👥 Checking Employee Status for Payroll Generation\n');
  
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
    
    // Step 2: Get all employees
    console.log('\n2. Fetching all employees...');
    const employeesResponse = await axios.get(`${BASE_URL}/employees`, {
      headers: authHeaders
    });
    
    console.log('✅ Employees found:');
    employeesResponse.data.data.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
      console.log(`      Status: "${emp.status}" | Email: ${emp.email}`);
      console.log(`      Salary: ${emp.salary || 'Not set'} | Department: ${emp.department?.name || 'None'}`);
    });
    
    // Step 3: Check which employees are "Active" status
    const activeEmployees = employeesResponse.data.data.filter(emp => 
      emp.status === 'Active' || emp.status === 'active'
    );
    
    console.log(`\n📊 Status Analysis:`);
    console.log(`   Total employees: ${employeesResponse.data.data.length}`);
    console.log(`   Active employees: ${activeEmployees.length}`);
    
    if (activeEmployees.length === 0) {
      console.log('\n❌ ISSUE FOUND: No employees with status "Active"');
      console.log('   Employee statuses found:');
      const statuses = [...new Set(employeesResponse.data.data.map(emp => emp.status))];
      statuses.forEach(status => {
        const count = employeesResponse.data.data.filter(emp => emp.status === status).length;
        console.log(`     "${status}": ${count} employees`);
      });
      console.log('\n🔧 SOLUTION: Update employee status to "Active" for payroll generation');
    } else {
      console.log('✅ Active employees found - payroll generation should work');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

checkEmployeeStatus();
