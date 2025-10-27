const axios = require('axios');

async function testEmployeeTaskAccess() {
  const baseURL = 'http://localhost:8080/api';
  
  try {
    // Login as regular employee
    console.log('🔐 Logging in as regular employee...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'employee@company.com',
      password: 'Mv4pS9wE2nR6kA8j'
    });
    
    const token = loginResponse.data.data.accessToken;
    const employeeId = loginResponse.data.data.user.employeeId;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Login successful, employee ID:', employeeId);
    
    // Get tasks to see their availability
    console.log('\n📋 Checking task availability for employee...');
    const tasksResponse = await axios.get(`${baseURL}/tasks`, { headers });
    const tasks = tasksResponse.data.data || tasksResponse.data;
    
    console.log(`Found ${tasks.length} tasks:`);
    tasks.forEach(task => {
      const available = task.availableToAll || task.assignedTo === employeeId;
      console.log(`- ${task.name}: availableToAll=${task.availableToAll}, assignedTo=${task.assignedTo === employeeId ? 'this employee' : (task.assignedTo || 'none')}, AVAILABLE=${available}`);
    });
    
    // Find a task that is NOT available to this employee
    const restrictedTask = tasks.find(task => !task.availableToAll && task.assignedTo !== employeeId);
    
    if (restrictedTask) {
      console.log(`\n🚫 Testing restricted task: ${restrictedTask.name}`);
      
      const timesheetData = {
        weekStartDate: '2025-10-13', // Monday of another week
        projectId: restrictedTask.projectId,
        taskId: restrictedTask.id,
        mondayHours: 8,
        tuesdayHours: 8,
        description: 'Testing restricted task access'
      };
      
      try {
        const createResponse = await axios.post(`${baseURL}/timesheets`, timesheetData, { headers });
        console.log('❌ ERROR: Timesheet created when it should have been blocked!');
        
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Task restriction working correctly: ' + error.response.data.message);
        } else {
          console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
      }
    } else {
      console.log('\n⚠️ No restricted tasks found for this employee');
    }
    
    // Find a task that IS available to this employee
    const availableTask = tasks.find(task => task.availableToAll || task.assignedTo === employeeId);
    
    if (availableTask) {
      console.log(`\n✅ Testing available task: ${availableTask.name}`);
      
      const timesheetData = {
        weekStartDate: '2025-10-06', // Monday of another week
        projectId: availableTask.projectId,
        taskId: availableTask.id,
        mondayHours: 6,
        tuesdayHours: 7,
        description: 'Testing available task access'
      };
      
      try {
        const createResponse = await axios.post(`${baseURL}/timesheets`, timesheetData, { headers });
        console.log('✅ Timesheet created successfully for available task:', createResponse.data.data.id);
        
        // Try to submit it
        console.log('\n📤 Testing submission of valid timesheet...');
        const submitResponse = await axios.put(`${baseURL}/timesheets/${createResponse.data.data.id}/submit`, {}, { headers });
        console.log('✅ Timesheet submitted successfully');
        
      } catch (error) {
        console.log('❌ Failed to create/submit timesheet for available task:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEmployeeTaskAccess();