const axios = require('axios');

async function debugLeaveBalanceAuth() {
  try {
    console.log('🔍 DEBUGGING LEAVE BALANCE AUTHORIZATION');
    console.log('=======================================');
    
    // Login to get admin access
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    
    const token = loginResponse.data.data.accessToken;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Authentication successful');

    // Check user profile to see the role
    try {
      const profileResponse = await axios.get('http://localhost:5000/api/auth/me', { headers });
      const userProfile = profileResponse.data.data;
      
      console.log('\n👤 USER PROFILE DETAILS:');
      console.log('========================');
      console.log('User ID:', userProfile.id);
      console.log('Email:', userProfile.email);
      console.log('Role:', userProfile.role);
      console.log('Status:', userProfile.status);
      console.log('Created:', userProfile.createdAt);
      
      console.log('\n🔍 ROLE ANALYSIS:');
      console.log('=================');
      if (userProfile.role === 'admin') {
        console.log('✅ User has admin role - should be allowed');
      } else if (userProfile.role === 'hr') {
        console.log('✅ User has hr role - should be allowed');
      } else {
        console.log(`⚠️ User has '${userProfile.role}' role - may not be allowed`);
      }
      
    } catch (profileError) {
      console.log('❌ Failed to get user profile:', profileError.response?.data?.message);
    }

    // Test the leave balance endpoint directly
    console.log('\n🧪 TESTING LEAVE BALANCE ENDPOINT:');
    console.log('==================================');
    
    try {
      const leaveBalanceResponse = await axios.get('http://localhost:5000/api/leave/meta/balance', { headers });
      console.log('✅ Leave balance endpoint works!');
      console.log('Response data:', leaveBalanceResponse.data);
      
    } catch (leaveError) {
      console.log('❌ Leave balance endpoint failed:');
      console.log('Status:', leaveError.response?.status);
      console.log('Message:', leaveError.response?.data?.message);
      console.log('Full error:', leaveError.response?.data);
    }

    // Test the admin leave balances endpoint
    console.log('\n🧪 TESTING ADMIN LEAVE BALANCES ENDPOINT:');
    console.log('=========================================');
    
    try {
      const adminLeaveResponse = await axios.get('http://localhost:5000/api/admin/leave-balances', { headers });
      console.log('✅ Admin leave balance endpoint works!');
      console.log('Response data:', adminLeaveResponse.data);
      
    } catch (adminError) {
      console.log('❌ Admin leave balance endpoint failed:');
      console.log('Status:', adminError.response?.status);
      console.log('Message:', adminError.response?.data?.message);
    }

    // Check what endpoints are actually available
    console.log('\n📋 AVAILABLE ENDPOINTS CHECK:');
    console.log('=============================');
    
    const endpoints = [
      { name: '/leaves', url: 'http://localhost:5000/api/leaves' },
      { name: '/leave/meta/types', url: 'http://localhost:5000/api/leave/meta/types' },
      { name: '/leave/meta/balance', url: 'http://localhost:5000/api/leave/meta/balance' },
      { name: '/admin/leave-balances', url: 'http://localhost:5000/api/admin/leave-balances' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint.url, { headers });
        console.log(`✅ ${endpoint.name}: Working (${response.status})`);
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Failed (${error.response?.status})`);
      }
    }

    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('=====================');
    console.log('1. Verify user role is correctly set to "admin"');
    console.log('2. Check if middleware is correctly reading req.userRole');
    console.log('3. Ensure leave balance routes are properly configured');
    console.log('4. Test with different endpoint paths');

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugLeaveBalanceAuth();
