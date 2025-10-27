const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test credentials
const loginData = {
  email: 'employee@company.com',
  password: 'password123'
};

async function testBulkSubmit() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Login successful');

    // Get existing draft timesheets
    const timesheetsResponse = await axios.get(`${BASE_URL}/timesheets`, { headers });
    const timesheets = timesheetsResponse.data.data || timesheetsResponse.data;
    const draftTimesheets = timesheets.filter(t => t.status === 'Draft');
    
    console.log(`📋 Found ${draftTimesheets.length} draft timesheets`);

    if (draftTimesheets.length === 0) {
      console.log('❌ No draft timesheets to test bulk submit');
      return;
    }

    // Use first 2 draft timesheets for testing
    const testTimesheets = draftTimesheets.slice(0, 2);
    const testIds = testTimesheets.map(t => t.id);
    
    console.log('🆔 Testing bulk submit with timesheet IDs:', testIds);

    // Show current state
    console.log('\n📋 Current state:');
    testTimesheets.forEach((t, index) => {
      console.log(`${index + 1}. ID: ${t.id}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Total Hours: ${t.totalHoursWorked}`);
      console.log(`   Description: ${t.description || 'No description'}`);
      console.log('');
    });

    // Test BULK SUBMIT
    console.log('🚀 Testing BULK SUBMIT...');
    
    const bulkSubmitResponse = await axios.post(`${BASE_URL}/timesheets/bulk-submit`, 
      { timesheetIds: testIds }, 
      { headers }
    );
    console.log('✅ Bulk submit successful');
    console.log('📋 Submit response:', JSON.stringify(bulkSubmitResponse.data, null, 2));

    // Verify final state
    console.log('\n📋 Final state after bulk submit:');
    
    for (const id of testIds) {
      const timesheetResponse = await axios.get(`${BASE_URL}/timesheets/${id}`, { headers });
      const timesheet = timesheetResponse.data.data || timesheetResponse.data;
      console.log(`📋 Timesheet ${id}:`);
      console.log(`   Status: ${timesheet.status}`);
      console.log(`   Total Hours: ${timesheet.totalHoursWorked}`);
      console.log(`   Description: ${timesheet.description}`);
      console.log(`   Submitted At: ${timesheet.submittedAt || 'Not submitted'}`);
      console.log('');
    }

    console.log('🎉 Bulk submit test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testBulkSubmit();