const axios = require('axios');

async function checkUserDetails() {
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    const token = loginResponse.data.data.accessToken;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Check current user details
    console.log('🔍 Checking current user details...');
    try {
      const userResponse = await axios.get('http://localhost:5000/api/auth/me', { headers });
      console.log('Current user:', JSON.stringify(userResponse.data, null, 2));
    } catch (error) {
      console.log('Failed to get user details:', error.response?.data || error.message);
    }
    
    // Check employees endpoint to see user info
    console.log('\n🔍 Checking through employees endpoint...');
    try {
      const employeesResponse = await axios.get('http://localhost:5000/api/employees', { headers });
      const employees = employeesResponse.data.data;
      console.log('Employees found:', employees.length);
      employees.forEach(emp => {
        console.log(`- ${emp.firstName} ${emp.lastName} (${emp.email}) - Role: ${emp.role || 'No role'}`);
      });
    } catch (error) {
      console.log('Failed to get employees:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

checkUserDetails();
