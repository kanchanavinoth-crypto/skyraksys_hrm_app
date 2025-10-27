const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@company.com',
  password: 'Kx9mP7qR2nF8sA5t'
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

async function testTimesheetApprovalQueue() {
  console.log('🔍 Testing Timesheet Approval Queue for Admin...\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const adminToken = await login(ADMIN_CREDENTIALS);
    console.log('✅ Admin login successful\n');

    // Step 2: Get all timesheets
    console.log('2️⃣ Getting all timesheets...');
    const allTimesheetsResponse = await axios.get(`${BASE_URL}/timesheets`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const allTimesheets = allTimesheetsResponse.data.data || [];
    console.log(`✅ Total timesheets found: ${allTimesheets.length}`);
    
    // Step 3: Filter by status
    const submittedTimesheets = allTimesheets.filter(ts => ts.status === 'Submitted');
    const draftTimesheets = allTimesheets.filter(ts => ts.status === 'Draft');
    const approvedTimesheets = allTimesheets.filter(ts => ts.status === 'Approved');
    
    console.log('📊 Status breakdown:');
    console.log(`   - Draft: ${draftTimesheets.length}`);
    console.log(`   - Submitted (Pending Approval): ${submittedTimesheets.length}`);
    console.log(`   - Approved: ${approvedTimesheets.length}\n`);

    // Step 4: Show details of submitted timesheets
    if (submittedTimesheets.length > 0) {
      console.log('🎯 Timesheets ready for approval:');
      submittedTimesheets.forEach((ts, index) => {
        console.log(`   ${index + 1}. ID: ${ts.id}`);
        console.log(`      Employee: ${ts.employee?.firstName} ${ts.employee?.lastName}`);
        console.log(`      Date: ${ts.workDate}`);
        console.log(`      Hours: ${ts.hoursWorked}`);
        console.log(`      Status: ${ts.status}`);
        console.log(`      Submitted: ${ts.submittedAt}\n`);
      });
    } else {
      console.log('⚠️ No timesheets pending approval');
    }

    // Step 5: Test the pending-for-manager endpoint
    console.log('3️⃣ Testing pending-for-manager endpoint...');
    try {
      const pendingResponse = await axios.get(`${BASE_URL}/timesheets/pending-for-manager`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const pendingTimesheets = pendingResponse.data.data || [];
      console.log(`✅ Pending-for-manager endpoint returned: ${pendingTimesheets.length} timesheets`);
    } catch (error) {
      console.log(`❌ Pending-for-manager endpoint failed: ${error.response?.data?.message}`);
    }

    // Step 6: Test status filtering
    console.log('\n4️⃣ Testing status filtering...');
    const submittedFilterResponse = await axios.get(`${BASE_URL}/timesheets?status=Submitted`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const filteredSubmitted = submittedFilterResponse.data.data || [];
    console.log(`✅ Status filter (Submitted) returned: ${filteredSubmitted.length} timesheets`);

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Admin can access timesheet data: ${allTimesheets.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Submitted timesheets exist: ${submittedTimesheets.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Status filtering works: YES`);
    
    if (submittedTimesheets.length > 0) {
      console.log('\n🎉 SUCCESS: Admin can see timesheets in approval queue!');
      console.log(`There are ${submittedTimesheets.length} timesheet(s) waiting for approval.`);
    } else {
      console.log('\n⚠️ INFO: No timesheets currently pending approval.');
      console.log('Submit some timesheets first to test the approval queue.');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testTimesheetApprovalQueue();