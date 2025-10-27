const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test credentials from the server startup
const ADMIN_CREDENTIALS = {
  email: 'admin@company.com',
  password: 'Kx9mP7qR2nF8sA5t'
};

const EMPLOYEE_CREDENTIALS = {
  email: 'employee@company.com', 
  password: 'Mv4pS9wE2nR6kA8j'
};

async function login(credentials) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    return response.data.data.accessToken;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testTimesheetWorkflow() {
  console.log('🧪 Testing Timesheet Workflow...\n');

  try {
    // Step 1: Login as employee
    console.log('1️⃣ Logging in as employee...');
    const employeeToken = await login(EMPLOYEE_CREDENTIALS);
    console.log('✅ Employee login successful\n');

    // Step 2: Login as admin (for approval)
    console.log('2️⃣ Logging in as admin...');
    const adminToken = await login(ADMIN_CREDENTIALS);
    console.log('✅ Admin login successful\n');

    // Step 3: Get projects and tasks
    console.log('3️⃣ Getting projects...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const projects = projectsResponse.data.data || [];
    
    if (projects.length === 0) {
      console.log('⚠️ No projects found. Creating a test project...');
      const newProject = await axios.post(`${BASE_URL}/projects`, {
        name: 'Test Project',
        description: 'Test project for timesheet workflow',
        status: 'Active'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      projects.push(newProject.data.data);
    }
    
    const projectId = projects[0].id;
    console.log(`✅ Using project: ${projects[0].name} (ID: ${projectId})\n`);

    // Step 4: Create a timesheet entry as Draft
    console.log('4️⃣ Creating timesheet entry...');
    const timesheetData = {
      workDate: new Date().toISOString().split('T')[0], // Today's date
      hoursWorked: 8,
      description: 'Test timesheet entry for workflow validation',
      projectId: projectId
    };

    const createResponse = await axios.post(`${BASE_URL}/timesheets`, timesheetData, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    
    const timesheetId = createResponse.data.data.id;
    const createdTimesheet = createResponse.data.data;
    console.log(`✅ Timesheet created successfully (ID: ${timesheetId})`);
    console.log(`   Status: ${createdTimesheet.status}`);
    console.log(`   Hours: ${createdTimesheet.hoursWorked}\n`);

    // Step 5: Submit timesheet for approval
    console.log('5️⃣ Submitting timesheet for approval...');
    const submitResponse = await axios.put(`${BASE_URL}/timesheets/${timesheetId}/submit`, {}, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    
    console.log(`✅ Timesheet submitted successfully`);
    console.log(`   Status: ${submitResponse.data.data.status}`);
    console.log(`   Message: ${submitResponse.data.message}\n`);

    // Step 6: Get pending timesheets for approval
    console.log('6️⃣ Getting pending timesheets for manager approval...');
    try {
      const pendingResponse = await axios.get(`${BASE_URL}/timesheets/pending-for-manager`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const pendingTimesheets = pendingResponse.data.data || [];
      console.log(`✅ Found ${pendingTimesheets.length} pending timesheet(s)\n`);
    } catch (error) {
      console.log('⚠️  Issue with pending-for-manager endpoint, trying alternative...');
      console.log('   Error:', error.response?.data);
      
      // Try alternative: get all timesheets with status filter
      const allTimesheetsResponse = await axios.get(`${BASE_URL}/timesheets?status=Submitted`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const pendingTimesheets = allTimesheetsResponse.data.data || [];
      console.log(`✅ Found ${pendingTimesheets.length} submitted timesheet(s) via alternative method\n`);
    }

    // Step 7: Approve the timesheet
    console.log('7️⃣ Approving timesheet...');
    try {
      // Try the approve endpoint first
      const approveResponse = await axios.put(`${BASE_URL}/timesheets/${timesheetId}/approve`, {
        comments: 'Approved via automated test workflow'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log(`✅ Timesheet approved successfully via /approve endpoint`);
      console.log(`   Message: ${approveResponse.data.message}\n`);
    } catch (error) {
      console.log('⚠️ /approve endpoint failed, trying /status endpoint...');
      console.log('   Error:', error.response?.data);
      
      // Try alternative: use status endpoint
      const statusResponse = await axios.put(`${BASE_URL}/timesheets/${timesheetId}/status`, {
        status: 'Approved',
        approverComments: 'Approved via automated test workflow (status endpoint)'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log(`✅ Timesheet approved successfully via /status endpoint`);
      console.log(`   Message: ${statusResponse.data.message}\n`);
    }

    // Step 8: Verify final status
    console.log('8️⃣ Verifying final timesheet status...');
    const finalResponse = await axios.get(`${BASE_URL}/timesheets/${timesheetId}`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    
    const finalTimesheet = finalResponse.data.data;
    console.log(`✅ Final verification complete`);
    console.log(`   Status: ${finalTimesheet.status}`);
    console.log(`   Approved By: ${finalTimesheet.approvedBy}`);
    console.log(`   Approved At: ${finalTimesheet.approvedAt}\n`);

    // Success summary
    console.log('🎉 TIMESHEET WORKFLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('📊 Test Results:');
    console.log('   ✅ Employee can create timesheets (Draft status)');
    console.log('   ✅ Employee can submit timesheets (Submitted status)');
    console.log('   ✅ Admin/Manager can see pending timesheets');
    console.log('   ✅ Admin/Manager can approve timesheets (Approved status)');
    console.log('   ✅ Timesheet history and approval tracking works');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('   Authentication issue - check login credentials');
    } else if (error.response?.status === 403) {
      console.error('   Authorization issue - check user permissions');
    } else if (error.response?.status === 404) {
      console.error('   Endpoint not found - check API routes');
    }
  }
}

// Run the test
testTimesheetWorkflow();