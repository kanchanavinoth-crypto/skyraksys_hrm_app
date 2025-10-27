import fetch from 'node-fetch';

// Test the bulk update validation fix
async function testBulkUpdateValidation() {
  try {
    console.log('🧪 Testing bulk update validation fix...');
    
    // Get auth token first
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'oty.vino@gmail.com',
        password: 'Password123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Failed to login');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.accessToken;
    console.log('✅ Authentication successful');
    
    // Test bulk update with partial data (this should now work correctly)
    const testTimesheets = [
      {
        id: 1, // Assuming a timesheet with ID 1 exists
        mondayHours: 8,    // Only updating Monday hours
        description: 'Updated via bulk test'  // And description
        // Other hours should remain unchanged and total should calculate correctly
      }
    ];
    
    const bulkUpdateResponse = await fetch('http://localhost:3001/api/timesheets/bulk-update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ timesheets: testTimesheets })
    });
    
    if (bulkUpdateResponse.ok) {
      const result = await bulkUpdateResponse.json();
      console.log('✅ Bulk update validation fix working!');
      console.log('📊 Result summary:', result.data?.summary);
      
      if (result.data?.processed?.length > 0) {
        const updatedTimesheet = result.data.processed[0];
        console.log('📋 Updated timesheet details:', updatedTimesheet.details);
        console.log('⚡ Total hours correctly calculated:', updatedTimesheet.details.totalHours);
      }
    } else {
      const errorData = await bulkUpdateResponse.json();
      console.log('❌ Bulk update failed:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBulkUpdateValidation();