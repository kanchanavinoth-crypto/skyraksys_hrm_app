const axios = require('axios');

// Test relationship performance and edge cases
const BASE_URL = 'http://localhost:8080/api';

async function testRelationshipEdgeCases() {
  console.log('🔬 TESTING PROJECT-TASK RELATIONSHIP EDGE CASES\n');

  let token = '';

  // Login
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful\n');
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
    return;
  }

  // Test 1: Try to create a task with invalid project ID
  console.log('1️⃣ Testing: Task creation with invalid project ID');
  try {
    const invalidTaskData = {
      name: 'Invalid Project Test Task',
      description: 'Testing with non-existent project ID',
      projectId: '00000000-0000-0000-0000-000000000000', // Non-existent
      status: 'Not Started',
      priority: 'Low',
      estimatedHours: 5,
      availableToAll: true
    };

    const response = await axios.post(`${BASE_URL}/tasks`, invalidTaskData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   ⚠️  Task created with invalid project ID:', response.data.data.id);
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 404) {
      console.log('   ✅ Properly rejected invalid project ID:', error.response.data.message || 'Invalid project reference');
    } else {
      console.log('   ❌ Unexpected error:', error.response?.data || error.message);
    }
  }

  // Test 2: Test updating task's project reference
  console.log('\n2️⃣ Testing: Updating task project reference');
  try {
    // First create a valid task
    const taskData = {
      name: 'Project Update Test Task',
      description: 'Testing project update functionality',
      projectId: '12345678-1234-1234-1234-123456789001',
      status: 'Not Started',
      priority: 'Medium',
      estimatedHours: 3,
      availableToAll: true
    };

    const createResponse = await axios.post(`${BASE_URL}/tasks`, taskData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const taskId = createResponse.data.data.id;
    console.log(`   ✅ Created test task: ${taskId}`);

    // Now update to different project
    const updateData = {
      projectId: '12345678-1234-1234-1234-123456789002' // Mobile App project
    };

    const updateResponse = await axios.put(`${BASE_URL}/tasks/${taskId}`, updateData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   ✅ Updated project reference successfully`);
    console.log(`      - New project: ${updateResponse.data.data.project?.name || 'Not loaded'}`);

    // Verify the change in both projects
    const oldProjectResponse = await axios.get(`${BASE_URL}/projects/12345678-1234-1234-1234-123456789001`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const newProjectResponse = await axios.get(`${BASE_URL}/projects/12345678-1234-1234-1234-123456789002`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const taskInOldProject = oldProjectResponse.data.data.tasks.find(t => t.id === taskId);
    const taskInNewProject = newProjectResponse.data.data.tasks.find(t => t.id === taskId);

    if (!taskInOldProject && taskInNewProject) {
      console.log(`   ✅ Task successfully moved between projects`);
    } else if (taskInOldProject && taskInNewProject) {
      console.log(`   ⚠️  Task appears in both projects (possible caching issue)`);
    } else if (taskInOldProject && !taskInNewProject) {
      console.log(`   ❌ Task still in old project, not in new project`);
    } else {
      console.log(`   ❌ Task not found in either project`);
    }

  } catch (error) {
    console.log('   ❌ Error testing project update:', error.response?.data || error.message);
  }

  // Test 3: Test deleting a project with tasks
  console.log('\n3️⃣ Testing: Project deletion behavior with associated tasks');
  try {
    // First check if we can delete a project that has tasks
    const projectWithTasksId = '12345678-1234-1234-1234-123456789003'; // Data Analytics
    
    const deleteResponse = await axios.delete(`${BASE_URL}/projects/${projectWithTasksId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('   ⚠️  Project deleted successfully despite having tasks');
    
    // Check what happened to the tasks
    const orphanedTasksResponse = await axios.get(`${BASE_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const orphanedTasks = orphanedTasksResponse.data.data.filter(task => 
      task.projectId === projectWithTasksId
    );

    if (orphanedTasks.length > 0) {
      console.log(`   ⚠️  Found ${orphanedTasks.length} orphaned tasks after project deletion`);
      orphanedTasks.forEach(task => {
        console.log(`      - "${task.name}" still references deleted project`);
      });
    } else {
      console.log('   ✅ Tasks properly handled after project deletion');
    }

  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 409) {
      console.log('   ✅ Project deletion properly restricted when tasks exist');
    } else {
      console.log('   ❌ Unexpected error:', error.response?.data || error.message);
    }
  }

  // Test 4: Performance test - loading projects with many tasks
  console.log('\n4️⃣ Testing: Performance with project-task loading');
  try {
    const startTime = Date.now();
    
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const loadTime = Date.now() - startTime;
    const projects = projectsResponse.data.data;
    const totalTasks = projects.reduce((sum, project) => sum + (project.tasks?.length || 0), 0);

    console.log(`   ✅ Loaded ${projects.length} projects with ${totalTasks} total tasks in ${loadTime}ms`);
    
    if (loadTime < 500) {
      console.log('   ✅ Performance: Excellent (< 500ms)');
    } else if (loadTime < 1000) {
      console.log('   ✅ Performance: Good (< 1s)');
    } else {
      console.log('   ⚠️  Performance: Slow (> 1s) - consider optimization');
    }

  } catch (error) {
    console.log('   ❌ Error testing performance:', error.response?.data || error.message);
  }

  console.log('\n📋 EDGE CASE ANALYSIS SUMMARY:');
  console.log('✅ Tested invalid project ID handling');
  console.log('✅ Tested task project reference updates');
  console.log('✅ Tested project deletion with tasks');
  console.log('✅ Tested loading performance');
}

testRelationshipEdgeCases().catch(console.error);