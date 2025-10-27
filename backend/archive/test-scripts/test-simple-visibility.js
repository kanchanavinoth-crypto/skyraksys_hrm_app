// Simple Test Previous Week Visibility Fix
const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

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

    console.log('\n📅 All Timesheets with weekStartDate:');
    timesheets.forEach((ts, index) => {
      console.log(`\n  ${index + 1}. Timesheet ID: ${ts.id}`);
      console.log(`     Week Start Date: ${ts.weekStartDate}`);
      console.log(`     Status: ${ts.status}`);
      console.log(`     Created: ${new Date(ts.createdAt).toLocaleDateString()}`);
      console.log(`     Project: ${ts.project?.name || 'N/A'}`);
      console.log(`     Task: ${ts.task?.name || 'N/A'}`);
      console.log(`     Hours: ${ts.hoursWorked}`);
    });

    // Check for the specific previous week timesheet we created
    const targetWeekStart = '2025-01-06'; // Previous week Monday
    const previousWeekTimesheets = timesheets.filter(ts => 
      ts.weekStartDate && ts.weekStartDate.startsWith(targetWeekStart)
    );
    
    console.log(`\n🔍 Looking for timesheets with weekStartDate starting with ${targetWeekStart}:`);
    console.log(`   Found ${previousWeekTimesheets.length} timesheets for that week`);
    
    if (previousWeekTimesheets.length > 0) {
      console.log('✅ SUCCESS: Previous week timesheets are visible in API!');
      console.log('   Frontend TimesheetHistory component should now display them correctly.');
      
      previousWeekTimesheets.forEach(ts => {
        console.log(`     📝 ${ts.id} - Status: ${ts.status} - weekStartDate: ${ts.weekStartDate}`);
      });
    } else {
      console.log('❌ No previous week timesheets found');
      console.log('   Available weekStartDates:');
      timesheets.forEach(ts => console.log(`     - ${ts.weekStartDate}`));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPreviousWeekVisibility();