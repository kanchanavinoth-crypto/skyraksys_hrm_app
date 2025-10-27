const axios = require('axios');

// Simple test to check manager login
const testManagerLogin = async () => {
  try {
    console.log('Testing manager login...');
    
    const response = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'manager@test.com',
      password: 'admin123'
    });
    
    if (response.data.token) {
      console.log('✅ Manager login successful');
      console.log('Manager ID:', response.data.employee?.id);
      console.log('Role:', response.data.employee?.role);
      return response.data.token;
    } else {
      console.log('❌ No token received');
      return null;
    }
    
  } catch (error) {
    console.log('❌ Manager login failed:', error.response?.data || error.message);
    
    // Try admin login instead
    try {
      console.log('Trying admin login...');
      const adminResponse = await axios.post('http://localhost:8080/api/auth/login', {
        email: 'admin@test.com',
        password: 'admin123'
      });
      
      if (adminResponse.data.token) {
        console.log('✅ Admin login successful');
        return adminResponse.data.token;
      }
    } catch (adminError) {
      console.log('❌ Admin login also failed:', adminError.response?.data || adminError.message);
    }
    
    return null;
  }
};

// Test the pending timesheets endpoint
const testPendingTimesheets = async (token) => {
  try {
    console.log('\nTesting pending timesheets endpoint...');
    
    const response = await axios.get('http://localhost:8080/api/timesheets/approval/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Pending timesheets API working');
    console.log('Response structure:', {
      success: response.data.success,
      dataCount: response.data.data?.length || 0,
      hasSummary: !!response.data.summary
    });
    
    if (response.data.data && response.data.data.length > 0) {
      const sample = response.data.data[0];
      console.log('Sample timesheet fields:', Object.keys(sample));
    }
    
    return true;
  } catch (error) {
    console.log('❌ Pending timesheets API failed:', error.response?.data || error.message);
    return false;
  }
};

// Main test
const runQuickTest = async () => {
  console.log('🔍 Quick Approval Screen Test');
  console.log('============================\n');
  
  const token = await testManagerLogin();
  if (token) {
    await testPendingTimesheets(token);
  }
  
  console.log('\n✅ Quick test complete');
};

runQuickTest();