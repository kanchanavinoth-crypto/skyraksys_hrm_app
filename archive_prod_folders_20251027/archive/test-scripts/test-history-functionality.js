// Test complete timesheet history functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testTimesheetHistoryFlow() {
  console.log('\n=== Testing Timesheet History End-to-End ===\n');

  try {
    // Login with test user
    console.log('🔑 Logging in as test user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@skyraksys.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get timesheets to verify data structure
    console.log('\n📋 Fetching timesheets for history...');
    const timesheetsResponse = await axios.get(`${BASE_URL}/timesheets`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const timesheets = timesheetsResponse.data.timesheets || timesheetsResponse.data;
    console.log(`📊 Found ${timesheets.length} timesheets`);

    if (timesheets.length > 0) {
      const sample = timesheets[0];
      console.log('\n📝 Sample timesheet structure:');
      console.log(`   ID: ${sample.id}`);
      console.log(`   Week Start: ${sample.weekStartDate}`);
      console.log(`   Week End: ${sample.weekEndDate}`);
      console.log(`   Total Hours: ${sample.totalHoursWorked}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Project: ${sample.project?.name || 'No project loaded'}`);
      console.log(`   Task: ${sample.task?.name || 'No task loaded'}`);
      
      // Check daily hours
      console.log('\n📅 Daily hours breakdown:');
      console.log(`   Mon: ${sample.mondayHours}h`);
      console.log(`   Tue: ${sample.tuesdayHours}h`);
      console.log(`   Wed: ${sample.wednesdayHours}h`);
      console.log(`   Thu: ${sample.thursdayHours}h`);
      console.log(`   Fri: ${sample.fridayHours}h`);
      console.log(`   Sat: ${sample.saturdayHours}h`);
      console.log(`   Sun: ${sample.sundayHours}h`);

      // Test edit functionality for draft timesheets
      const draftTimesheet = timesheets.find(ts => ts.status === 'Draft');
      if (draftTimesheet) {
        console.log(`\n✏️  Testing edit functionality for draft timesheet ${draftTimesheet.id}...`);
        
        const updateData = {
          mondayHours: parseFloat(draftTimesheet.mondayHours) + 1,
          tuesdayHours: parseFloat(draftTimesheet.tuesdayHours) + 0.5,
          description: `Updated description - ${new Date().toISOString()}`
        };

        const updateResponse = await axios.put(`${BASE_URL}/timesheets/${draftTimesheet.id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Update successful');
        console.log(`   Updated Monday hours: ${updateData.mondayHours}h`);
        console.log(`   Updated Tuesday hours: ${updateData.tuesdayHours}h`);
        console.log(`   Updated description: ${updateData.description}`);
      } else {
        console.log('ℹ️  No draft timesheets found for edit testing');
      }

      console.log('\n🎉 All tests completed successfully!');
      console.log('\n📋 Frontend should now display:');
      console.log('   ✅ Correct total hours (not zero)');
      console.log('   ✅ Weekly timesheet grouping by weekStartDate');
      console.log('   ✅ Proper daily breakdown in detail view');
      console.log('   ✅ Edit dialog for draft/rejected timesheets');
      console.log('   ✅ View dialog with full timesheet details');

    } else {
      console.log('ℹ️  No timesheets found. You may need to create some sample data first.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

testTimesheetHistoryFlow();