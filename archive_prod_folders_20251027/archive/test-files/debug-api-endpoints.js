const axios = require('axios');

async function testProfileEndpoint() {
  try {
    console.log('🔍 Testing API endpoints...');
    
    // Step 1: Login as admin
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.data.accessToken;
      
      // Step 2: Test profile endpoint
      try {
        const profileResponse = await axios.get('http://localhost:8080/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Profile endpoint working');
        console.log('Profile data:', JSON.stringify(profileResponse.data, null, 2));
      } catch (profileError) {
        console.log('❌ Profile endpoint failed:', profileError.response?.data?.message || profileError.message);
      }
      
      // Step 3: Test employee creation with minimal data
      try {
        const employeeResponse = await axios.post('http://localhost:8080/api/employees', {
          firstName: 'Test',
          lastName: 'Employee',
          email: `test${Date.now()}@company.com`,
          phone: '1234567890'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Employee creation working');
        console.log('Created employee:', employeeResponse.data);
      } catch (empError) {
        console.log('❌ Employee creation failed:', empError.response?.data?.message || empError.message);
        if (empError.response?.data?.details) {
          console.log('Validation details:', empError.response.data.details);
        }
      }
      
      // Step 4: Test leave creation
      try {
        const leaveResponse = await axios.post('http://localhost:8080/api/leaves', {
          leaveType: 'Annual',
          startDate: '2024-03-01',
          endDate: '2024-03-01',
          reason: 'Test leave',
          isHalfDay: false
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Leave creation working');
      } catch (leaveError) {
        console.log('❌ Leave creation failed:', leaveError.response?.data?.message || leaveError.message);
        if (leaveError.response?.data?.details) {
          console.log('Leave validation details:', leaveError.response.data.details);
        }
      }
      
      // Step 5: Test payroll endpoint
      try {
        const payrollResponse = await axios.get('http://localhost:8080/api/payroll', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Payroll endpoint working');
      } catch (payrollError) {
        console.log('❌ Payroll endpoint failed:', payrollError.response?.data?.message || payrollError.message);
      }
      
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProfileEndpoint();
