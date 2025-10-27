const axios = require('axios');

async function createSimpleLeaves() {
  try {
    console.log('🚀 Creating simple leave requests...');
    
    // Login to get admin access
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@company.com',
      password: 'Kx9mP7qR2nF8sA5t'
    });
    
    const token = loginResponse.data.data.accessToken;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Admin authenticated successfully');

    // Get existing employees
    const employeesResponse = await axios.get('http://localhost:5000/api/employees', { headers });
    const employees = employeesResponse.data.data;

    // Get leave types
    const leaveTypesResponse = await axios.get('http://localhost:5000/api/leave/meta/types', { headers });
    const leaveTypes = leaveTypesResponse.data.data;

    console.log(`📊 Found ${employees.length} employees and ${leaveTypes.length} leave types`);

    // ========================================
    // CREATE MINIMAL LEAVE REQUESTS
    // ========================================
    console.log('\n🏖️ Creating minimal leave requests...');
    
    let leaveSuccessCount = 0;
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const leaveType = leaveTypes[i % leaveTypes.length];
      
      try {
        const response = await axios.post('http://localhost:5000/api/leaves', {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          startDate: '2025-12-20',
          endDate: '2025-12-22',
          reason: 'Holiday vacation'
        }, { headers });
        
        leaveSuccessCount++;
        console.log(`✅ Created leave request for employee ${employee.id}`);
      } catch (error) {
        console.log(`❌ Leave request creation failed: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.errors) {
          console.log('   Validation errors:', error.response.data.errors);
        }
      }
    }

    console.log(`📊 Successfully created ${leaveSuccessCount} leave requests`);

    // Final verification
    console.log('\n📊 Final Verification...');
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/stats', { headers });
      const stats = dashboardResponse.data.data.stats;
      
      console.log('🎯 Dashboard Statistics:');
      console.log(`   👥 Employees: ${stats.employees.total} total, ${stats.employees.active} active`);
      console.log(`   🕒 Timesheets: ${stats.timesheets.pending} pending, ${stats.timesheets.submitted} submitted, ${stats.timesheets.approved} approved`);
      console.log(`   🏖️ Leaves: ${stats.leaves.pending} pending, ${stats.leaves.approved} approved`);
      console.log(`   💰 Payroll: ${stats.payroll.processed} processed, ${stats.payroll.pending} pending, ${stats.payroll.total} total`);
      
    } catch (error) {
      console.log(`❌ Dashboard stats error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 LEAVE CREATION COMPLETED!');
    console.log('\n🌐 Visit your dashboard at: http://localhost:3000');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

createSimpleLeaves();
