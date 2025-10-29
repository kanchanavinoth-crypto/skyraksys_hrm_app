const axios = require('axios');

async function createMinimalWorkingData() {
  try {
    console.log('🚀 Creating minimal working data for dashboard visibility...');
    
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
    console.log(`📊 Found ${employees.length} employees`);

    // ========================================
    // 1. TEST INDIVIDUAL ENDPOINTS
    // ========================================
    console.log('\n🔍 Testing individual endpoints...');

    // Test Projects endpoint
    try {
      const projectsGet = await axios.get('http://localhost:5000/api/projects', { headers });
      console.log(`✅ Projects GET: ${projectsGet.data.data?.length || 0} records`);
    } catch (error) {
      console.log(`❌ Projects GET failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Try creating a simple project
    try {
      const simpleProject = {
        name: 'Test Project',
        description: 'Simple test project'
      };
      const projectCreate = await axios.post('http://localhost:5000/api/projects', simpleProject, { headers });
      console.log(`✅ Project CREATE: Success`);
    } catch (error) {
      console.log(`❌ Project CREATE failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      if (error.response?.data?.errors) {
        console.log('   Validation errors:', error.response.data.errors);
      }
    }

    // Test Leave Types endpoint
    try {
      const leaveTypesGet = await axios.get('http://localhost:5000/api/leave-types', { headers });
      console.log(`✅ Leave Types GET: ${leaveTypesGet.data.data?.length || 0} records`);
    } catch (error) {
      console.log(`❌ Leave Types GET failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // ========================================
    // 2. CREATE TIMESHEET ENTRIES WITHOUT PROJECT
    // ========================================
    console.log('\n🕒 Creating Timesheet Entries (without project dependency)...');
    
    // Try creating timesheets with minimal data
    const timesheetData = [
      {
        employeeId: employees[0].id,
        workDate: '2025-09-05',
        hoursWorked: 8.0,
        description: 'Daily development work',
        status: 'Draft'
      },
      {
        employeeId: employees[0].id,
        workDate: '2025-09-04',
        hoursWorked: 7.5,
        description: 'Bug fixes and testing',
        status: 'Submitted'
      }
    ];

    if (employees.length > 1) {
      timesheetData.push({
        employeeId: employees[1].id,
        workDate: '2025-09-05',
        hoursWorked: 8.0,
        description: 'Documentation work',
        status: 'Approved'
      });
    }

    let timesheetSuccessCount = 0;
    for (const timesheet of timesheetData) {
      try {
        await axios.post('http://localhost:5000/api/timesheets', timesheet, { headers });
        timesheetSuccessCount++;
        console.log(`✅ Created timesheet for employee ${timesheet.employeeId} (${timesheet.status})`);
      } catch (error) {
        console.log(`❌ Timesheet creation failed: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.errors) {
          console.log('   Validation errors:', error.response.data.errors);
        }
      }
    }

    // ========================================
    // 3. CREATE LEAVE REQUESTS WITHOUT LEAVE TYPES
    // ========================================
    console.log('\n🏖️ Creating Leave Requests (with minimal data)...');
    
    const leaveData = [
      {
        employeeId: employees[0].id,
        startDate: '2025-09-15',
        endDate: '2025-09-17',
        totalDays: 3,
        reason: 'Family vacation',
        status: 'Pending'
      },
      {
        employeeId: employees.length > 1 ? employees[1].id : employees[0].id,
        startDate: '2025-09-20',
        endDate: '2025-09-20',
        totalDays: 1,
        reason: 'Medical appointment',
        status: 'Approved'
      }
    ];

    let leaveSuccessCount = 0;
    for (const leave of leaveData) {
      try {
        await axios.post('http://localhost:5000/api/leaves', leave, { headers });
        leaveSuccessCount++;
        console.log(`✅ Created leave request for employee ${leave.employeeId} (${leave.status})`);
      } catch (error) {
        console.log(`❌ Leave request creation failed: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.errors) {
          console.log('   Validation errors:', error.response.data.errors);
        }
      }
    }

    // ========================================
    // 4. VERIFY PAYROLL GENERATION WORKED
    // ========================================
    console.log('\n💰 Checking Payroll Data...');
    try {
      const payrollResponse = await axios.get('http://localhost:5000/api/payrolls', { headers });
      const payrolls = payrollResponse.data.data;
      console.log(`✅ Payroll records: ${payrolls.length}`);
      
      if (payrolls.length > 0) {
        console.log('   Sample payroll entry:');
        const sample = payrolls[0];
        console.log(`   - Employee ID: ${sample.employeeId}`);
        console.log(`   - Period: ${sample.payPeriodStart} to ${sample.payPeriodEnd}`);
        console.log(`   - Status: ${sample.status}`);
        console.log(`   - Net Salary: ${sample.netSalary}`);
      }
    } catch (error) {
      console.log(`❌ Payroll check failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // ========================================
    // 5. FINAL VERIFICATION
    // ========================================
    console.log('\n📊 Final Data Verification...');
    
    const endpoints = [
      { name: 'Timesheets', url: '/api/timesheets' },
      { name: 'Leave Requests', url: '/api/leaves' },
      { name: 'Payrolls', url: '/api/payrolls' }
    ];
    
    console.log('📋 Current Data Summary:');
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:5000${endpoint.url}`, { headers });
        const count = response.data.data?.length || 0;
        console.log(`   ✅ ${endpoint.name}: ${count} records`);
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: Error - ${error.response?.status || error.message}`);
      }
    }

    // ========================================
    // 6. TEST DASHBOARD
    // ========================================
    console.log('\n📊 Testing Dashboard Stats...');
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/stats', { headers });
      const stats = dashboardResponse.data.data.stats;
      
      console.log('🎯 Updated Dashboard Statistics:');
      console.log(`   👥 Employees: ${stats.employees.total} total, ${stats.employees.active} active`);
      console.log(`   🕒 Timesheets: ${stats.timesheets.pending} pending, ${stats.timesheets.submitted} submitted, ${stats.timesheets.approved} approved`);
      console.log(`   🏖️ Leaves: ${stats.leaves.pending} pending, ${stats.leaves.approved} approved`);
      console.log(`   💰 Payroll: ${stats.payroll.processed} processed, ${stats.payroll.pending} pending, ${stats.payroll.total} total`);
      
    } catch (error) {
      console.log(`❌ Dashboard stats error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 DATA CREATION COMPLETED!');
    console.log('');
    console.log('🌐 Access Your Dashboard:');
    console.log('   URL: http://localhost:3000');
    console.log('   Login: admin@company.com');
    console.log('   Password: Kx9mP7qR2nF8sA5t');
    console.log('');
    console.log('📱 Pages to Check:');
    console.log('   ✅ Main Dashboard: http://localhost:3000/dashboard');
    console.log('   ✅ Timesheet Management: http://localhost:3000/timesheet-management');
    console.log('   ✅ Leave Management: http://localhost:3000/leave-management');
    console.log('   ✅ Payroll Management: http://localhost:3000/payroll-management');
    console.log('');
    console.log(`📈 Results: Created ${timesheetSuccessCount} timesheets, ${leaveSuccessCount} leave requests`);

  } catch (error) {
    console.log('❌ Error creating data:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

createMinimalWorkingData();
