const axios = require('axios');
const { sequelize } = require('./models');

const BASE_URL = 'http://localhost:8080/api';
let token = null;

async function fixTimesheetConstraint() {
  console.log('🔧 FIXING TIMESHEET CONSTRAINT ISSUE\n');
  
  // Login
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
  } catch (error) {
    console.log('❌ Login failed');
    return;
  }
  
  // Get employee data
  const empResponse = await axios.get(`${BASE_URL}/employees`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const employee = empResponse.data.data[0];
  
  // Get/create project with explicit project id
  const Project = sequelize.models.Project;
  let project = await Project.findOne({ where: { name: 'Fix Test Project' } });
  if (!project) {
    project = await Project.create({
      name: 'Fix Test Project',
      description: 'Project for fixing timesheet constraint',
      status: 'Active',
      isActive: true
    });
  }
  
  // Create/get a task for this project to test with taskId
  const Task = sequelize.models.Task;
  let task = await Task.findOne({ 
    where: { 
      name: 'Fix Test Task',
      projectId: project.id 
    } 
  });
  if (!task) {
    task = await Task.create({
      projectId: project.id,
      name: 'Fix Test Task',
      description: 'Task for testing timesheet constraint',
      status: 'Active',
      isActive: true,
      priority: 'Medium'
    });
  }
  
  console.log(`📋 Employee: ${employee.firstName} (${employee.id})`);
  console.log(`📋 Project: ${project.name} (${project.id})`);
  console.log(`📋 Task: ${task.name} (${task.id})`);
  
  // Test 1: Create timesheet WITHOUT taskId (should work)
  console.log('\n🧪 Test 1: Timesheet without taskId');
  const testData1 = {
    employeeId: employee.id,
    projectId: project.id,
    // NO taskId
    workDate: '2025-08-05',
    hoursWorked: 8,
    description: 'Test entry without task ID'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/timesheets`, testData1, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ SUCCESS without taskId:', response.data.message);
  } catch (error) {
    console.log('❌ FAILED without taskId:', error.response?.data?.message || error.message);
    console.log('Error details:', error.response?.data?.error);
  }
  
  // Test 2: Create timesheet WITH taskId (should work)
  console.log('\n🧪 Test 2: Timesheet with taskId');
  const testData2 = {
    employeeId: employee.id,
    projectId: project.id,
    taskId: task.id, // WITH taskId
    workDate: '2025-08-04',
    hoursWorked: 6,
    description: 'Test entry with task ID'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/timesheets`, testData2, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ SUCCESS with taskId:', response.data.message);
  } catch (error) {
    console.log('❌ FAILED with taskId:', error.response?.data?.message || error.message);
    console.log('Error details:', error.response?.data?.error);
  }
  
  // Test 3: Try to create duplicate (should fail)
  console.log('\n🧪 Test 3: Duplicate timesheet (should fail)');
  try {
    const response = await axios.post(`${BASE_URL}/timesheets`, testData1, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('❌ UNEXPECTED SUCCESS - duplicate should fail:', response.data.message);
  } catch (error) {
    console.log('✅ EXPECTED FAILURE - duplicate correctly blocked:', error.response?.data?.message);
  }
}

fixTimesheetConstraint().catch(console.error);
