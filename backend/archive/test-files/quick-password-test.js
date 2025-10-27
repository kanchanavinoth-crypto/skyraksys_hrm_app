const axios = require('axios');

async function quickPasswordTest() {
  console.log('🚀 Testing password fix...');
  
  try {
    // Admin login
    const adminResp = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    const token = adminResp.data.data.accessToken;
    
    // Create employee
    const timestamp = Date.now();
    const testData = {
      firstName: 'Fix',
      lastName: 'Test',
      email: `fix.test.${timestamp}@company.com`,
      hireDate: '2025-08-10',
      userId: `fix.test.${timestamp}`,
      password: 'FixTest123',
      role: 'employee'
    };
    
    await axios.post('http://localhost:8080/api/employees', testData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Employee created');
    
    // Wait and test login
    await new Promise(r => setTimeout(r, 2000));
    
    const loginResp = await axios.post('http://localhost:8080/api/auth/login', {
      email: testData.email,
      password: testData.password
    });
    
    console.log('🎉 SUCCESS! Password issue is FIXED!');
    console.log(`✅ User ${loginResp.data.data.user.email} can login`);
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Still failing - password issue not fixed yet');
    } else {
      console.log('❌ Other error:', error.message);
    }
  }
}

quickPasswordTest();
