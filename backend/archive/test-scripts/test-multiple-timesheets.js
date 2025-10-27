const axios = require('axios');

/**
 * Test Multiple Timesheet Functionality
 * This test creates multiple timesheets for the same week and verifies they are handled correctly
 */

const API_BASE = 'http://localhost:8080/api';
let accessToken;

// Test data
const testCredentials = {
  email: 'admin@company.com',
  password: 'Kx9mP7qR2nF8sA5t'  // Admin demo password
};

const currentWeekStart = new Date();
currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1); // Get Monday
const weekStartDate = currentWeekStart.toISOString().split('T')[0];

async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, testCredentials);
    if (response.data.success) {
      accessToken = response.data.data.accessToken;
      console.log('✅ Login successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function getProjects() {
  try {
    const response = await axios.get(`${API_BASE}/projects`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('❌ Failed to get projects:', error.message);
    return [];
  }
}

async function getTasks() {
  try {
    const response = await axios.get(`${API_BASE}/tasks`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('❌ Failed to get tasks:', error.message);
    return [];
  }
}

async function createMultipleTimesheets() {
  const projects = await getProjects();
  const tasks = await getTasks();
  
  if (projects.length === 0 || tasks.length === 0) {
    console.log('❌ No projects or tasks available for testing');
    return false;
  }

  console.log(`📊 Found ${projects.length} projects and ${tasks.length} tasks`);
  console.log(`📅 Creating timesheets for week starting: ${weekStartDate}`);

  // Create multiple timesheet entries for the same week
  const timesheetData = [
    {
      projectId: projects[0].id,
      taskId: tasks.find(t => t.projectId === projects[0].id)?.id || tasks[0].id,
      weekStartDate: weekStartDate,
      mondayHours: 8,
      tuesdayHours: 7.5,
      wednesdayHours: 8,
      thursdayHours: 6,
      fridayHours: 8,
      saturdayHours: 0,
      sundayHours: 0,
      description: 'Frontend development work'
    },
    {
      projectId: projects[1]?.id || projects[0].id,
      taskId: tasks.find(t => t.projectId === (projects[1]?.id || projects[0].id))?.id || tasks[1]?.id || tasks[0].id,
      weekStartDate: weekStartDate,
      mondayHours: 0,
      tuesdayHours: 0.5,
      wednesdayHours: 0,
      thursdayHours: 2,
      fridayHours: 0,
      saturdayHours: 4,
      sundayHours: 2,
      description: 'Backend API development'
    }
  ];

  const createdTimesheets = [];

  for (let i = 0; i < timesheetData.length; i++) {
    try {
      console.log(`📝 Creating timesheet ${i + 1} for project: ${projects.find(p => p.id === timesheetData[i].projectId)?.name}`);
      
      const response = await axios.post(`${API_BASE}/timesheets`, timesheetData[i], {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}` 
        }
      });

      if (response.data.success) {
        createdTimesheets.push(response.data.data);
        console.log(`✅ Timesheet ${i + 1} created successfully (ID: ${response.data.data.id})`);
      }
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log(`ℹ️ Timesheet ${i + 1} already exists for this week`);
      } else {
        console.error(`❌ Failed to create timesheet ${i + 1}:`, error.response?.data?.message || error.message);
      }
    }
  }

  console.log(`\n📋 Created ${createdTimesheets.length} new timesheets for testing`);
  return createdTimesheets.length > 0;
}

async function getTimesheetHistory() {
  try {
    const response = await axios.get(`${API_BASE}/timesheets`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success) {
      const timesheets = response.data.data || [];
      const currentWeekTimesheets = timesheets.filter(ts => ts.weekStartDate === weekStartDate);
      
      console.log(`\n📊 TIMESHEET HISTORY RESULTS:`);
      console.log(`Total timesheets: ${timesheets.length}`);
      console.log(`Current week timesheets: ${currentWeekTimesheets.length}`);
      
      if (currentWeekTimesheets.length > 1) {
        console.log('✅ Multiple timesheets found for current week:');
        currentWeekTimesheets.forEach((ts, index) => {
          const total = Object.keys(ts)
            .filter(key => key.endsWith('Hours'))
            .reduce((sum, key) => sum + (parseFloat(ts[key]) || 0), 0);
          console.log(`  ${index + 1}. Project: ${ts.project?.name || 'N/A'}, Task: ${ts.task?.name || 'N/A'}, Hours: ${total}`);
        });
        return true;
      } else {
        console.log('⚠️ Less than 2 timesheets found for current week');
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Failed to get timesheet history:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTest() {
  console.log('🎯 MULTIPLE TIMESHEET FUNCTIONALITY TEST\n');
  
  // Step 1: Login
  console.log('Step 1: Logging in...');
  if (!await login()) {
    return;
  }

  // Step 2: Create multiple timesheets for the same week
  console.log('\nStep 2: Creating multiple timesheets for the same week...');
  await createMultipleTimesheets();

  // Step 3: Verify multiple timesheets in history
  console.log('\nStep 3: Verifying timesheet history shows multiple entries...');
  const success = await getTimesheetHistory();

  console.log('\n🎯 TEST SUMMARY:');
  if (success) {
    console.log('✅ PASS - Multiple timesheet functionality is working!');
    console.log('📋 Frontend should now show multiple task entries in both:');
    console.log('   - Timesheet Entry form (already supported)');
    console.log('   - Timesheet History view (newly updated)');
  } else {
    console.log('❌ FAIL - Multiple timesheet functionality needs debugging');
  }
}

runTest().catch(console.error);