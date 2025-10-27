const axios = require('axios');

async function simpleTimesheetTest() {
  console.log('🎯 SIMPLE TIMESHEET API TEST\n');
  
  // Login as admin  
  const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
    email: 'admin@test.com',
    password: 'admin123'
  });
  const token = loginResponse.data.data.accessToken;
  console.log('✅ Login successful');
  
  // Get simple data
  const empResponse = await axios.get('http://localhost:8080/api/employees', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const employee = empResponse.data.data[0];
  
  const projResponse = await axios.get('http://localhost:8080/api/timesheets/meta/projects', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const project = projResponse.data.data[0];
  
  console.log(`📋 Employee: ${employee.firstName} (${employee.id})`);
  console.log(`📋 Project: ${project.name} (${project.id})`);
  
  // Try the absolute simplest timesheet creation
  console.log('\n🧪 Creating timesheet...');
  
  const requestData = {
    employeeId: employee.id,
    projectId: project.id,
    workDate: '2025-07-06',
    hoursWorked: 8,
    description: 'Simple test'
  };
  
  console.log('Request data:', JSON.stringify(requestData, null, 2));
  
  try {
    const response = await axios.post('http://localhost:8080/api/timesheets', requestData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ SUCCESS!', response.data);
    console.log('\n🎉 TIMESHEET CREATION IS WORKING!');
    
    // Try one more with task
    const taskResponse = await axios.get(`http://localhost:8080/api/timesheets/meta/projects/${project.id}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (taskResponse.data.data.length > 0) {
      const task = taskResponse.data.data[0];
      console.log('\n🧪 Creating timesheet WITH task...');
      
      const response2 = await axios.post('http://localhost:8080/api/timesheets', {
        employeeId: employee.id,
        projectId: project.id,
        taskId: task.id,
        workDate: '2025-07-05',
        hoursWorked: 6,
        description: 'Simple test with task'
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ SUCCESS WITH TASK!', response2.data.message);
      console.log('\n🎉 BOTH PERMUTATIONS WORKING!');
    }
    
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code) {
      console.log('Error code:', error.code);
    }
    
    return false;
  }
  
  return true;
}

simpleTimesheetTest().catch(console.error);
