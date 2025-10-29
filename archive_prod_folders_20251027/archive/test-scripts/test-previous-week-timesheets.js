/**
 * Comprehensive Previous Week Timesheet Testing
 * 
 * This script tests the ability to:
 * 1. Create timesheets for previous weeks
 * 2. Submit timesheets for previous weeks
 * 3. View submitted previous week timesheets in history
 * 4. Verify proper date handling and week calculations
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Test configuration
const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

// Test data - we'll test with actual company credentials
const TEST_USERS = {
  admin: {
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t'
  },
  employee: {
    email: 'employee@company.com',
    password: 'employee123'
  }
};

// Simple HTTP request wrapper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url.startsWith('http') ? url : `${API_URL}${url}`);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            success: false,
            data: { message: 'Invalid JSON response', raw: data }
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Helper function to get Monday of a specific week
function getMondayOfWeek(date, weeksAgo = 0) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff - (weeksAgo * 7));
  return d.toISOString().split('T')[0];
}

// Helper function to format date for display
function formatDateRange(mondayDate) {
  const start = new Date(mondayDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

async function login(userType) {
  const user = TEST_USERS[userType];
  if (!user) {
    throw new Error(`Unknown user type: ${userType}`);
  }

  console.log(`\n🔐 Logging in as ${userType} (${user.email})...`);
  
  const result = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: user.email,
      password: user.password
    })
  });

  if (!result.success) {
    console.log(`❌ Login failed for ${userType}:`, result.data);
    throw new Error(`Login failed for ${userType}: ${JSON.stringify(result.data)}`);
  }

  const token = result.data.data?.accessToken || result.data.accessToken;
  if (!token) {
    throw new Error(`No access token received for ${userType}`);
  }

  console.log(`✅ Successfully logged in as ${userType}`);
  return {
    token,
    user: result.data.data?.user || result.data.user,
    employeeId: result.data.data?.user?.employeeId || result.data.user?.employeeId
  };
}

async function getTestData(auth) {
  console.log('\n📋 Getting test data (projects and tasks)...');
  
  const headers = { 'Authorization': `Bearer ${auth.token}` };

  // Get projects
  const projectsResult = await makeRequest('/projects', { method: 'GET', headers });
  if (!projectsResult.success) {
    throw new Error('Failed to get projects: ' + projectsResult.data.message);
  }
  const projects = projectsResult.data.data || [];

  // Get tasks  
  const tasksResult = await makeRequest('/tasks', { method: 'GET', headers });
  if (!tasksResult.success) {
    throw new Error('Failed to get tasks: ' + tasksResult.data.message);
  }
  const tasks = tasksResult.data.data || [];

  if (projects.length === 0 || tasks.length === 0) {
    throw new Error('No projects or tasks available for testing');
  }

  console.log(`✅ Found ${projects.length} projects and ${tasks.length} tasks`);
  return { projects, tasks };
}

async function testCreatePreviousWeekTimesheet(auth, testData, weeksAgo = 1) {
  console.log(`\n📅 Testing timesheet creation for ${weeksAgo} week(s) ago...`);
  
  const headers = { 'Authorization': `Bearer ${auth.token}` };
  const mondayDate = getMondayOfWeek(new Date(), weeksAgo);
  const dateRange = formatDateRange(mondayDate);
  
  console.log(`   Target week: ${dateRange} (${mondayDate})`);

  // Create timesheet payload
  const timesheetData = {
    projectId: testData.projects[0].id,
    taskId: testData.tasks[0].id,
    weekStartDate: mondayDate,
    mondayHours: 8,
    tuesdayHours: 8,
    wednesdayHours: 8,
    thursdayHours: 7,
    fridayHours: 6,
    saturdayHours: 0,
    sundayHours: 0,
    description: `Test timesheet for week starting ${mondayDate}`
  };

  console.log(`   Project: ${testData.projects[0].name}`);
  console.log(`   Task: ${testData.tasks[0].name}`);
  console.log(`   Total hours: ${Object.values(timesheetData).filter(v => typeof v === 'number').reduce((sum, h) => sum + h, 0)}`);

  const result = await makeRequest('/timesheets', {
    method: 'POST',
    headers,
    body: JSON.stringify(timesheetData)
  });

  if (result.success) {
    console.log(`✅ Successfully created timesheet for previous week`);
    console.log(`   Timesheet ID: ${result.data.data.id}`);
    console.log(`   Status: ${result.data.data.status}`);
    console.log(`   Total hours: ${result.data.data.totalHoursWorked}`);
    return result.data.data;
  } else {
    console.log(`❌ Failed to create timesheet:`, result.data.message);
    console.log(`   Details:`, result.data.details || result.data);
    return null;
  }
}

async function testSubmitPreviousWeekTimesheet(auth, timesheetId) {
  console.log(`\n📤 Testing submission of previous week timesheet (ID: ${timesheetId})...`);
  
  const headers = { 'Authorization': `Bearer ${auth.token}` };

  const result = await makeRequest(`/timesheets/${timesheetId}/submit`, {
    method: 'PUT',
    headers
  });

  if (result.success) {
    console.log(`✅ Successfully submitted timesheet for approval`);
    console.log(`   Message: ${result.data.message}`);
    return true;
  } else {
    console.log(`❌ Failed to submit timesheet:`, result.data.message);
    console.log(`   Details:`, result.data.details || result.data);
    return false;
  }
}

async function testHistoryDisplay(auth, expectedTimesheetId) {
  console.log(`\n📖 Testing history display for submitted previous week timesheet...`);
  
  const headers = { 'Authorization': `Bearer ${auth.token}` };

  // Get recent timesheets from history
  const result = await makeRequest('/timesheets?limit=10&sortBy=weekStartDate&sortOrder=DESC', {
    method: 'GET',
    headers
  });

  if (result.success) {
    const timesheets = result.data.data || [];
    console.log(`✅ Retrieved ${timesheets.length} timesheets from history`);
    
    // Find our submitted timesheet
    const targetTimesheet = timesheets.find(ts => ts.id === expectedTimesheetId);
    
    if (targetTimesheet) {
      console.log(`✅ Found submitted timesheet in history:`);
      console.log(`   ID: ${targetTimesheet.id}`);
      console.log(`   Status: ${targetTimesheet.status}`);
      console.log(`   Week: ${targetTimesheet.weekStartDate} (Year: ${targetTimesheet.year}, Week: ${targetTimesheet.weekNumber})`);
      console.log(`   Total hours: ${targetTimesheet.totalHoursWorked}`);
      console.log(`   Submitted at: ${targetTimesheet.submittedAt || 'Not submitted'}`);
      
      // Verify status is 'Submitted'
      if (targetTimesheet.status === 'Submitted') {
        console.log(`✅ Timesheet status correctly shows as 'Submitted'`);
      } else {
        console.log(`❌ Expected status 'Submitted', got '${targetTimesheet.status}'`);
      }
      
      return true;
    } else {
      console.log(`❌ Submitted timesheet not found in history`);
      console.log(`   Looking for ID: ${expectedTimesheetId}`);
      console.log(`   Available IDs: ${timesheets.map(ts => ts.id).join(', ')}`);
      return false;
    }
  } else {
    console.log(`❌ Failed to retrieve history:`, result.data.message);
    return false;
  }
}

async function testWeeklyView(auth, weeksAgo = 1) {
  console.log(`\n🗓️ Testing weekly view for ${weeksAgo} week(s) ago...`);
  
  const headers = { 'Authorization': `Bearer ${auth.token}` };
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - (weeksAgo * 7));
  const year = targetDate.getFullYear();
  const weekNumber = getISOWeekNumber(targetDate);

  const result = await makeRequest(`/timesheets?year=${year}&weekNumber=${weekNumber}`, {
    method: 'GET',
    headers
  });

  if (result.success) {
    const timesheets = result.data.data || [];
    console.log(`✅ Retrieved ${timesheets.length} timesheets for week ${weekNumber}, ${year}`);
    
    if (timesheets.length > 0) {
      timesheets.forEach(ts => {
        console.log(`   - ${ts.project?.name || 'Unknown Project'} / ${ts.task?.name || 'Unknown Task'}: ${ts.totalHoursWorked}h (${ts.status})`);
      });
    }
    
    return timesheets;
  } else {
    console.log(`❌ Failed to retrieve weekly view:`, result.data.message);
    return [];
  }
}

// Helper function for ISO week number calculation
function getISOWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

async function runPreviousWeekTests() {
  console.log('🚀 Starting Previous Week Timesheet Testing');
  console.log('=' .repeat(60));

  try {
    // Test with employee account (most common use case)
    console.log('\n👤 Testing Employee Previous Week Functionality...');
    
    // Try admin first, then fallback to employee
    let auth;
    try {
      auth = await login('admin');
    } catch (error) {
      console.log('⚠️  Admin login failed, trying employee...');
      try {
        auth = await login('employee');
      } catch (employeeError) {
        console.log('❌ Both admin and employee login failed');
        console.log('Available test users:');
        console.log('- admin@company.com / Kx9mP7qR2nF8sA5t');
        console.log('- employee@company.com / employee123');
        throw new Error('No valid login credentials available');
      }
    }

    // Get test data
    const testData = await getTestData(auth);

    // Test scenarios for different previous weeks
    const weekTestResults = [];
    
    for (let weeksAgo = 1; weeksAgo <= 3; weeksAgo++) {
      console.log(`\n📊 === Testing ${weeksAgo} Week(s) Ago ===`);
      
      try {
        // Create timesheet for previous week
        const timesheet = await testCreatePreviousWeekTimesheet(auth, testData, weeksAgo);
        
        if (timesheet) {
          // Submit the timesheet
          const submitted = await testSubmitPreviousWeekTimesheet(auth, timesheet.id);
          
          if (submitted) {
            // Verify it appears in history
            const inHistory = await testHistoryDisplay(auth, timesheet.id);
            
            weekTestResults.push({
              weeksAgo,
              created: true,
              submitted: true,
              inHistory,
              timesheetId: timesheet.id
            });
          } else {
            weekTestResults.push({
              weeksAgo,
              created: true,
              submitted: false,
              inHistory: false,
              timesheetId: timesheet.id
            });
          }
        } else {
          weekTestResults.push({
            weeksAgo,
            created: false,
            submitted: false,
            inHistory: false,
            timesheetId: null
          });
        }
      } catch (error) {
        console.log(`❌ Error testing ${weeksAgo} week(s) ago:`, error.message);
        weekTestResults.push({
          weeksAgo,
          created: false,
          submitted: false,
          inHistory: false,
          error: error.message
        });
      }
    }

    // Test weekly view functionality
    console.log(`\n📅 === Testing Weekly View Access ===`);
    for (let weeksAgo = 1; weeksAgo <= 2; weeksAgo++) {
      await testWeeklyView(auth, weeksAgo);
    }

    // Summary report
    console.log('\n' + '=' .repeat(60));
    console.log('📋 PREVIOUS WEEK TIMESHEET TEST SUMMARY');
    console.log('=' .repeat(60));
    
    weekTestResults.forEach(result => {
      console.log(`\n${result.weeksAgo} Week(s) Ago:`);
      console.log(`  Created: ${result.created ? '✅' : '❌'}`);
      console.log(`  Submitted: ${result.submitted ? '✅' : '❌'}`);
      console.log(`  In History: ${result.inHistory ? '✅' : '❌'}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      if (result.timesheetId) {
        console.log(`  Timesheet ID: ${result.timesheetId}`);
      }
    });

    // Overall assessment
    const successfulTests = weekTestResults.filter(r => r.created && r.submitted && r.inHistory).length;
    const totalTests = weekTestResults.length;
    
    console.log(`\n🎯 Overall Results: ${successfulTests}/${totalTests} weeks tested successfully`);
    
    if (successfulTests === totalTests) {
      console.log('🎉 All previous week timesheet functionality working correctly!');
    } else if (successfulTests > 0) {
      console.log('⚠️  Previous week functionality partially working - some issues detected');
    } else {
      console.log('❌ Previous week functionality has significant issues');
    }

    console.log('\n✅ Previous Week Timesheet Testing Completed');

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runPreviousWeekTests().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  runPreviousWeekTests,
  testCreatePreviousWeekTimesheet,
  testSubmitPreviousWeekTimesheet,
  testHistoryDisplay,
  testWeeklyView
};