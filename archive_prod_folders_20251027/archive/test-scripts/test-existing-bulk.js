const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test credentials - using existing employee user
const loginData = {
  email: 'employee@company.com',
  password: 'password123'
};

async function testExistingTimesheets() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.data.accessToken;
    const user = loginResponse.data.data.user;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Login successful');
    console.log('👤 User:', user.email);

    // Get existing timesheets for the employee
    const timesheetsResponse = await axios.get(`${BASE_URL}/timesheets`, { headers });
    const timesheets = timesheetsResponse.data.data || timesheetsResponse.data;
    
    console.log(`📋 Found ${timesheets.length} existing timesheets`);

    // Find draft timesheets that we can test with
    const draftTimesheets = timesheets.filter(t => t.status === 'Draft');
    console.log(`📝 Found ${draftTimesheets.length} draft timesheets`);

    if (draftTimesheets.length < 2) {
      console.log('❌ Need at least 2 draft timesheets to test bulk operations');
      return;
    }

    // Use the first 2 draft timesheets for testing
    const testTimesheets = draftTimesheets.slice(0, 2);
    const testIds = testTimesheets.map(t => t.id);
    
    console.log('🆔 Testing with timesheet IDs:', testIds);

    // Show current state
    console.log('\n📋 Current state:');
    testTimesheets.forEach((t, index) => {
      console.log(`${index + 1}. ID: ${t.id}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Total Hours: ${t.totalHoursWorked}`);
      console.log(`   Description: ${t.description || 'No description'}`);
      console.log('');
    });

    // 1. Test BULK UPDATE (preserving existing hours, just updating description)
    console.log('1️⃣ Testing BULK UPDATE...');
    
    const bulkUpdateData = [
      {
        id: testIds[0],
        description: `Updated via bulk test 1 - ${new Date().toISOString()}`,
        totalHoursWorked: 34,
        mondayHours: 8,
        tuesdayHours: 6,
        wednesdayHours: 7,
        thursdayHours: 8,
        fridayHours: 5,
        saturdayHours: 0,
        sundayHours: 0
      },
      {
        id: testIds[1],
        description: `Updated via bulk test 2 - ${new Date().toISOString()}`,
        totalHoursWorked: 26,
        mondayHours: 4,
        tuesdayHours: 6,
        wednesdayHours: 5,
        thursdayHours: 4,
        fridayHours: 7,
        saturdayHours: 0,
        sundayHours: 0
      }
    ];

    const bulkUpdateResponse = await axios.put(`${BASE_URL}/timesheets/bulk-update`, 
      { timesheets: bulkUpdateData }, 
      { headers }
    );
    console.log('✅ Bulk update successful');
    console.log('📋 Update response:', JSON.stringify(bulkUpdateResponse.data, null, 2));

    // 2. Test BULK SUBMIT
    console.log('\n2️⃣ Testing BULK SUBMIT...');
    
    const bulkSubmitResponse = await axios.post(`${BASE_URL}/timesheets/bulk-submit`, 
      { timesheetIds: testIds }, 
      { headers }
    );
    console.log('✅ Bulk submit successful');
    console.log('📋 Submit response:', JSON.stringify(bulkSubmitResponse.data, null, 2));

    // 3. Verify final state
    console.log('\n3️⃣ Verifying final state...');
    
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

    console.log('🎉 Bulk operations test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testExistingTimesheets();