const axios = require('axios');

// Test script to reproduce the API proxy issue
const BASE_URL = 'http://localhost:8080/api';
const FRONTEND_URL = 'http://localhost:3000';

async function testAPIProxyIssue() {
  console.log('🔍 TESTING API PROXY ISSUE REPRODUCTION\n');

  let token = '';

  // 1. First login to get a token
  try {
    console.log('📝 Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    
    if (loginResponse.data.success) {
      token = loginResponse.data.data.accessToken;
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return;
  }

  // 2. Test the dashboard stats endpoint that was fixed
  console.log('\n🔍 Testing dashboard stats endpoint...');
  try {
    const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Dashboard stats: SUCCESS');
    console.log('📊 Dashboard data keys:', Object.keys(dashboardResponse.data.data || {}));
  } catch (error) {
    console.log('❌ Dashboard stats failed:', error.response?.status, error.response?.statusText);
    console.log('📄 Error details:', error.response?.data?.message || error.message);
  }

  // 3. Test getting tasks from backend directly (this should work)
  console.log('\n🔍 Testing tasks API directly on backend...');
  try {
    const tasksResponse = await axios.get(`${BASE_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Backend tasks: SUCCESS');
    console.log('📋 Tasks count:', tasksResponse.data.data?.length || 0);
    
    if (tasksResponse.data.data && tasksResponse.data.data.length > 0) {
      const firstTask = tasksResponse.data.data[0];
      console.log('📝 First task ID:', firstTask.id);
      console.log('📝 First task name:', firstTask.name);
      
      // 4. Test updating a task directly on backend
      console.log('\n🔍 Testing task update on backend...');
      try {
        const updateData = {
          name: firstTask.name,
          description: firstTask.description + ' [API Test Update]',
          status: firstTask.status,
          priority: firstTask.priority,
          estimatedHours: firstTask.estimatedHours,
          projectId: firstTask.projectId
        };
        
        const updateResponse = await axios.put(`${BASE_URL}/tasks/${firstTask.id}`, updateData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Backend task update: SUCCESS');
        console.log('📝 Updated task:', updateResponse.data.data?.name);
      } catch (error) {
        console.log('❌ Backend task update failed:', error.response?.status, error.response?.statusText);
        console.log('📄 Error details:', error.response?.data?.message || error.message);
      }
    }
  } catch (error) {
    console.log('❌ Backend tasks failed:', error.response?.status, error.response?.statusText);
    console.log('📄 Error details:', error.response?.data?.message || error.message);
  }

  // 5. Test making request to frontend port (this will fail as expected)
  console.log('\n🔍 Testing API call to frontend port (should fail)...');
  try {
    const frontendTasksResponse = await axios.get(`${FRONTEND_URL}/api/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 3000
    });
    console.log('❌ Frontend port returned response (unexpected)');
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
      console.log('✅ Frontend port correctly rejects API calls (as expected)');
    } else {
      console.log('❓ Frontend port error:', error.message);
    }
  }

  console.log('\n📋 SUMMARY:');
  console.log('• Backend API (port 8080): Should work ✅');
  console.log('• Dashboard stats: Fixed endpoint should work ✅');
  console.log('• Task CRUD operations: Should work on backend ✅');
  console.log('• Frontend proxy: Should route /api/* to backend (needs verification)');
  console.log('\n🔧 Next step: Test the frontend proxy routing by accessing the app');
}

testAPIProxyIssue().catch(console.error);