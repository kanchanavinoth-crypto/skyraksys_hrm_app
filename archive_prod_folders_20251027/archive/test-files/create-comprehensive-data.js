const axios = require('axios');

async function createComprehensiveData() {
  try {
    console.log('🚀 Creating comprehensive test data for all modules...');
    
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

    if (employees.length === 0) {
      console.log('❌ No employees found. Please ensure employees are created first.');
      return;
    }

    // ========================================
    // 1. CREATE PROJECTS (Required for Timesheets)
    // ========================================
    console.log('\n📋 Creating Projects...');
    const projectsData = [
      {
        name: 'HRM System Development',
        description: 'Main HRM system development and enhancement project',
        status: 'active',
        startDate: '2025-09-01',
        endDate: '2025-12-31',
        managerId: employees[0]?.id
      },
      {
        name: 'HR Process Optimization',
        description: 'Optimizing HR processes and workflows',
        status: 'active',
        startDate: '2025-08-15',
        endDate: '2025-11-30',
        managerId: employees[1]?.id || employees[0]?.id
      },
      {
        name: 'Training & Documentation',
        description: 'Employee training and system documentation project',
        status: 'active',
        startDate: '2025-09-01',
        endDate: '2025-10-31',
        managerId: employees[2]?.id || employees[0]?.id
      }
    ];

    const createdProjects = [];
    for (const projectData of projectsData) {
      try {
        const response = await axios.post('http://localhost:5000/api/projects', projectData, { headers });
        createdProjects.push(response.data.data);
        console.log(`✅ Created project: ${projectData.name}`);
      } catch (error) {
        console.log(`⚠️  Project creation failed for ${projectData.name}: ${error.response?.data?.message || error.message}`);
        // Try to get existing projects as fallback
        try {
          const existingProjects = await axios.get('http://localhost:5000/api/projects', { headers });
          if (existingProjects.data.data && existingProjects.data.data.length > 0) {
            createdProjects.push(...existingProjects.data.data);
            console.log(`✅ Using existing projects: ${existingProjects.data.data.length}`);
            break;
          }
        } catch (e) {
          console.log('Could not fetch existing projects');
        }
      }
    }

    // ========================================
    // 2. CREATE LEAVE TYPES (Required for Leave Requests)
    // ========================================
    console.log('\n📝 Creating Leave Types...');
    const leaveTypesData = [
      {
        name: 'Annual Leave',
        description: 'Annual vacation leave',
        allocatedDays: 25,
        carryForwardLimit: 5
      },
      {
        name: 'Sick Leave',
        description: 'Medical and health-related leave',
        allocatedDays: 12,
        carryForwardLimit: 2
      },
      {
        name: 'Personal Leave',
        description: 'Personal time off',
        allocatedDays: 5,
        carryForwardLimit: 0
      },
      {
        name: 'Emergency Leave',
        description: 'Emergency situations requiring immediate leave',
        allocatedDays: 3,
        carryForwardLimit: 0
      }
    ];

    const createdLeaveTypes = [];
    for (const leaveTypeData of leaveTypesData) {
      try {
        const response = await axios.post('http://localhost:5000/api/leave-types', leaveTypeData, { headers });
        createdLeaveTypes.push(response.data.data);
        console.log(`✅ Created leave type: ${leaveTypeData.name}`);
      } catch (error) {
        console.log(`⚠️  Leave type might exist: ${leaveTypeData.name}`);
      }
    }

    // Get existing leave types if creation failed
    if (createdLeaveTypes.length === 0) {
      try {
        const existingLeaveTypes = await axios.get('http://localhost:5000/api/leave-types', { headers });
        if (existingLeaveTypes.data.data) {
          createdLeaveTypes.push(...existingLeaveTypes.data.data);
          console.log(`✅ Using existing leave types: ${createdLeaveTypes.length}`);
        }
      } catch (error) {
        console.log('Could not fetch existing leave types');
      }
    }

    // ========================================
    // 3. CREATE TIMESHEET ENTRIES
    // ========================================
    console.log('\n🕒 Creating Timesheet Entries...');
    if (createdProjects.length > 0) {
      const timesheetEntries = [];
      const today = new Date();
      
      // Create timesheets for each employee for the last 10 days
      employees.forEach((employee, empIndex) => {
        for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
          const workDate = new Date(today);
          workDate.setDate(workDate.getDate() - dayOffset);
          
          // Skip weekends
          if (workDate.getDay() === 0 || workDate.getDay() === 6) continue;
          
          const projectIndex = dayOffset % createdProjects.length;
          const statuses = ['Draft', 'Submitted', 'Approved'];
          const statusIndex = dayOffset % statuses.length;
          
          timesheetEntries.push({
            employeeId: employee.id,
            projectId: createdProjects[projectIndex].id,
            workDate: workDate.toISOString().split('T')[0],
            hoursWorked: 7.5 + (Math.random() * 1), // 7.5 to 8.5 hours
            description: `Development work on ${createdProjects[projectIndex].name} - Day ${dayOffset + 1}`,
            status: statuses[statusIndex],
            clockInTime: '09:00:00',
            clockOutTime: '17:30:00',
            breakHours: 0.5
          });
        }
      });

      console.log(`📊 Creating ${timesheetEntries.length} timesheet entries...`);
      let timesheetSuccessCount = 0;
      
      for (const timesheet of timesheetEntries) {
        try {
          await axios.post('http://localhost:5000/api/timesheets', timesheet, { headers });
          timesheetSuccessCount++;
        } catch (error) {
          console.log(`❌ Failed to create timesheet: ${error.response?.data?.message || error.message}`);
        }
      }
      
      console.log(`✅ Created ${timesheetSuccessCount} timesheet entries successfully`);
    } else {
      console.log('⚠️  Skipping timesheets - no projects available');
    }

    // ========================================
    // 4. CREATE LEAVE REQUESTS
    // ========================================
    console.log('\n🏖️ Creating Leave Requests...');
    if (createdLeaveTypes.length > 0) {
      const leaveRequests = [];
      
      employees.forEach((employee, empIndex) => {
        // Create 3-4 leave requests per employee
        for (let i = 0; i < 4; i++) {
          const startDate = new Date(today);
          startDate.setDate(startDate.getDate() + (i * 15) + (empIndex * 3)); // Spread out dates
          
          const endDate = new Date(startDate);
          const leaveDuration = [1, 2, 3, 5][i % 4]; // Different durations
          endDate.setDate(endDate.getDate() + leaveDuration - 1);
          
          const leaveTypeIndex = i % createdLeaveTypes.length;
          const statuses = ['Pending', 'Approved', 'Rejected', 'Pending'];
          const status = statuses[i];
          
          leaveRequests.push({
            employeeId: employee.id,
            leaveTypeId: createdLeaveTypes[leaveTypeIndex].id,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            totalDays: leaveDuration,
            reason: `${createdLeaveTypes[leaveTypeIndex].name} - ${['Family time', 'Medical appointment', 'Personal matters', 'Vacation'][i]}`,
            status: status,
            isHalfDay: leaveDuration === 1 && Math.random() > 0.5,
            halfDayType: leaveDuration === 1 ? (Math.random() > 0.5 ? 'First Half' : 'Second Half') : null
          });
        }
      });

      console.log(`📊 Creating ${leaveRequests.length} leave requests...`);
      let leaveSuccessCount = 0;
      
      for (const leave of leaveRequests) {
        try {
          await axios.post('http://localhost:5000/api/leaves', leave, { headers });
          leaveSuccessCount++;
        } catch (error) {
          console.log(`❌ Failed to create leave request: ${error.response?.data?.message || error.message}`);
        }
      }
      
      console.log(`✅ Created ${leaveSuccessCount} leave requests successfully`);
    } else {
      console.log('⚠️  Skipping leave requests - no leave types available');
    }

    // ========================================
    // 5. GENERATE PAYROLL ENTRIES
    // ========================================
    console.log('\n💰 Generating Payroll Entries...');
    
    // Generate payroll for current month and previous month
    const months = [
      { month: 8, year: 2025, name: 'August 2025' },
      { month: 9, year: 2025, name: 'September 2025' }
    ];
    
    for (const monthData of months) {
      try {
        const payrollGenData = {
          month: monthData.month,
          year: monthData.year,
          employeeIds: employees.map(emp => emp.id)
        };
        
        const response = await axios.post('http://localhost:5000/api/payrolls/generate', payrollGenData, { headers });
        console.log(`✅ Generated payroll for ${monthData.name}: ${employees.length} employees`);
      } catch (error) {
        console.log(`❌ Failed to generate payroll for ${monthData.name}: ${error.response?.data?.message || error.message}`);
      }
    }

    // ========================================
    // 6. VERIFY DATA CREATION
    // ========================================
    console.log('\n📊 Verifying Data Creation...');
    
    const verificationEndpoints = [
      { name: 'Employees', endpoint: '/api/employees' },
      { name: 'Projects', endpoint: '/api/projects' },
      { name: 'Leave Types', endpoint: '/api/leave-types' },
      { name: 'Timesheets', endpoint: '/api/timesheets' },
      { name: 'Leave Requests', endpoint: '/api/leaves' },
      { name: 'Payrolls', endpoint: '/api/payrolls' }
    ];
    
    console.log('📋 Final Data Summary:');
    for (const item of verificationEndpoints) {
      try {
        const response = await axios.get(`http://localhost:5000${item.endpoint}`, { headers });
        const count = response.data.data?.length || 0;
        console.log(`   ✅ ${item.name}: ${count} records`);
      } catch (error) {
        console.log(`   ❌ ${item.name}: Error - ${error.response?.status || error.message}`);
      }
    }

    // ========================================
    // 7. TEST DASHBOARD STATS
    // ========================================
    console.log('\n📊 Testing Dashboard Stats...');
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/stats', { headers });
      const stats = dashboardResponse.data.data.stats;
      
      console.log('🎯 Dashboard Statistics:');
      console.log(`   👥 Employees: ${stats.employees.total} total, ${stats.employees.active} active`);
      console.log(`   🕒 Timesheets: ${stats.timesheets.pending} pending, ${stats.timesheets.submitted} submitted, ${stats.timesheets.approved} approved`);
      console.log(`   🏖️ Leaves: ${stats.leaves.pending} pending, ${stats.leaves.approved} approved`);
      console.log(`   💰 Payroll: ${stats.payroll.processed} processed, ${stats.payroll.pending} pending`);
      
    } catch (error) {
      console.log(`❌ Dashboard stats error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 COMPREHENSIVE DATA CREATION COMPLETED!');
    console.log('');
    console.log('🌐 Frontend Access:');
    console.log('   URL: http://localhost:3000');
    console.log('   Login: admin@company.com');
    console.log('   Password: Kx9mP7qR2nF8sA5t');
    console.log('');
    console.log('📱 Available Pages with Data:');
    console.log('   ✅ Dashboard - Overview statistics');
    console.log('   ✅ Timesheet Management - Multiple timesheet entries');
    console.log('   ✅ Leave Management - Various leave requests');
    console.log('   ✅ Payroll Management - Generated payroll records');
    console.log('   ✅ Employee Management - Employee records');
    console.log('');
    console.log('🔗 Direct Page URLs:');
    console.log('   http://localhost:3000/dashboard');
    console.log('   http://localhost:3000/timesheet-management');
    console.log('   http://localhost:3000/leave-management');
    console.log('   http://localhost:3000/payroll-management');

  } catch (error) {
    console.log('❌ Error creating comprehensive data:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

createComprehensiveData();
