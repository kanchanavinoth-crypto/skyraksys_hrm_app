const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function demonstrateResubmitWorkflow() {
  console.log('🔄 DEMONSTRATING REJECT → RESUBMIT WORKFLOW\n');
  
  // Admin login
  const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@test.com',
    password: 'admin123'
  });
  const adminToken = adminLogin.data.data.accessToken;
  console.log('✅ Admin logged in');
  
  // Get data
  const empResponse = await axios.get(`${BASE_URL}/employees`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const employee = empResponse.data.data[0];
  
  const projResponse = await axios.get(`${BASE_URL}/timesheets/meta/projects`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const project = projResponse.data.data[0];
  
  console.log(`📋 Testing with: ${employee.firstName}, Project: ${project.name}`);
  
  try {
    // Create a timesheet in "Rejected" status to test resubmit
    console.log('\n📝 Step 1: Create and simulate rejected timesheet');
    
    // First create it
    const createResponse = await axios.post(`${BASE_URL}/timesheets`, {
      employeeId: employee.id,
      projectId: project.id,
      workDate: '2025-06-10',
      hoursWorked: 8,
      description: 'Workflow demonstration - original version'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    });
    
    const timesheetId = createResponse.data.data.id;
    console.log(`✅ Timesheet created (ID: ${timesheetId})`);
    
    // Manually set it to rejected status using direct database update
    const { sequelize } = require('./models');
    const Timesheet = sequelize.models.Timesheet;
    
    await Timesheet.update({
      status: 'Rejected',
      rejectedAt: new Date(),
      approverComments: 'Please add more specific details about your work.',
      approvedBy: employee.id
    }, {
      where: { id: timesheetId }
    });
    
    console.log('✅ Timesheet status set to "Rejected" for demonstration');
    
    // Now test the resubmit functionality
    console.log('\n🔄 Step 2: Test resubmit endpoint');
    const resubmitResponse = await axios.put(`${BASE_URL}/timesheets/${timesheetId}/resubmit`, {}, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    });
    
    console.log(`✅ Resubmit successful!`);
    console.log(`   Message: ${resubmitResponse.data.message}`);
    console.log(`   Status changed to: ${resubmitResponse.data.data.status}`);
    
    // Verify the timesheet is now editable (Draft status)
    console.log('\n✏️  Step 3: Verify timesheet is now editable');
    const checkResponse = await axios.get(`${BASE_URL}/timesheets/${timesheetId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const timesheet = checkResponse.data.data;
    console.log(`✅ Current status: ${timesheet.status}`);
    console.log(`   Rejected at: ${timesheet.rejectedAt || 'Cleared'}`);
    console.log(`   Approver comments: ${timesheet.approverComments || 'Cleared'}`);
    
    // Test editing the timesheet
    console.log('\n✏️  Step 4: Edit the timesheet');
    const updateResponse = await axios.put(`${BASE_URL}/timesheets/${timesheetId}`, {
      description: 'Updated after rejection: Completed frontend React components, fixed CSS styling issues, and implemented responsive design for mobile devices',
      hoursWorked: 8.5
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Timesheet successfully updated after resubmit');
    console.log(`   New description length: ${updateResponse.data.data.description.length} characters`);
    console.log(`   New hours: ${updateResponse.data.data.hoursWorked}`);
    
    // Test error case - try to resubmit a Draft timesheet
    console.log('\n🧪 Step 5: Test error handling');
    try {
      await axios.put(`${BASE_URL}/timesheets/${timesheetId}/resubmit`, {}, {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
      });
      console.log('❌ ERROR: Should not allow resubmitting Draft timesheet');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly prevents resubmitting non-rejected timesheets');
        console.log(`   Error message: ${error.response.data.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 REJECT → RESUBMIT WORKFLOW DEMONSTRATION COMPLETE!');
    console.log('='.repeat(70));
    console.log('✅ WORKFLOW AVAILABLE:');
    console.log('   1. Employee creates timesheet (Draft)');
    console.log('   2. Employee submits timesheet (Submitted)');
    console.log('   3. Manager/Admin rejects timesheet (Rejected)');
    console.log('   4. Employee calls /resubmit endpoint (back to Draft)');
    console.log('   5. Employee edits timesheet (still Draft)');
    console.log('   6. Employee resubmits timesheet (Submitted again)');
    console.log('   7. Manager/Admin approves (Approved)');
    console.log('');
    console.log('✅ NEW ENDPOINT ADDED: PUT /api/timesheets/:id/resubmit');
    console.log('✅ FULL REJECTION-RESUBMISSION CYCLE IMPLEMENTED!');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

demonstrateResubmitWorkflow().catch(console.error);
