const axios = require('axios');

async function checkEmployeeCreationStatus() {
  console.log('❓ EMPLOYEE CREATION STATUS CHECK');
  console.log('==================================');
  
  const baseURL = 'http://localhost:8080/api';
  
  try {
    // Login as admin
    const login = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    const token = login.data.data.accessToken;
    
    // Try minimal employee creation
    const employee = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.${Date.now()}@company.com`,
      hireDate: '2025-08-10'
    };
    
    console.log('🧪 Testing employee creation with payload:');
    console.log(JSON.stringify(employee, null, 2));
    
    try {
      const response = await axios.post(`${baseURL}/employees`, employee, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ SUCCESS! Employee creation is WORKING');
      console.log(`Created: ${response.data.data.firstName} ${response.data.data.lastName}`);
      return true;
      
    } catch (error) {
      console.log('❌ FAILED! Employee creation is NOT working');
      console.log(`Error: ${error.response?.status} - ${error.response?.data?.message}`);
      console.log(`Details:`, error.response?.data);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Auth failed:', error.message);
    return false;
  }
}

checkEmployeeCreationStatus();
