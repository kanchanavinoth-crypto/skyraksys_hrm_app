// Test with detailed error logging to find the exact issue
const axios = require('axios');

async function debugEmployeeCreation() {
  try {
    const BASE_URL = 'http://localhost:8080/api';
    
    // Get admin token
    const adminResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    
    const adminToken = adminResponse.data.data.accessToken;
    console.log('✅ Admin token obtained');
    
    // Create minimal test data to identify the issue
    const timestamp = Date.now();
    const minimalData = {
      firstName: 'Debug',
      lastName: 'Test',
      email: `debug.${timestamp}@company.com`,
      hireDate: '2025-08-10',
      
      // User account fields - exactly as expected by API
      userId: `debug${timestamp}`,
      password: 'Debug123',
      role: 'employee'
    };
    
    console.log('\n📋 Sending minimal data:');
    console.log(JSON.stringify(minimalData, null, 2));
    
    try {
      const response = await axios.post(`${BASE_URL}/employees`, minimalData, {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('\n✅ API Response:');
      console.log('Success:', response.data.success);
      console.log('Message:', response.data.message);
      
      if (response.data.success) {
        console.log('\n🎯 Employee creation claimed to be successful');
        console.log('Now checking if user was actually stored in database...');
        
        // Check database immediately
        setTimeout(async () => {
          const db = require('./backend/models');
          const newUser = await db.User.findOne({
            where: { email: minimalData.email },
            order: [['createdAt', 'DESC']]
          });
          
          if (newUser) {
            console.log('✅ SUCCESS: User found in database!');
            console.log('User ID:', newUser.id);
            console.log('Email:', newUser.email);
            console.log('Role:', newUser.role);
            
            // Now test login
            console.log('\n🔓 Testing login...');
            try {
              const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                email: minimalData.email,
                password: minimalData.password
              });
              console.log('🎉 LOGIN SUCCESS! Everything is working!');
            } catch (loginError) {
              console.log('❌ Login failed:', loginError.response?.data?.message);
            }
          } else {
            console.log('❌ PROBLEM: User NOT found in database despite API success');
            console.log('This means the transaction is rolling back after success response');
          }
          
          process.exit(0);
        }, 1000);
      }
      
    } catch (createError) {
      console.error('\n❌ Employee creation failed:');
      console.error('Status:', createError.response?.status);
      console.error('Error data:', createError.response?.data);
      
      // Check for specific validation messages
      const errorMessage = createError.response?.data?.message || '';
      if (errorMessage.includes('User ID and password are required')) {
        console.log('\n💡 FOUND THE ISSUE: API expects userAccountId and userPassword fields');
        console.log('But we are sending userId and password');
      } else if (errorMessage.includes('already exists')) {
        console.log('\n💡 User/email already exists - trying with different email');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

debugEmployeeCreation();
