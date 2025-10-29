const axios = require('axios');

// Test task update after validation fix
const BASE_URL = 'http://localhost:8080/api';

async function testTaskUpdateFixed() {
  console.log('🔍 TESTING TASK UPDATE AFTER VALIDATION FIX\n');

  let token = '';

  // Login
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
  } catch (error) {
    console.log('❌ Login failed');
    return;
  }

  // Get a task to update
  try {
    const tasksResponse = await axios.get(`${BASE_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (tasksResponse.data.data && tasksResponse.data.data.length > 0) {
      const task = tasksResponse.data.data[0];
      console.log('📋 Task to update:');
      console.log('  ID:', task.id);
      console.log('  Name:', task.name);
      console.log('  Current Description:', task.description);

      // Test update with proper data (no projectId, assignedTo can be null)
      console.log('\n🔍 Testing corrected update data...');
      const updateData = {
        name: task.name,
        description: task.description + ' [Updated via API test]',
        status: task.status,
        priority: task.priority,
        estimatedHours: parseFloat(task.estimatedHours), // Convert to number
        assignedTo: task.assignedTo,  // Can be null
        availableToAll: task.availableToAll
        // Note: Not including projectId as it's not allowed in updates
      };

      console.log('📤 Update data:', JSON.stringify(updateData, null, 2));

      try {
        const updateResponse = await axios.put(`${BASE_URL}/tasks/${task.id}`, updateData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Update successful!');
        console.log('📝 Updated task description:', updateResponse.data.data?.description);
        
        // Test another update to assign the task to someone
        console.log('\n🔍 Testing assignment update...');
        const assignmentUpdate = {
          description: task.description + ' [Assigned]',
          availableToAll: true,  // Make it available to all
          assignedTo: null       // Clear specific assignment when availableToAll = true
        };
        
        const assignResponse = await axios.put(`${BASE_URL}/tasks/${task.id}`, assignmentUpdate, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Assignment update successful!');
        console.log('📝 Available to all:', assignResponse.data.data?.availableToAll);
        
      } catch (error) {
        console.log('❌ Update failed:', error.response?.status, error.response?.statusText);
        console.log('📄 Error response:', JSON.stringify(error.response?.data, null, 2));
      }
    }
  } catch (error) {
    console.log('❌ Failed to get tasks:', error.message);
  }
}

testTaskUpdateFixed().catch(console.error);