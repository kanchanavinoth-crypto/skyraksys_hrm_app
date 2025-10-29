// Test timesheet update validation
const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testTimesheetUpdate() {
  try {
    console.log('🔐 Step 1: Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'employee@company.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.accessToken;
      console.log('✅ Login successful');

      // Get first timesheet
      console.log('\n📅 Step 2: Getting timesheet...');
      const historyResponse = await axios.get(`${BASE_URL}/timesheets/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (historyResponse.data.success && historyResponse.data.data.length > 0) {
        // Find a Draft timesheet
        const draftTimesheet = historyResponse.data.data.find(t => t.status === 'Draft');
        
        if (!draftTimesheet) {
          console.log('❌ No Draft timesheets found to edit');
          return;
        }
        
        console.log(`Found Draft timesheet ID: ${draftTimesheet.id}`);
        console.log(`Current hours: Mon:${draftTimesheet.mondayHours}, Tue:${draftTimesheet.tuesdayHours}, etc.`);

        // Test update
        console.log('\n✏️ Step 3: Testing update...');
        const updateData = {
          mondayHours: 8.0,
          tuesdayHours: 8.0,
          wednesdayHours: 8.0,
          thursdayHours: 8.0,
          fridayHours: 8.0,
          saturdayHours: 0.0,
          sundayHours: 0.0,
          description: 'Updated via test'
        };

        console.log('Update data:', JSON.stringify(updateData, null, 2));

        const updateResponse = await axios.put(`${BASE_URL}/timesheets/${draftTimesheet.id}`, updateData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Update successful:', updateResponse.data);

      } else {
        console.log('❌ No timesheets found');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
  }
}

testTimesheetUpdate();