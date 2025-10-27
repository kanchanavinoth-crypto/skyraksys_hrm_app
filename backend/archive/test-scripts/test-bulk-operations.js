const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test credentials - using existing employee user
const loginData = {
  email: 'employee@company.com',
  password: 'password123'
};

async function testBulkOperations() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.data.accessToken;
    const user = loginResponse.data.data.user;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Login successful');
    console.log('👤 User:', user.email);

    // Get employee profile to get employee ID
    const employeeId = user.employeeId;
    console.log('📋 Employee ID:', employeeId);

    // Get available projects and tasks
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, { headers });
    
    const projects = (projectsResponse.data.data || projectsResponse.data).filter(p => p.isActive);
    console.log(`📁 Found ${projects.length} active projects`);

    if (projects.length < 2) {
      console.log('❌ Need at least 2 projects to test bulk operations');
      return;
    }

    // Get tasks from the first two projects (they're included in the response)
    const project1 = projects[0];
    const project2 = projects[1];

    const availableTasks1 = project1.tasks.filter(t => t.status === 'In Progress');
    const availableTasks2 = project2.tasks.filter(t => t.status === 'In Progress');

    console.log(`📋 Project 1 (${project1.name}): ${availableTasks1.length} tasks`);
    console.log(`📋 Project 2 (${project2.name}): ${availableTasks2.length} tasks`);

    if (availableTasks1.length === 0 || availableTasks2.length === 0) {
      console.log('❌ Need active tasks in both projects');
      return;
    }

    // Test week: Feb 2-8, 2026 (Week 6) - future week should be empty
    const weekStartDate = '2026-02-02';
    const weekEndDate = '2026-02-08';
    const year = 2026;
    const weekNumber = 6;

    console.log(`\n📅 Testing bulk operations for week ${weekNumber} (${weekStartDate} to ${weekEndDate})`);

    // 1. Test BULK SAVE (Create multiple draft timesheets)
    console.log('\n1️⃣ Testing BULK SAVE (create multiple drafts)...');
    
    const bulkSaveData = [
      {
        employeeId,
        projectId: project1.id,
        taskId: availableTasks1[0].id,
        weekStartDate,
        weekEndDate,
        weekNumber,
        year,
        mondayHours: 8,
        tuesdayHours: 6,
        wednesdayHours: 7,
        thursdayHours: 8,
        fridayHours: 5,
        totalHoursWorked: 34,
        description: `Bulk save test - ${project1.name} - ${availableTasks1[0].name}`,
        status: 'Draft'
      },
      {
        employeeId,
        projectId: project2.id,
        taskId: availableTasks2[0].id,
        weekStartDate,
        weekEndDate,
        weekNumber,
        year,
        mondayHours: 4,
        tuesdayHours: 6,
        wednesdayHours: 5,
        thursdayHours: 4,
        fridayHours: 7,
        totalHoursWorked: 26,
        description: `Bulk save test - ${project2.name} - ${availableTasks2[0].name}`,
        status: 'Draft'
      }
    ];

    try {
      const bulkSaveResponse = await axios.post(`${BASE_URL}/timesheets/bulk-save`, 
        { timesheets: bulkSaveData }, 
        { headers }
      );
      console.log('✅ Bulk save successful');
      
      const processed = bulkSaveResponse.data.data?.processed || [];
      console.log(`📝 Created ${processed.length} timesheets`);
      
      const createdIds = processed.map(p => p.timesheetId);
      console.log('🆔 Created IDs:', createdIds);

      if (createdIds.length === 0) {
        console.log('❌ No timesheets were created, cannot continue with bulk operations test');
        return;
      }

      // 2. Test BULK UPDATE (modify the created timesheets)
      console.log('\n2️⃣ Testing BULK UPDATE...');
      
      const bulkUpdateData = createdIds.map((id, index) => ({
        id,
        totalHoursWorked: 40, // Update total hours
        description: `Updated bulk test ${index + 1} - Modified hours`,
        thursdayHours: 8 // Update Thursday hours
      }));

      const bulkUpdateResponse = await axios.put(`${BASE_URL}/timesheets/bulk-update`, 
        { timesheets: bulkUpdateData }, 
        { headers }
      );
      console.log('✅ Bulk update successful');
      console.log(`📝 Updated ${bulkUpdateResponse.data.data?.processed?.length || 0} timesheets`);

      // 3. Test BULK SUBMIT (submit all updated timesheets)
      console.log('\n3️⃣ Testing BULK SUBMIT...');
      
      const bulkSubmitResponse = await axios.post(`${BASE_URL}/timesheets/bulk-submit`, 
        { timesheetIds: createdIds }, 
        { headers }
      );
      console.log('✅ Bulk submit successful');
      console.log(`📝 Submitted ${bulkSubmitResponse.data.data?.processed?.length || 0} timesheets`);

      // 4. Verify final state
      console.log('\n4️⃣ Verifying final state...');
      
      for (const id of createdIds) {
        const timesheetResponse = await axios.get(`${BASE_URL}/timesheets/${id}`, { headers });
        const timesheet = timesheetResponse.data.data || timesheetResponse.data;
        console.log(`📋 Timesheet ${id}:`);
        console.log(`   Status: ${timesheet.status}`);
        console.log(`   Total Hours: ${timesheet.totalHoursWorked}`);
        console.log(`   Description: ${timesheet.description}`);
        console.log(`   Submitted At: ${timesheet.submittedAt || 'Not submitted'}`);
      }

      console.log('\n🎉 All bulk operations completed successfully!');

    } catch (error) {
      console.error('❌ Bulk operations error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testBulkOperations();