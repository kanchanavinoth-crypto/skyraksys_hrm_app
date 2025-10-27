const axios = require('axios');

// Debug the task update validation issue
const BASE_URL = 'http://localhost:8080/api';

async function debugTaskUpdate() {
  console.log('🔍 DEBUGGING TASK UPDATE VALIDATION\n');

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
      console.log('  Description:', task.description);
      console.log('  Status:', task.status);
      console.log('  Priority:', task.priority);
      console.log('  Estimated Hours:', task.estimatedHours);
      console.log('  Project ID:', task.projectId);
      console.log('  Assigned To:', task.assignedTo);
      console.log('  Available To All:', task.availableToAll);

      // Try minimal update with exact same data
      console.log('\n🔍 Testing minimal update with exact data...');
      const updateData = {
        name: task.name,
        description: task.description,
        status: task.status,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        projectId: task.projectId,
        assignedTo: task.assignedTo,
        availableToAll: task.availableToAll
      };

      console.log('📤 Update data:', JSON.stringify(updateData, null, 2));

      try {
        const updateResponse = await axios.put(`${BASE_URL}/tasks/${task.id}`, updateData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Update successful:', updateResponse.data);
      } catch (error) {
        console.log('❌ Update failed:', error.response?.status, error.response?.statusText);
        console.log('📄 Error response:', JSON.stringify(error.response?.data, null, 2));
        
        // Try a simple field update
        console.log('\n🔍 Testing minimal field update (just description)...');
        const simpleUpdate = {
          description: task.description + ' [Updated]'
        };
        
        try {
          const simpleResponse = await axios.put(`${BASE_URL}/tasks/${task.id}`, simpleUpdate, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ Simple update successful');
        } catch (simpleError) {
          console.log('❌ Simple update also failed:', simpleError.response?.data);
        }
      }
    }
  } catch (error) {
    console.log('❌ Failed to get tasks:', error.message);
  }
}

debugTaskUpdate().catch(console.error);