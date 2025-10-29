const axios = require('axios');

async function createLeaveBalancesAndRequests() {
  try {
    console.log('🚀 Creating leave balances and enhancing leave system...');
    
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

    // Get leave types
    const leaveTypesResponse = await axios.get('http://localhost:5000/api/leave/meta/types', { headers });
    const leaveTypes = leaveTypesResponse.data.data;
    console.log(`🏖️ Found ${leaveTypes.length} leave types`);

    // ========================================
    // 1. CREATE LEAVE BALANCES FOR ALL EMPLOYEES
    // ========================================
    console.log('\n💰 Creating Leave Balances...');
    
    let balanceSuccessCount = 0;
    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        try {
          const leaveBalance = {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            year: 2025,
            totalDays: leaveType.maxDaysPerYear,
            usedDays: Math.floor(Math.random() * 5), // Random used days (0-4)
            remainingDays: leaveType.maxDaysPerYear - Math.floor(Math.random() * 5)
          };
          
          const response = await axios.post('http://localhost:5000/api/admin/leave-balances', leaveBalance, { headers });
          balanceSuccessCount++;
          console.log(`✅ Created leave balance for employee ${employee.firstName} ${employee.lastName} - ${leaveType.name} (${leaveBalance.remainingDays}/${leaveBalance.totalDays} days)`);
        } catch (error) {
          console.log(`❌ Failed to create leave balance: ${error.response?.data?.message || error.message}`);
          if (error.response?.data?.errors) {
            console.log('   Validation errors:', error.response.data.errors);
          }
        }
      }
    }

    console.log(`📊 Created ${balanceSuccessCount} leave balances`);

    // ========================================
    // 2. CREATE LEAVE REQUESTS NOW THAT BALANCES EXIST
    // ========================================
    console.log('\n🏖️ Creating Leave Requests...');
    
    let leaveSuccessCount = 0;
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      
      // Create multiple leave requests for each employee
      const leaveRequests = [
        {
          leaveTypeId: leaveTypes[0].id, // Annual Leave
          startDate: '2025-11-15',
          endDate: '2025-11-17',
          reason: 'Family vacation'
        },
        {
          leaveTypeId: leaveTypes[1] ? leaveTypes[1].id : leaveTypes[0].id, // Personal Leave or Annual
          startDate: '2025-12-05',
          endDate: '2025-12-05',
          reason: 'Personal appointment'
        }
      ];
      
      for (const leave of leaveRequests) {
        try {
          const response = await axios.post('http://localhost:5000/api/leaves', {
            employeeId: employee.id,
            leaveTypeId: leave.leaveTypeId,
            startDate: leave.startDate,
            endDate: leave.endDate,
            reason: leave.reason
          }, { headers });
          
          leaveSuccessCount++;
          console.log(`✅ Created leave request for ${employee.firstName} ${employee.lastName} - ${leave.startDate} to ${leave.endDate}`);
        } catch (error) {
          console.log(`❌ Leave request creation failed: ${error.response?.data?.message || error.message}`);
          if (error.response?.data?.errors) {
            console.log('   Validation errors:', error.response.data.errors);
          }
        }
      }
    }

    console.log(`📊 Created ${leaveSuccessCount} leave requests`);

    // ========================================
    // 3. CREATE SALARY STRUCTURES FOR PAYROLL
    // ========================================
    console.log('\n💼 Creating Salary Structures...');
    
    const salaryStructures = [
      {
        name: 'Software Developer',
        baseSalary: 5000.00,
        allowances: {
          transport: 300.00,
          meal: 200.00,
          communication: 100.00
        },
        deductions: {
          tax: 500.00,
          insurance: 150.00,
          pension: 250.00
        }
      },
      {
        name: 'Senior Developer',
        baseSalary: 7000.00,
        allowances: {
          transport: 400.00,
          meal: 300.00,
          communication: 150.00
        },
        deductions: {
          tax: 700.00,
          insurance: 200.00,
          pension: 350.00
        }
      },
      {
        name: 'System Administrator',
        baseSalary: 4500.00,
        allowances: {
          transport: 250.00,
          meal: 200.00,
          communication: 100.00
        },
        deductions: {
          tax: 450.00,
          insurance: 135.00,
          pension: 225.00
        }
      }
    ];

    let salaryStructureCount = 0;
    for (const structure of salaryStructures) {
      try {
        await axios.post('http://localhost:5000/api/salary-structures', structure, { headers });
        salaryStructureCount++;
        console.log(`✅ Created salary structure: ${structure.name} (Base: $${structure.baseSalary})`);
      } catch (error) {
        console.log(`❌ Failed to create salary structure: ${error.response?.data?.message || error.message}`);
      }
    }

    // ========================================
    // 4. CREATE PAYROLL ENTRIES WITH SALARY STRUCTURES
    // ========================================
    console.log('\n💰 Creating Enhanced Payroll Entries...');
    
    let payrollCount = 0;
    const payrollPeriods = [
      { start: '2025-08-01', end: '2025-08-31', month: 'August' },
      { start: '2025-09-01', end: '2025-09-30', month: 'September' }
    ];

    for (const period of payrollPeriods) {
      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        const structure = salaryStructures[i % salaryStructures.length];
        
        const totalAllowances = Object.values(structure.allowances).reduce((sum, val) => sum + val, 0);
        const totalDeductions = Object.values(structure.deductions).reduce((sum, val) => sum + val, 0);
        const netSalary = structure.baseSalary + totalAllowances - totalDeductions;
        
        try {
          const payrollEntry = {
            employeeId: employee.id,
            payPeriodStart: period.start,
            payPeriodEnd: period.end,
            baseSalary: structure.baseSalary,
            allowances: totalAllowances,
            deductions: totalDeductions,
            netSalary: netSalary,
            status: i % 2 === 0 ? 'processed' : 'pending'
          };
          
          // Try multiple payroll endpoints
          const endpoints = ['/api/payrolls', '/api/payroll'];
          let created = false;
          
          for (const endpoint of endpoints) {
            try {
              await axios.post(`http://localhost:5000${endpoint}`, payrollEntry, { headers });
              payrollCount++;
              console.log(`✅ Created payroll for ${employee.firstName} ${employee.lastName} - ${period.month} 2025 (Net: $${netSalary})`);
              created = true;
              break;
            } catch (err) {
              // Try next endpoint
            }
          }
          
          if (!created) {
            console.log(`❌ Failed to create payroll for ${employee.firstName} ${employee.lastName} - ${period.month}`);
          }
          
        } catch (error) {
          console.log(`❌ Payroll creation failed: ${error.response?.data?.message || error.message}`);
        }
      }
    }

    // ========================================
    // 5. FINAL COMPREHENSIVE VERIFICATION
    // ========================================
    console.log('\n📊 Final System Verification...');
    
    const endpoints = [
      { name: 'Employees', url: '/api/employees' },
      { name: 'Projects', url: '/api/projects' },
      { name: 'Timesheets', url: '/api/timesheets' },
      { name: 'Leave Requests', url: '/api/leaves' },
      { name: 'Leave Balances', url: '/api/admin/leave-balances' },
      { name: 'Payrolls', url: '/api/payrolls' },
      { name: 'Salary Structures', url: '/api/salary-structures' }
    ];
    
    console.log('📋 Complete Data Summary:');
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:5000${endpoint.url}`, { headers });
        const count = response.data.data?.length || 0;
        console.log(`   ✅ ${endpoint.name}: ${count} records`);
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: Error - ${error.response?.status || 'Failed'}`);
      }
    }

    // ========================================
    // 6. DASHBOARD STATISTICS
    // ========================================
    console.log('\n📊 Updated Dashboard Statistics...');
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/stats', { headers });
      const stats = dashboardResponse.data.data.stats;
      
      console.log('🎯 ENHANCED Dashboard Statistics:');
      console.log(`   👥 Employees: ${stats.employees.total} total, ${stats.employees.active} active`);
      console.log(`   🕒 Timesheets: ${stats.timesheets.pending} pending, ${stats.timesheets.submitted} submitted, ${stats.timesheets.approved} approved`);
      console.log(`   🏖️ Leaves: ${stats.leaves.pending} pending, ${stats.leaves.approved} approved`);
      console.log(`   💰 Payroll: ${stats.payroll.processed} processed, ${stats.payroll.pending} pending, ${stats.payroll.total} total`);
      
    } catch (error) {
      console.log(`❌ Dashboard stats error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 ENHANCED HRM SYSTEM COMPLETED!');
    console.log('');
    console.log('🌐 Access Your Enhanced Dashboard:');
    console.log('   URL: http://localhost:3000');
    console.log('   Login: admin@company.com');
    console.log('   Password: Kx9mP7qR2nF8sA5t');
    console.log('');
    console.log('📱 Enhanced Pages Available:');
    console.log('   ✅ Main Dashboard: Complete statistics and activities');
    console.log('   ✅ Employee Management: Employee records and details');
    console.log('   ✅ Timesheet Management: Track and manage work hours');
    console.log('   ✅ Leave Management: Leave requests and approvals');
    console.log('   ✅ Leave Balance Management: Employee leave balances');
    console.log('   ✅ Payroll Management: Salary processing and records');
    console.log('   ✅ Project Management: Project tracking and assignment');
    console.log('');
    console.log(`📈 Enhancement Results:`);
    console.log(`   💰 Leave Balances: ${balanceSuccessCount} created`);
    console.log(`   🏖️ Leave Requests: ${leaveSuccessCount} created`);
    console.log(`   💼 Salary Structures: ${salaryStructureCount} created`);
    console.log(`   💰 Payroll Entries: ${payrollCount} created`);
    console.log('');
    console.log('✨ Your HRM system now has comprehensive data across all modules!');

  } catch (error) {
    console.log('❌ Error enhancing system:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

createLeaveBalancesAndRequests();
