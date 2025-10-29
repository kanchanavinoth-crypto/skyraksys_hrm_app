// Test with exact password tracking
const axios = require('axios');
const bcrypt = require('bcryptjs');

async function testExactPassword() {
  try {
    const BASE_URL = 'http://localhost:8080/api';
    
    // Get admin token
    const adminResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    
    const adminToken = adminResponse.data.data.accessToken;
    console.log('✅ Admin token obtained');
    
    // Use a very simple, clear password
    const EXACT_PASSWORD = 'Simple123';
    const timestamp = Date.now();
    
    console.log(`🔐 Using exact password: "${EXACT_PASSWORD}"`);
    console.log(`📧 Email will be: exact.test.${timestamp}@company.com`);
    
    const employeeData = {
      firstName: 'Exact',
      lastName: 'Test',
      email: `exact.test.${timestamp}@company.com`,
      hireDate: '2025-08-10',
      userId: `exact.test.${timestamp}`,
      password: EXACT_PASSWORD,  // Very clear password
      role: 'employee'
    };
    
    // Create employee
    console.log('\n📝 Creating employee...');
    const createResponse = await axios.post(`${BASE_URL}/employees`, employeeData, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (!createResponse.data.success) {
      console.error('❌ Creation failed:', createResponse.data);
      return;
    }
    
    console.log('✅ Employee created successfully');
    
    // Wait for commit
    console.log('⏳ Waiting for database...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try login with EXACT same password
    console.log(`\n🔓 Attempting login with exact password: "${EXACT_PASSWORD}"`);
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: employeeData.email,
        password: EXACT_PASSWORD
      });
      
      console.log('🎉 LOGIN SUCCESS! Password matching works correctly.');
      console.log('User:', loginResponse.data.data.user.email);
      
    } catch (loginError) {
      console.log('❌ Login still failed');
      console.log('Credentials used:');
      console.log('  Email:', employeeData.email);
      console.log('  Password:', EXACT_PASSWORD);
      console.log('  Password length:', EXACT_PASSWORD.length);
      console.log('Error:', loginError.response?.data);
      
      // Let's also manually verify the bcrypt hash
      console.log('\n🔬 Manual bcrypt test:');
      const testHash = await bcrypt.hash(EXACT_PASSWORD, 12);
      const isHashValid = await bcrypt.compare(EXACT_PASSWORD, testHash);
      console.log('Manual bcrypt verification:', isHashValid ? '✅ Working' : '❌ Broken');
      
      if (isHashValid) {
        console.log('\n💡 The bcrypt library works fine, so the issue must be:');
        console.log('1. Password is not being stored correctly during employee creation');
        console.log('2. OR there is a field mismatch in the user record');
        console.log('3. OR the login API is not finding/comparing the right field');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testExactPassword();
