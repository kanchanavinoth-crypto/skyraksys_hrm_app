// Centralized bcrypt test
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function runQuickTest() {
  console.log('🧪 CENTRALIZED BCRYPT TEST');
  console.log('==========================');
  
  try {
    // Test admin login
    console.log('\n1️⃣ Testing admin login...');
    const adminResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Zx9mN4kL2pQ8vF5w'
    });
    
    console.log('✅ Admin login successful');
    const token = adminResponse.data.token;
    
    // Test employee creation
    console.log('\n2️⃣ Creating test employee...');
    const employee = {
      personalInfo: {
        firstName: 'Quick',
        lastName: 'Test',
        email: 'quicktest@company.com',
        phone: '555-9999',
        dateOfBirth: '01-01-1990',
        gender: 'Male',
        address: '123 Test St'
      },
      employmentInfo: {
        employeeId: 'EMP-QUICK-001',
        department: 'Testing',
        position: 'Test User',
        hireDate: '10-08-2025',
        workLocation: 'Office',
        employmentType: 'Full-time',
        workSchedule: 'Regular',
        reportingManager: 'admin@company.com'
      },
      credentials: {
        userEmail: 'quicktest@company.com',
        userPassword: 'QuickTest123!'
      }
    };
    
    const createResponse = await axios.post(`${BASE_URL}/employees`, employee, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Employee created successfully');
    
    // Test new employee login
    console.log('\n3️⃣ Testing new employee login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'quicktest@company.com',
      password: 'QuickTest123!'
    });
    
    console.log('✅ New employee login successful!');
    console.log('\n🎉 ALL TESTS PASSED - CENTRALIZED BCRYPT WORKING!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response ? error.response.data : error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

runQuickTest();
