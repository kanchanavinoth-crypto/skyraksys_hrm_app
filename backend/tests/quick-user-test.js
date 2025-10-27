#!/usr/bin/env node

/**
 * Quick User Verification for E2E Testing
 */

const axios = require('axios');

async function quickUserTest() {
  console.log('🔍 Quick User Verification for E2E Testing\n');
  
  const testLogins = [
    { email: 'admin@test.com', password: 'admin123', role: 'admin' },
    { email: 'john.doe@test.com', password: 'password123', role: 'employee' },
    { email: 'jane.smith@test.com', password: 'password123', role: 'employee' }
  ];
  
  let workingUsers = 0;
  
  for (const user of testLogins) {
    try {
      console.log(`👤 Testing login: ${user.email}`);
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email: user.email,
        password: user.password
      });
      
      if (response.data && response.data.accessToken) {
        console.log(`   ✅ Login successful - Role: ${response.data.user?.role || 'unknown'}`);
        workingUsers++;
      } else {
        console.log(`   ❌ Login failed - No token received`);
      }
    } catch (error) {
      console.log(`   ❌ Login failed - ${error.response?.data?.message || error.message}`);
    }
  }
  
  console.log(`\n📊 Working Users: ${workingUsers}/${testLogins.length}`);
  
  if (workingUsers >= 1) {
    console.log('✅ Sufficient users available for E2E testing');
    return true;
  } else {
    console.log('❌ Not enough working users for comprehensive E2E testing');
    return false;
  }
}

quickUserTest().then(success => {
  if (success) {
    console.log('\n🚀 Ready to proceed with E2E testing!');
  } else {
    console.log('\n⚠️ May need to create/fix user accounts first');
  }
}).catch(error => {
  console.error('User verification failed:', error.message);
});
