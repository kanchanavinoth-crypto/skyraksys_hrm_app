// Test Weekly Timesheet Button Disabling
const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testWeeklyTimesheetStatus() {
  try {
    console.log('🔐 Step 1: Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'employee@company.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.accessToken;
      console.log('✅ Login successful');

      // Get timesheets to check statuses
      console.log('\n📅 Step 2: Getting timesheets...');
      const historyResponse = await axios.get(`${BASE_URL}/timesheets/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (historyResponse.data.success && historyResponse.data.data.length > 0) {
        console.log('\n📊 Timesheet Status Summary:');
        historyResponse.data.data.forEach((timesheet, index) => {
          console.log(`${index + 1}. Week: ${timesheet.weekStartDate} - Status: ${timesheet.status} - Hours: ${timesheet.totalHoursWorked}`);
        });

        // Group by week to simulate what the WeeklyTimesheet component does
        const weekGroups = {};
        historyResponse.data.data.forEach(timesheet => {
          const weekKey = timesheet.weekStartDate;
          if (!weekGroups[weekKey]) {
            weekGroups[weekKey] = [];
          }
          weekGroups[weekKey].push(timesheet);
        });

        console.log('\n🗓️ Week-level Status Analysis:');
        Object.keys(weekGroups).forEach(weekKey => {
          const timesheets = weekGroups[weekKey];
          const hasSubmitted = timesheets.some(t => t.status === 'Submitted');
          const allStatuses = [...new Set(timesheets.map(t => t.status))];
          
          console.log(`Week ${weekKey}:`);
          console.log(`  - Timesheets: ${timesheets.length}`);
          console.log(`  - Statuses: ${allStatuses.join(', ')}`);
          console.log(`  - Has Submitted: ${hasSubmitted ? '✅ YES (buttons should be disabled)' : '❌ NO (buttons should be enabled)'}`);
          console.log('');
        });

      } else {
        console.log('❌ No timesheets found');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

testWeeklyTimesheetStatus();