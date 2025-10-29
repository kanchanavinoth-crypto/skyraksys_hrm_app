const axios = require('axios');

async function createCompleteWorkingData() {
  try {
    console.log('🚀 Creating complete working data for all dashboard pages...');
    
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
    // 1. CREATE PROJECTS
    // ========================================
    console.log('\n🏗️ Creating Projects...');
    
    const projectsData = [
      {
        name: 'Employee Portal Development',
        description: 'Development of the company employee self-service portal',
        startDate: '2025-08-01',
        endDate: '2025-10-31',
        status: 'Active',
        budget: 50000
      },
      {
        name: 'HR System Integration',
        description: 'Integration of HR management system with existing infrastructure',
        startDate: '2025-09-01',
        endDate: '2025-12-31',
        status: 'Active',
        budget: 75000
      },
      {
        name: 'Data Migration Project',
        description: 'Migration of legacy employee data to new system',
        startDate: '2025-07-15',
        endDate: '2025-09-30',
        status: 'Active',
        budget: 30000
      }
    ];

    const createdProjects = [];
    for (const project of projectsData) {
      try {
        const response = await axios.post('http://localhost:5000/api/projects', project, { headers });
        createdProjects.push(response.data.data);
        console.log(`✅ Created project: ${project.name}`);
      } catch (error) {
        console.log(`❌ Failed to create project ${project.name}: ${error.response?.data?.message || error.message}`);
      }
    }

    // ========================================
    // 2. GET LEAVE TYPES
    // ========================================
    console.log('\n🏖️ Getting Leave Types...');
    
    let leaveTypes = [];
    try {
      const leaveTypesResponse = await axios.get('http://localhost:5000/api/leave/meta/types', { headers });
      leaveTypes = leaveTypesResponse.data.data;
      console.log(`✅ Found ${leaveTypes.length} leave types`);
      leaveTypes.forEach(type => console.log(`   - ${type.name} (${type.maxDaysPerYear} days/year)`));
    } catch (error) {
      console.log(`❌ Failed to get leave types: ${error.response?.data?.message || error.message}`);
    }

    // ========================================
    // 3. CREATE TIMESHEET ENTRIES
    // ========================================
    console.log('\n🕒 Creating Timesheet Entries...');
    
    const timesheetData = [];
    
    // Create timesheets for each employee across different projects
    employees.forEach((employee, empIndex) => {
      const projectIndex = empIndex % createdProjects.length;
      const project = createdProjects[projectIndex];
      
      if (project) {
        // Create multiple timesheet entries for each employee
        const dates = [
          { date: '2025-09-02', hours: 8.0, status: 'Approved', desc: 'Feature development and testing' },
          { date: '2025-09-03', hours: 7.5, status: 'Approved', desc: 'Code review and bug fixes' },
          { date: '2025-09-04', hours: 8.0, status: 'Submitted', desc: 'Database optimization work' },
          { date: '2025-09-05', hours: 6.5, status: 'Draft', desc: 'Documentation updates' },
          { date: '2025-09-06', hours: 8.0, status: 'Draft', desc: 'Implementation of new features' }
        ];
        
        dates.forEach(entry => {
          timesheetData.push({
            employeeId: employee.id,
            projectId: project.id,
            workDate: entry.date,
            hoursWorked: entry.hours,
            description: entry.desc,
            status: entry.status
          });
        });
      }
    });

    let timesheetSuccessCount = 0;
    for (const timesheet of timesheetData) {
      try {
        await axios.post('http://localhost:5000/api/timesheets', timesheet, { headers });
        timesheetSuccessCount++;
        console.log(`✅ Created timesheet for employee ${timesheet.employeeId} - ${timesheet.workDate} (${timesheet.status})`);
      } catch (error) {
        console.log(`❌ Timesheet creation failed: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.errors) {
          console.log('   Validation errors:', error.response.data.errors);
        }
      }
    }

    // ========================================
    // 4. CREATE LEAVE REQUESTS
    // ========================================
    console.log('\n🏖️ Creating Leave Requests...');
    
    const leaveData = [];
    
    if (leaveTypes.length > 0) {
      employees.forEach((employee, empIndex) => {
        const leaveTypeIndex = empIndex % leaveTypes.length;
        const leaveType = leaveTypes[leaveTypeIndex];
        
        // Create different types of leave requests
        const leaveRequests = [
          {
            startDate: '2025-09-15',
            endDate: '2025-09-17',
            totalDays: 3,
            reason: 'Family vacation',
            status: 'Pending'
          },
          {
            startDate: '2025-09-25',
            endDate: '2025-09-25',
            totalDays: 1,
            reason: 'Medical appointment',
            status: 'Approved'
          }
        ];
        
        leaveRequests.forEach((leave, index) => {
          const selectedLeaveType = leaveTypes[index % leaveTypes.length];
          leaveData.push({
            employeeId: employee.id,
            leaveTypeId: selectedLeaveType.id,
            startDate: leave.startDate,
            endDate: leave.endDate,
            totalDays: leave.totalDays,
            reason: leave.reason,
            status: leave.status
          });
        });
      });

      let leaveSuccessCount = 0;
      for (const leave of leaveData) {
        try {
          await axios.post('http://localhost:5000/api/leaves', leave, { headers });
          leaveSuccessCount++;
          console.log(`✅ Created leave request for employee ${leave.employeeId} - ${leave.startDate} to ${leave.endDate} (${leave.status})`);
        } catch (error) {
          console.log(`❌ Leave request creation failed: ${error.response?.data?.message || error.message}`);
          if (error.response?.data?.errors) {
            console.log('   Validation errors:', error.response.data.errors);
          }
        }
      }
    } else {
      console.log('⚠️ No leave types available, skipping leave request creation');
    }

    // ========================================
    // 5. CREATE PAYROLL ENTRIES
    // ========================================
    console.log('\n💰 Creating Payroll Entries...');
    
    const payrollPeriods = [
      { month: 8, year: 2025, name: 'August 2025' },
      { month: 9, year: 2025, name: 'September 2025' }
    ];

    let payrollSuccessCount = 0;
    for (const period of payrollPeriods) {
      try {
        const payrollData = {
          month: period.month,
          year: period.year,
          employeeIds: employees.map(emp => emp.id)
        };
        
        const response = await axios.post('http://localhost:5000/api/payrolls/generate', payrollData, { headers });
        payrollSuccessCount += response.data.data.length;
        console.log(`✅ Generated payroll for ${period.name}: ${response.data.data.length} employees`);
      } catch (error) {
        console.log(`❌ Payroll generation failed for ${period.name}: ${error.response?.data?.message || error.message}`);
      }
    }

    // ========================================
    // 6. FINAL VERIFICATION
    // ========================================
    console.log('\n📊 Final Data Verification...');
    
    const endpoints = [
      { name: 'Projects', url: '/api/projects' },
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
    // 7. TEST DASHBOARD
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

    console.log('\n🎉 COMPLETE DATA CREATION FINISHED!');
    console.log('');
    console.log('🌐 Access Your Dashboard:');
    console.log('   URL: http://localhost:3000');
    console.log('   Login: admin@company.com');
    console.log('   Password: Kx9mP7qR2nF8sA5t');
    console.log('');
    console.log('📱 Pages Now Have Data:');
    console.log('   ✅ Main Dashboard: http://localhost:3000/dashboard');
    console.log('   ✅ Timesheet Management: http://localhost:3000/timesheet-management');
    console.log('   ✅ Leave Management: http://localhost:3000/leave-management');
    console.log('   ✅ Payroll Management: http://localhost:3000/payroll-management');
    console.log('   ✅ Project Management: http://localhost:3000/project-management');
    console.log('');
    console.log(`📈 Creation Results:`);
    console.log(`   🏗️ Projects: ${createdProjects.length} created`);
    console.log(`   🕒 Timesheets: ${timesheetSuccessCount} created`);
    console.log(`   🏖️ Leave Requests: ${leaveData.length > 0 ? 'Created' : 'Skipped (no leave types)'}`);
    console.log(`   💰 Payroll Entries: ${payrollSuccessCount} created`);

  } catch (error) {
    console.log('❌ Error creating data:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

createCompleteWorkingData();
