// Test user creation and visibility
const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testUserAvailability() {
  console.log('\n=== Testing User Availability ===\n');

  try {
    // Try test user login first  
    console.log('🔑 Trying test user login...');
    const testResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@skyraksys.com',
      password: 'password123'
    });

    console.log('✅ Test user login successful');
    const testToken = testResponse.data.token;

    // Test timesheet access directly
    console.log('\n� Fetching timesheets...');
    const timesheetsResponse = await axios.get(`${BASE_URL}/timesheets`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });

    const timesheets = timesheetsResponse.data.timesheets || timesheetsResponse.data;
    console.log(`📊 Found ${timesheets.length} timesheets for test user`);

    if (timesheets.length > 0) {
      console.log('\n📅 Test User Timesheets:');
      timesheets.forEach((ts, index) => {
        console.log(`  ${index + 1}. Week: ${ts.weekStartDate} - Status: ${ts.status} - Hours: ${ts.totalHoursWorked}`);
      });
    } else {
      console.log('ℹ️  Test user has no timesheets. This is expected for new user.');
      console.log('   Frontend TimesheetHistory fix should now work correctly for users with timesheet data.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

testUserAvailability();