const axios = require('axios');
const { sequelize } = require('./models');

const BASE_URL = 'http://localhost:8080/api';
let token = null;

async function debugTaskValidation() {
  console.log('🔍 DEBUG TASK VALIDATION ISSUE\n');
  
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
  
  // Get models for direct database access
  const Project = sequelize.models.Project;
  const Task = sequelize.models.Task;
  
  // Get/create project 
  let project = await Project.findOne({ where: { name: 'Validation Debug Project' } });
  if (!project) {
    project = await Project.create({
      name: 'Validation Debug Project',
      description: 'Project for validation debugging',
      status: 'Active',
      isActive: true
    });
  }
  
  // Get/create task for this project
  let task = await Task.findOne({ 
    where: { 
      name: 'Validation Debug Task',
      projectId: project.id 
    } 
  });
  if (!task) {
    task = await Task.create({
      projectId: project.id,
      name: 'Validation Debug Task',
      description: 'Task for validation debugging',
      status: 'Not Started',
      isActive: true,
      priority: 'Medium'
    });
  }
  
  console.log('📋 Database Values:');
  console.log(`Project ID: "${project.id}" (type: ${typeof project.id})`);
  console.log(`Task Project ID: "${task.projectId}" (type: ${typeof task.projectId})`);
  console.log(`IDs equal: ${project.id === task.projectId}`);
  console.log(`Task active: ${task.isActive}`);
  console.log(`Project active: ${project.isActive}`);
  
  // Test the API call that fails
  const testData = {
    employeeId: employee.id,
    projectId: project.id,
    taskId: task.id,
    workDate: '2025-08-01',
    hoursWorked: 4,
    description: 'Debug validation test with task'
  };
  
  console.log('\n📋 API Request Data:');
  console.log(`Employee ID: "${testData.employeeId}" (type: ${typeof testData.employeeId})`);
  console.log(`Project ID: "${testData.projectId}" (type: ${typeof testData.projectId})`);
  console.log(`Task ID: "${testData.taskId}" (type: ${typeof testData.taskId})`);
  
  console.log('\n🌐 Testing API call...');
  
  try {
    const response = await axios.post(`${BASE_URL}/timesheets`, testData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ API SUCCESS:', response.data.message);
  } catch (error) {
    console.log('❌ API FAILED:', error.response?.data?.message || error.message);
    
    // Let's manually check what the route validation would do
    console.log('\n🔍 Manual validation check:');
    
    // Check project
    const projectCheck = await Project.findByPk(testData.projectId);
    console.log(`Project found: ${!!projectCheck}`);
    console.log(`Project active: ${projectCheck ? projectCheck.isActive : 'N/A'}`);
    
    // Check task
    const taskCheck = await Task.findByPk(testData.taskId);
    console.log(`Task found: ${!!taskCheck}`);
    if (taskCheck) {
      console.log(`Task active: ${taskCheck.isActive}`);
      console.log(`Task projectId: "${taskCheck.projectId}"`);
      console.log(`Request projectId: "${testData.projectId}"`);
      console.log(`IDs match: ${taskCheck.projectId === testData.projectId}`);
      console.log(`String match: ${String(taskCheck.projectId) === String(testData.projectId)}`);
    }
  }
}

debugTaskValidation().catch(console.error);
