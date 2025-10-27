/**
 * Employee Previous Week Timesheet Test
 * 
 * Tests the complete flow for an employee submitting their own previous week timesheet
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

// Try different user credentials
const TEST_USERS = [
  {
    name: 'Employee',
    email: 'employee@test.com',
    password: 'admin123'
  },
  {
    name: 'Employee Company',
    email: 'employee@company.com',
    password: 'Mv4pS9wE2nR6kA8j'
  },
  {
    name: 'Admin',
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t'
  }
];

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

function getISOWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

async function tryLogin(userCredentials) {
  console.log(`🔐 Trying login: ${userCredentials.name} (${userCredentials.email})`);
  
  const result = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: userCredentials.email,
      password: userCredentials.password
    })
  });

  if (result.success) {
    const token = result.data.data?.accessToken || result.data.accessToken;
    const user = result.data.data?.user || result.data.user;
    console.log(`✅ Login successful as ${user.email} (Employee ID: ${user.employeeId})`);
    return { token, user, success: true };
  } else {
    console.log(`❌ Login failed: ${result.data.message}`);
    return { success: false, error: result.data.message };
  }
}

async function testEmployeeWorkflow() {
  console.log('👤 EMPLOYEE PREVIOUS WEEK TIMESHEET TEST');
  console.log('=' .repeat(60));

  let auth = null;

  // Try to find a working user account
  for (const userCreds of TEST_USERS) {
    try {
      const loginResult = await tryLogin(userCreds);
      if (loginResult.success) {
        auth = loginResult;
        break;
      }
    } catch (error) {
      console.log(`❌ Login error for ${userCreds.name}: ${error.message}`);
    }
  }

  if (!auth) {
    console.log('💥 No valid user credentials found. Available test users:');
    TEST_USERS.forEach(user => {
      console.log(`   - ${user.email} / ${user.password}`);
    });
    return;
  }

  const headers = { 'Authorization': `Bearer ${auth.token}` };

  try {
    // Find available task
    console.log('\n🔍 Finding available task...');
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

    // Test with 5 weeks ago to avoid existing data conflicts
    const weeksAgo = 5;
    const mondayDate = getMondayOfWeek(new Date(), weeksAgo);
    const year = new Date(mondayDate).getFullYear();
    const weekNumber = getISOWeekNumber(new Date(mondayDate));

    console.log(`\n📅 Testing week: ${mondayDate} (${weeksAgo} weeks ago)`);
    console.log(`   Year: ${year}, Week: ${weekNumber}`);

    // Create timesheet
    console.log('\n📝 Creating timesheet...');
    const timesheetData = {
      projectId: availableTask.projectId,
      taskId: availableTask.id,
      weekStartDate: mondayDate,
      mondayHours: 8,
      tuesdayHours: 8,
      wednesdayHours: 8,
      thursdayHours: 8,
      fridayHours: 4,
      description: `Employee test for ${mondayDate}`
    };

    const createResult = await makeRequest('/timesheets', {
      method: 'POST',
      headers,
      body: JSON.stringify(timesheetData)
    });

    let timesheetId;
    if (createResult.success) {
      timesheetId = createResult.data.data.id;
      console.log(`✅ Timesheet created (ID: ${timesheetId})`);
      console.log(`   Status: ${createResult.data.data.status}`);
    } else {
      console.log(`❌ Creation failed: ${createResult.data.message}`);
      
      // Check if it already exists
      if (createResult.data.message?.includes('already exists')) {
        console.log('🔍 Looking for existing timesheet...');
        const existingResult = await makeRequest(`/timesheets?year=${year}&weekNumber=${weekNumber}`, {
          method: 'GET',
          headers
        });
        
        if (existingResult.success) {
          const existing = existingResult.data.data?.find(ts => 
            ts.weekStartDate === mondayDate && ts.employeeId === auth.user.employeeId
          );
          
          if (existing) {
            timesheetId = existing.id;
            console.log(`✅ Found existing timesheet (ID: ${timesheetId}, Status: ${existing.status})`);
          }
        }
      }
    }

    if (!timesheetId) {
      throw new Error('No timesheet available for testing');
    }

    // Submit timesheet
    console.log('\n📤 Submitting timesheet...');
    const submitResult = await makeRequest(`/timesheets/${timesheetId}/submit`, {
      method: 'PUT',
      headers
    });

    if (submitResult.success) {
      console.log('✅ Timesheet submitted successfully');
      
      // Verify submission
      console.log('\n🔍 Verifying submission...');
      const verifyResult = await makeRequest(`/timesheets/${timesheetId}`, {
        method: 'GET',
        headers
      });

      if (verifyResult.success) {
        const timesheet = verifyResult.data.data;
        console.log(`✅ Verified timesheet status: ${timesheet.status}`);
        console.log(`   Submitted at: ${timesheet.submittedAt}`);
      }

      // Check history - ALL STATUS
      console.log('\n📖 Checking history (All Status)...');
      const historyAllResult = await makeRequest('/timesheets?limit=20&sortBy=weekStartDate&sortOrder=DESC', {
        method: 'GET',
        headers
      });

      if (historyAllResult.success) {
        const allTimesheets = historyAllResult.data.data || [];
        const ourTimesheet = allTimesheets.find(ts => ts.id === timesheetId);
        
        console.log(`   Total timesheets: ${allTimesheets.length}`);
        console.log(`   Our timesheet found: ${ourTimesheet ? 'YES' : 'NO'}`);
        
        if (ourTimesheet) {
          console.log(`   Status: ${ourTimesheet.status}`);
          console.log(`   Position: ${allTimesheets.indexOf(ourTimesheet) + 1}`);
        }
      }

      // Check history - SUBMITTED ONLY
      console.log('\n📖 Checking history (Submitted Status Only)...');
      const historySubmittedResult = await makeRequest('/timesheets?status=Submitted&limit=20&sortBy=weekStartDate&sortOrder=DESC', {
        method: 'GET',
        headers
      });

      if (historySubmittedResult.success) {
        const submittedTimesheets = historySubmittedResult.data.data || [];
        const ourSubmitted = submittedTimesheets.find(ts => ts.id === timesheetId);
        
        console.log(`   Submitted timesheets: ${submittedTimesheets.length}`);
        console.log(`   Our timesheet found: ${ourSubmitted ? 'YES' : 'NO'}`);
        
        if (ourSubmitted) {
          console.log(`   Position: ${submittedTimesheets.indexOf(ourSubmitted) + 1}`);
        }
      }

      // Check by date range
      console.log('\n📅 Checking by date range...');
      const weekResult = await makeRequest(`/timesheets?year=${year}&weekNumber=${weekNumber}`, {
        method: 'GET',
        headers
      });

      if (weekResult.success) {
        const weekTimesheets = weekResult.data.data || [];
        const ourWeekTimesheet = weekTimesheets.find(ts => ts.id === timesheetId);
        
        console.log(`   Week ${weekNumber}, ${year}: ${weekTimesheets.length} timesheets`);
        console.log(`   Our timesheet found: ${ourWeekTimesheet ? 'YES' : 'NO'}`);
      }

    } else {
      console.log(`❌ Submission failed: ${submitResult.data.message}`);
      console.log(`   Details: ${JSON.stringify(submitResult.data)}`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('📊 POTENTIAL ISSUES TO CHECK:');
    console.log('=' .repeat(60));
    console.log('1. TimesheetHistory component default filters:');
    console.log('   - Check if it defaults to showing all statuses');
    console.log('   - Check if date range filter is too restrictive');
    console.log('   - Check pagination (only showing first 10 items?)');
    console.log('');
    console.log('2. Frontend TimesheetHistory query parameters:');
    console.log('   - Verify it\'s not filtering by date range by default');
    console.log('   - Check if it\'s sorting correctly (newest first)');
    console.log('');
    console.log('3. User expectations:');
    console.log('   - Users might expect to see submitted timesheets automatically');
    console.log('   - Current default shows "All Status" which includes drafts');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

if (require.main === module) {
  testEmployeeWorkflow().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}