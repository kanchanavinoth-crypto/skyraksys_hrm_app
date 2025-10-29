const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const EMPLOYEE_CREDS = { email: 'employee@company.com', password: 'password123' };
const ADMIN_CREDS = { email: 'admin@company.com', password: 'password123' };

let employeeCookie = '';
let adminCookie = '';
let employeeId = null;

async function login(credentials) {
  const response = await axios.post(`${BASE_URL}/auth/login`, credentials, {
    withCredentials: true,
    validateStatus: () => true
  });
  
  if (response.status === 200 && response.headers['set-cookie']) {
    return response.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
  }
  return null;
}

async function testTimesheetManagement() {
  console.log('⏰ Testing Timesheet Management Workflow\n');
  
  employeeCookie = await login(EMPLOYEE_CREDS);
  adminCookie = await login(ADMIN_CREDS);
  
  if (!employeeCookie || !adminCookie) {
    console.log('❌ Failed to login');
    process.exit(1);
  }
  
  console.log('✅ Logged in as employee and admin\n');
  
  // Get employee ID
  try {
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { 'Cookie': employeeCookie }
    });
    const user = meResponse.data.user || meResponse.data.data || meResponse.data;
    employeeId = user.employee?.id || user.employeeId;
    console.log(`Employee ID: ${employeeId || 'N/A'}\n`);
  } catch (err) {
    console.log('Warning: Could not get employee ID\n');
  }
  
  // 1. GET all timesheets
  console.log('--- Test 1: GET all timesheets ---');
  try {
    const listResponse = await axios.get(`${BASE_URL}/timesheets`, {
      headers: { 'Cookie': employeeCookie },
      validateStatus: () => true
    });
    
    if (listResponse.status === 200) {
      const timesheets = listResponse.data.timesheets || listResponse.data.data || listResponse.data;
      console.log(`✅ Retrieved ${Array.isArray(timesheets) ? timesheets.length : 'N/A'} timesheets`);
      if (Array.isArray(timesheets) && timesheets.length > 0) {
        const sample = timesheets[0];
        console.log(`   Sample: ${sample.date || 'N/A'} - ${sample.hours || 'N/A'} hours - Status: ${sample.status || 'N/A'}`);
      }
    } else {
      console.log(`❌ Failed to get timesheets: ${listResponse.status}`);
      console.log(`   Message: ${listResponse.data.message || 'No message'}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // 2. GET projects (needed for timesheet creation)
  console.log('\n--- Test 2: GET projects ---');
  let projectId = null;
  let taskId = null;
  
  try {
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { 'Cookie': employeeCookie },
      validateStatus: () => true
    });
    
    if (projectsResponse.status === 200) {
      const projects = projectsResponse.data.projects || projectsResponse.data.data || projectsResponse.data;
      console.log(`✅ Retrieved ${Array.isArray(projects) ? projects.length : 'N/A'} projects`);
      if (Array.isArray(projects) && projects.length > 0) {
        projectId = projects[0].id;
        console.log(`   Using project: ${projects[0].name || 'N/A'}`);
        
        // Get tasks for this project
        const tasksResponse = await axios.get(`${BASE_URL}/tasks?projectId=${projectId}`, {
          headers: { 'Cookie': employeeCookie },
          validateStatus: () => true
        });
        
        if (tasksResponse.status === 200) {
          const tasks = tasksResponse.data.tasks || tasksResponse.data.data || tasksResponse.data;
          if (Array.isArray(tasks) && tasks.length > 0) {
            taskId = tasks[0].id;
            console.log(`   Using task: ${tasks[0].name || 'N/A'}`);
          }
        }
      }
    } else {
      console.log(`❌ Failed to get projects: ${projectsResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // 3. CREATE timesheet entry
  console.log('\n--- Test 3: CREATE new Draft timesheet ---');
  let createdTimesheetId = null;
  
  if (employeeId && projectId && taskId) {
    try {
      // Create a brand new timesheet for a week far in the past (September 2024)
      const mondayStr = '2024-09-02';
      const sundayStr = '2024-09-08';
      
      // Use OLD format (individual day hours) - matches what route actually expects
      const newTimesheet = {
        employeeId: employeeId,
        projectId: projectId,
        taskId: taskId,
        weekStartDate: mondayStr,
        weekEndDate: sundayStr,
        mondayHours: 7,
        tuesdayHours: 8,
        wednesdayHours: 8,
        thursdayHours: 8,
        fridayHours: 6,
        saturdayHours: 0,
        sundayHours: 0,
        description: 'Audit test timesheet - created for testing',
        status: 'Draft'
      };
      
      const createResponse = await axios.post(`${BASE_URL}/timesheets`, newTimesheet, {
        headers: { 'Cookie': employeeCookie },
        validateStatus: () => true
      });
      
      if (createResponse.status === 201 || createResponse.status === 200) {
        const created = createResponse.data.timesheet || createResponse.data.data || createResponse.data;
        createdTimesheetId = created.id;
        console.log(`✅ Created weekly timesheet`);
        console.log(`   ID: ${created.id}`);
        console.log(`   Week: ${mondayStr} to ${sundayStr}`);
        console.log(`   Total Hours: ${created.totalHoursWorked || 40}`);
        console.log(`   Status: ${created.status}`);
      } else {
        console.log(`❌ Failed to create timesheet: ${createResponse.status}`);
        console.log(`   Message: ${createResponse.data.message || 'No message'}`);
        if (createResponse.data.errors) {
          console.log(`   Errors:`, JSON.stringify(createResponse.data.errors, null, 2));
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message || 'No message'}`);
      }
    }
  } else {
    console.log(`⚠️  Skipped - missing employeeId (${employeeId}), projectId (${projectId}), or taskId (${taskId})`);
  }
  
  // 4. UPDATE timesheet entry
  if (createdTimesheetId) {
    console.log('\n--- Test 4: UPDATE timesheet entry ---');
    try {
      const updateData = {
        hours: 7.5,
        description: 'Updated audit test entry',
        status: 'Draft'
      };
      
      const updateResponse = await axios.put(`${BASE_URL}/timesheets/${createdTimesheetId}`, updateData, {
        headers: { 'Cookie': employeeCookie },
        validateStatus: () => true
      });
      
      if (updateResponse.status === 200) {
        const updated = updateResponse.data.timesheet || updateResponse.data.data || updateResponse.data;
        console.log(`✅ Updated timesheet entry`);
        console.log(`   Hours: ${updated.hours}`);
        console.log(`   Description: ${updated.description}`);
      } else {
        console.log(`❌ Failed to update timesheet: ${updateResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // 5. SUBMIT timesheet (change status to Submitted)
  if (createdTimesheetId) {
    console.log('\n--- Test 5: SUBMIT timesheet ---');
    try {
      const submitResponse = await axios.put(`${BASE_URL}/timesheets/${createdTimesheetId}/submit`, {}, {
        headers: { 'Cookie': employeeCookie },
        validateStatus: () => true
      });
      
      if (submitResponse.status === 200) {
        const submitted = submitResponse.data.timesheet || submitResponse.data.data || submitResponse.data;
        console.log(`✅ Timesheet submitted`);
        console.log(`   Status: ${submitted.status}`);
      } else {
        console.log(`❌ Failed to submit: ${submitResponse.status}`);
        console.log(`   Message: ${submitResponse.data.message || 'No message'}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // 6. APPROVE timesheet (admin/manager)
  if (createdTimesheetId) {
    console.log('\n--- Test 6: APPROVE timesheet (admin) ---');
    try {
      const approveResponse = await axios.put(`${BASE_URL}/timesheets/${createdTimesheetId}/approve`, {
        action: 'approve',
        comments: 'Approved for audit testing'
      }, {
        headers: { 'Cookie': adminCookie },
        validateStatus: () => true
      });
      
      if (approveResponse.status === 200) {
        const approved = approveResponse.data.timesheet || approveResponse.data.data || approveResponse.data;
        console.log(`✅ Timesheet approved`);
        console.log(`   Status: ${approved.status}`);
      } else {
        console.log(`❌ Failed to approve: ${approveResponse.status}`);
        console.log(`   Message: ${approveResponse.data.message || 'No message'}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // 7. GET pending timesheets (manager view)
  console.log('\n--- Test 7: GET pending timesheets (manager) ---');
  try {
    const pendingResponse = await axios.get(`${BASE_URL}/timesheets?status=Submitted`, {
      headers: { 'Cookie': adminCookie },
      validateStatus: () => true
    });
    
    if (pendingResponse.status === 200) {
      const pending = pendingResponse.data.timesheets || pendingResponse.data.data || pendingResponse.data;
      console.log(`✅ Retrieved ${Array.isArray(pending) ? pending.length : 'N/A'} pending timesheets`);
    } else {
      console.log(`❌ Failed to get pending: ${pendingResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // 8. DELETE timesheet (cleanup)
  if (createdTimesheetId) {
    console.log('\n--- Test 8: DELETE timesheet ---');
    try {
      const deleteResponse = await axios.delete(`${BASE_URL}/timesheets/${createdTimesheetId}`, {
        headers: { 'Cookie': adminCookie },
        validateStatus: () => true
      });
      
      if (deleteResponse.status === 200 || deleteResponse.status === 204) {
        console.log(`✅ Timesheet deleted successfully`);
      } else {
        console.log(`❌ Failed to delete: ${deleteResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Timesheet management testing completed\n');
}

testTimesheetManagement().catch(console.error);
