const axios = require('axios');

async function checkDepartmentsAndPositions() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'admin@company.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.accessToken;
    const config = {
      headers: { 'Authorization': `Bearer ${token}` }
    };
    
    // Check departments
    console.log('🏢 Checking Departments...');
    try {
      const deptResponse = await axios.get('http://localhost:8080/api/departments', config);
      console.log('Departments:', JSON.stringify(deptResponse.data, null, 2));
    } catch (e) {
      console.log('Departments error:', e.response?.data || e.message);
    }
    
    // Check positions
    console.log('\n💼 Checking Positions...');
    try {
      const posResponse = await axios.get('http://localhost:8080/api/positions', config);
      console.log('Positions:', JSON.stringify(posResponse.data, null, 2));
    } catch (e) {
      console.log('Positions error:', e.response?.data || e.message);
    }
    
  } catch (error) {
    console.log('Login error:', error.response?.data || error.message);
  }
}

checkDepartmentsAndPositions();