/**
 * Previous Week Timesheet Submission Diagnostic
 * 
 * This script diagnoses why previous week timesheets might not appear in history
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

const TEST_USER = {
  email: 'admin@company.com',
  password: 'Kx9mP7qR2nF8sA5t'
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url.startsWith('http') ? url : `${API_URL}${url}`);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
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
    if (options.body) req.write(options.body);
    req.end();
  });
}

function getMondayOfWeek(date, weeksAgo = 0) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff - (weeksAgo * 7));
  return d.toISOString().split('T')[0];
}

async function login() {
  console.log('🔐 Logging in...');
  const result = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });

  if (!result.success) {
    throw new Error(`Login failed: ${JSON.stringify(result.data)}`);
  }

  const token = result.data.data?.accessToken || result.data.accessToken;
  const user = result.data.data?.user || result.data.user;
  console.log(`✅ Login successful as ${user.email} (ID: ${user.id})`);
  return { token, user };
}

async function findAvailableTask(auth) {
  console.log('🔍 Finding available task...');
  const headers = { 'Authorization': `Bearer ${auth.token}` };

  const tasksResult = await makeRequest('/tasks', { method: 'GET', headers });
  if (!tasksResult.success) {
    throw new Error('Failed to get tasks');
  }

  const tasks = tasksResult.data.data || [];
  const availableTask = tasks.find(task => task.availableToAll === true);
  
  if (!availableTask) {
    throw new Error('No available tasks found');
  }

  console.log(`✅ Found task: "${availableTask.name}" (ID: ${availableTask.id})`);
  return availableTask;
}

async function diagnosticTest() {
  console.log('🩺 PREVIOUS WEEK TIMESHEET DIAGNOSTIC');
  console.log('=' .repeat(60));

  try {
    const auth = await login();
    const task = await findAvailableTask(auth);
    const headers = { 'Authorization': `Bearer ${auth.token}` };

    // Test with 3 weeks ago to avoid conflicts
    const weeksAgo = 3;
    const mondayDate = getMondayOfWeek(new Date(), weeksAgo);
    const weekDate = new Date(mondayDate);
    const year = weekDate.getFullYear();
    const weekNumber = getISOWeekNumber(weekDate);

    console.log(`\n📅 Testing week: ${mondayDate} (${weeksAgo} weeks ago)`);
    console.log(`   Year: ${year}, Week: ${weekNumber}`);

    // Step 1: Check current history BEFORE submission
    console.log('\n📋 STEP 1: Check existing history');
    const beforeHistory = await makeRequest('/timesheets?limit=20&sortBy=weekStartDate&sortOrder=DESC', {
      method: 'GET',
      headers
    });

    if (beforeHistory.success) {
      const existingTimesheets = beforeHistory.data.data || [];
      console.log(`   Found ${existingTimesheets.length} existing timesheets`);
      
      const targetWeekExists = existingTimesheets.some(ts => ts.weekStartDate === mondayDate);
      console.log(`   Timesheet for target week exists: ${targetWeekExists ? 'YES' : 'NO'}`);
      
      if (targetWeekExists) {
        const existing = existingTimesheets.find(ts => ts.weekStartDate === mondayDate);
        console.log(`   Existing status: ${existing.status}`);
        console.log(`   Existing ID: ${existing.id}`);
      }
    }

    // Step 2: Create timesheet (if not exists)
    console.log('\n📝 STEP 2: Create timesheet');
    const timesheetData = {
      projectId: task.projectId,
      taskId: task.id,
      weekStartDate: mondayDate,
      mondayHours: 8,
      tuesdayHours: 8,
      wednesdayHours: 6,
      thursdayHours: 7,
      fridayHours: 5,
      description: `Diagnostic test for ${mondayDate}`
    };

    const createResult = await makeRequest('/timesheets', {
      method: 'POST',
      headers,
      body: JSON.stringify(timesheetData)
    });

    let timesheetId;
    if (createResult.success) {
      timesheetId = createResult.data.data.id;
      console.log(`   ✅ Timesheet created (ID: ${timesheetId})`);
      console.log(`   Status: ${createResult.data.data.status}`);
      console.log(`   Total hours: ${createResult.data.data.totalHoursWorked}`);
    } else {
      console.log(`   ❌ Creation failed: ${createResult.data.message}`);
      
      // If timesheet already exists, try to find it
      if (createResult.data.message?.includes('already exists')) {
        console.log('   🔍 Looking for existing timesheet...');
        const existingResult = await makeRequest(`/timesheets?year=${year}&weekNumber=${weekNumber}`, {
          method: 'GET',
          headers
        });
        
        if (existingResult.success) {
          const existingTimesheets = existingResult.data.data || [];
          const existing = existingTimesheets.find(ts => 
            ts.weekStartDate === mondayDate && 
            ts.taskId === task.id
          );
          
          if (existing) {
            timesheetId = existing.id;
            console.log(`   ✅ Found existing timesheet (ID: ${timesheetId})`);
            console.log(`   Current status: ${existing.status}`);
          }
        }
      }
    }

    if (!timesheetId) {
      throw new Error('No timesheet ID available for testing');
    }

    // Step 3: Submit timesheet
    console.log('\n📤 STEP 3: Submit timesheet');
    const submitResult = await makeRequest(`/timesheets/${timesheetId}/submit`, {
      method: 'PUT',
      headers
    });

    if (submitResult.success) {
      console.log('   ✅ Timesheet submitted successfully');
    } else {
      console.log(`   ❌ Submission failed: ${submitResult.data.message}`);
      console.log(`   Details: ${JSON.stringify(submitResult.data)}`);
    }

    // Step 4: Verify immediate retrieval by ID
    console.log('\n🔍 STEP 4: Verify by direct ID lookup');
    const directResult = await makeRequest(`/timesheets/${timesheetId}`, {
      method: 'GET',
      headers
    });

    if (directResult.success) {
      const timesheet = directResult.data.data;
      console.log(`   ✅ Found timesheet by ID`);
      console.log(`   Status: ${timesheet.status}`);
      console.log(`   Week: ${timesheet.weekStartDate}`);
      console.log(`   Submitted at: ${timesheet.submittedAt || 'Not set'}`);
    } else {
      console.log(`   ❌ Could not find timesheet by ID: ${directResult.data.message}`);
    }

    // Step 5: Check history immediately after submission
    console.log('\n📖 STEP 5: Check history after submission');
    const afterHistory = await makeRequest('/timesheets?limit=20&sortBy=weekStartDate&sortOrder=DESC', {
      method: 'GET',
      headers
    });

    if (afterHistory.success) {
      const timesheets = afterHistory.data.data || [];
      console.log(`   Total timesheets in history: ${timesheets.length}`);
      
      const submittedTimesheet = timesheets.find(ts => ts.id === timesheetId);
      if (submittedTimesheet) {
        console.log(`   ✅ Found submitted timesheet in history`);
        console.log(`   Status: ${submittedTimesheet.status}`);
        console.log(`   Week: ${submittedTimesheet.weekStartDate}`);
        console.log(`   Position in list: ${timesheets.indexOf(submittedTimesheet) + 1}`);
      } else {
        console.log(`   ❌ Submitted timesheet NOT found in history`);
        console.log(`   Available timesheet IDs: ${timesheets.map(ts => ts.id).slice(0, 5).join(', ')}...`);
      }
    }

    // Step 6: Test specific week query
    console.log('\n🗓️ STEP 6: Test week-specific query');
    const weekQuery = await makeRequest(`/timesheets?year=${year}&weekNumber=${weekNumber}`, {
      method: 'GET',
      headers
    });

    if (weekQuery.success) {
      const weekTimesheets = weekQuery.data.data || [];
      console.log(`   Timesheets for week ${weekNumber}, ${year}: ${weekTimesheets.length}`);
      
      const targetTimesheet = weekTimesheets.find(ts => ts.id === timesheetId);
      if (targetTimesheet) {
        console.log(`   ✅ Found timesheet in week query`);
        console.log(`   Status: ${targetTimesheet.status}`);
      } else {
        console.log(`   ❌ Timesheet not found in week query`);
      }
    }

    // Step 7: Test status filtering
    console.log('\n🔍 STEP 7: Test status filtering');
    const statusTests = ['Draft', 'Submitted', 'Approved'];
    
    for (const status of statusTests) {
      const statusResult = await makeRequest(`/timesheets?status=${status}&limit=10`, {
        method: 'GET',
        headers
      });
      
      if (statusResult.success) {
        const statusTimesheets = statusResult.data.data || [];
        const hasOurTimesheet = statusTimesheets.some(ts => ts.id === timesheetId);
        console.log(`   ${status}: ${statusTimesheets.length} timesheets, includes ours: ${hasOurTimesheet ? 'YES' : 'NO'}`);
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Target timesheet ID: ${timesheetId}`);
    console.log(`Week: ${mondayDate} (${weeksAgo} weeks ago)`);
    console.log('Check your TimesheetHistory component filters and date ranges!');

  } catch (error) {
    console.error('💥 Diagnostic failed:', error.message);
  }
}

function getISOWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

if (require.main === module) {
  diagnosticTest().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}