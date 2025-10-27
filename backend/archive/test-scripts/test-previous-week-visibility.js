// Test Previous Week Visibility Fix
const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isoWeek = require('dayjs/plugin/isoWeek');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

const BASE_URL = 'http://localhost:5000/api';

async function testPreviousWeekVisibility() {
  console.log('\n=== Testing Previous Week Timesheet Visibility ===\n');

  try {
    // Login as employee
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'employee@skyraksys.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Employee login successful');

    // Fetch timesheets to see if they appear in history
    console.log('\n📋 Fetching timesheet history...');
    const historyResponse = await axios.get(`${BASE_URL}/timesheets`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const timesheets = historyResponse.data.timesheets || historyResponse.data;
    console.log(`📊 Found ${timesheets.length} timesheets total`);

    // Group by week and show details
    const weekGroups = {};
    timesheets.forEach(timesheet => {
      const weekStart = dayjs(timesheet.weekStartDate);
      const weekKey = weekStart.format('YYYY-MM-DD');
      
      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = [];
      }
      weekGroups[weekKey].push(timesheet);
    });

    console.log('\n📅 Timesheets by Week:');
    Object.keys(weekGroups).sort().forEach(weekKey => {
      const weekStart = dayjs(weekKey);
      const weekEnd = weekStart.endOf('isoWeek');
      const timesheets = weekGroups[weekKey];
      
      console.log(`\n  Week ${weekStart.format('MMM DD')} - ${weekEnd.format('MMM DD, YYYY')} (${weekKey}):`);
      timesheets.forEach(ts => {
        console.log(`    📝 ${ts.id} - Status: ${ts.status} - Created: ${dayjs(ts.createdAt).format('MMM DD HH:mm')}`);
        console.log(`       Project: ${ts.project?.name} - Task: ${ts.task?.name}`);
        console.log(`       Hours: ${ts.hoursWorked} - Description: ${ts.description?.substring(0, 50)}...`);
      });
    });

    // Check specific previous week data
    const currentWeek = dayjs().startOf('isoWeek');
    const previousWeek = currentWeek.subtract(1, 'week');
    const previousWeekKey = previousWeek.format('YYYY-MM-DD');
    
    console.log(`\n🔍 Looking for previous week (${previousWeekKey}) specifically:`);
    const previousWeekTimesheets = weekGroups[previousWeekKey] || [];
    console.log(`   Found ${previousWeekTimesheets.length} timesheets for previous week`);
    
    if (previousWeekTimesheets.length > 0) {
      console.log('✅ SUCCESS: Previous week timesheets are visible in API!');
      console.log('   Frontend TimesheetHistory component should now display them correctly.');
    } else {
      console.log('❌ No previous week timesheets found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testPreviousWeekVisibility();