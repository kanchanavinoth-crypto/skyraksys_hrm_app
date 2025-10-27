const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test credentials
const loginData = {
  email: 'employee@company.com',
  password: 'password123'
};

async function checkTimesheetDetails() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Login successful');

    // Get detailed timesheet info
    const timesheetIds = [
      '09062fb2-621c-43bf-a20a-4d04ac6d5869',
      '563bc8fb-5ae3-4c29-9a84-be787df9381d'
    ];

    for (const id of timesheetIds) {
      const response = await axios.get(`${BASE_URL}/timesheets/${id}`, { headers });
      const timesheet = response.data.data || response.data;
      
      console.log(`\n📋 Timesheet ${id}:`);
      console.log(`   Status: ${timesheet.status}`);
      console.log(`   Total Hours: ${timesheet.totalHoursWorked}`);
      console.log(`   Monday: ${timesheet.mondayHours}`);
      console.log(`   Tuesday: ${timesheet.tuesdayHours}`);
      console.log(`   Wednesday: ${timesheet.wednesdayHours}`);
      console.log(`   Thursday: ${timesheet.thursdayHours}`);
      console.log(`   Friday: ${timesheet.fridayHours}`);
      console.log(`   Saturday: ${timesheet.saturdayHours}`);
      console.log(`   Sunday: ${timesheet.sundayHours}`);
      
      const calculatedTotal = (
        parseFloat(timesheet.mondayHours || 0) +
        parseFloat(timesheet.tuesdayHours || 0) +
        parseFloat(timesheet.wednesdayHours || 0) +
        parseFloat(timesheet.thursdayHours || 0) +
        parseFloat(timesheet.fridayHours || 0) +
        parseFloat(timesheet.saturdayHours || 0) +
        parseFloat(timesheet.sundayHours || 0)
      );
      
      console.log(`   Calculated Total: ${calculatedTotal}`);
      console.log(`   Match: ${Math.abs(calculatedTotal - parseFloat(timesheet.totalHoursWorked)) < 0.01 ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

checkTimesheetDetails();