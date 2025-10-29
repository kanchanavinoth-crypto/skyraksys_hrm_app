const axios = require('axios');

async function createLeaveBalancesCorrectly() {
  try {
    console.log('🚀 Creating leave balances with correct API structure...');
    
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
    // 1. CREATE LEAVE BALANCES CORRECTLY
    // ========================================
    console.log('\n💰 Creating Leave Balances with correct structure...');
    
    let balanceSuccessCount = 0;
    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        try {
          const leaveBalance = {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            year: 2025,
            totalAccrued: leaveType.maxDaysPerYear,
            carryForward: 0
          };
          
          const response = await axios.post('http://localhost:5000/api/admin/leave-balances', leaveBalance, { headers });
          balanceSuccessCount++;
          console.log(`✅ Created leave balance for ${employee.firstName} ${employee.lastName} - ${leaveType.name} (${leaveType.maxDaysPerYear} days)`);
        } catch (error) {
          console.log(`❌ Failed to create leave balance for ${employee.firstName} - ${leaveType.name}: ${error.response?.data?.message || error.message}`);
          if (error.response?.data?.errors) {
            console.log('   Validation errors:', error.response.data.errors);
          }
        }
      }
    }

    console.log(`📊 Successfully created ${balanceSuccessCount} leave balances`);

    // ========================================
    // 2. CREATE LEAVE REQUESTS
    // ========================================
    console.log('\n🏖️ Creating Leave Requests...');
    
    let leaveSuccessCount = 0;
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      
      // Create leave requests for each employee
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
      
      if (leaveTypes.length > 2) {
        leaveRequests.push({
          leaveTypeId: leaveTypes[2].id, // Sick Leave
          startDate: '2025-10-20',
          endDate: '2025-10-21',
          reason: 'Medical consultation'
        });
      }
      
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
          console.log(`❌ Leave request creation failed for ${employee.firstName}: ${error.response?.data?.message || error.message}`);
          if (error.response?.data?.errors) {
            console.log('   Validation errors:', error.response.data.errors);
          }
        }
      }
    }

    console.log(`📊 Successfully created ${leaveSuccessCount} leave requests`);

    // ========================================
    // 3. CREATE SALARY STRUCTURES
    // ========================================
    console.log('\n💼 Creating Salary Structures...');
    
    let salaryStructureCount = 0;
    
    // Create salary structures for each employee
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      
      try {
        const salaryStructure = {
          employeeId: employee.id,
          basicSalary: 5000.00 + (i * 1000), // Different salaries
          allowances: {
            transport: 300.00,
            meal: 200.00,
            communication: 100.00
          },
          deductions: {
            tax: (5000.00 + (i * 1000)) * 0.1, // 10% tax
            insurance: 150.00,
            pension: 250.00
          },
          effectiveDate: '2025-01-01'
        };
        
        await axios.post('http://localhost:5000/api/salary-structures', salaryStructure, { headers });
        salaryStructureCount++;
        console.log(`✅ Created salary structure for ${employee.firstName} ${employee.lastName} (Base: $${salaryStructure.basicSalary})`);
      } catch (error) {
        console.log(`❌ Failed to create salary structure for ${employee.firstName}: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.errors) {
          console.log('   Validation errors:', error.response.data.errors);
        }
      }
    }

    // ========================================
    // 4. CREATE PAYROLL ENTRIES
    // ========================================
    console.log('\n💰 Creating Payroll Entries...');
    
    let payrollCount = 0;
    const payrollPeriods = [
      { start: '2025-08-01', end: '2025-08-31', month: 'August' },
      { start: '2025-09-01', end: '2025-09-30', month: 'September' }
    ];

    for (const period of payrollPeriods) {
      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        const baseSalary = 5000.00 + (i * 1000);
        const allowances = 600.00;
        const deductions = baseSalary * 0.1 + 400.00;
        const netSalary = baseSalary + allowances - deductions;
        
        try {
          const payrollEntry = {
            employeeId: employee.id,
            payPeriodStart: period.start,
            payPeriodEnd: period.end,
            baseSalary: baseSalary,
            allowances: allowances,
            deductions: deductions,
            netSalary: netSalary,
            status: i % 2 === 0 ? 'processed' : 'pending'
          };
          
          // Try the generate endpoint first
          try {
            const generateResponse = await axios.post('http://localhost:5000/api/payrolls/generate', {
              month: new Date(period.start).getMonth() + 1,
              year: new Date(period.start).getFullYear(),
              employeeIds: [employee.id]
            }, { headers });
            
            if (generateResponse.data.data && generateResponse.data.data.length > 0) {
              payrollCount++;
              console.log(`✅ Generated payroll for ${employee.firstName} ${employee.lastName} - ${period.month} 2025`);
              continue;
            }
          } catch (generateError) {
            // Continue to direct creation
          }
          
          // Try direct creation
          const endpoints = ['/api/payrolls', '/api/payroll'];
          let created = false;
          
          for (const endpoint of endpoints) {
            try {
              await axios.post(`http://localhost:5000${endpoint}`, payrollEntry, { headers });
              payrollCount++;
              console.log(`✅ Created payroll for ${employee.firstName} ${employee.lastName} - ${period.month} 2025 (Net: $${netSalary.toFixed(2)})`);
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
          console.log(`❌ Payroll creation failed for ${employee.firstName}: ${error.response?.data?.message || error.message}`);
        }
      }
    }

    // ========================================
    // 5. FINAL VERIFICATION
    // ========================================
    console.log('\n📊 Final Enhanced System Verification...');
    
    const endpoints = [
      { name: 'Employees', url: '/api/employees' },
      { name: 'Projects', url: '/api/projects' },
      { name: 'Timesheets', url: '/api/timesheets' },
      { name: 'Leave Requests', url: '/api/leaves' },
      { name: 'Leave Balances', url: '/api/admin/leave-balances' },
      { name: 'Payrolls', url: '/api/payrolls' },
      { name: 'Salary Structures', url: '/api/salary-structures' }
    ];
    
    console.log('📋 Complete Enhanced Data Summary:');
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:5000${endpoint.url}`, { headers });
        const count = response.data.data?.length || 0;
        console.log(`   ✅ ${endpoint.name}: ${count} records`);
        
        // Show sample data for verification
        if (count > 0) {
          const sample = response.data.data[0];
          if (endpoint.name === 'Leave Balances') {
            console.log(`      Sample: Employee ${sample.employee?.firstName || 'Unknown'} - ${sample.leaveType?.name || 'Unknown'} (Balance: ${sample.balance || 0})`);
          } else if (endpoint.name === 'Leave Requests') {
            console.log(`      Sample: ${sample.startDate} to ${sample.endDate} - ${sample.reason?.substring(0, 30)}...`);
          }
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: Error - ${error.response?.status || 'Failed'}`);
      }
    }

    // ========================================
    // 6. DASHBOARD STATISTICS
    // ========================================
    console.log('\n📊 Final Enhanced Dashboard Statistics...');
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/stats', { headers });
      const stats = dashboardResponse.data.data.stats;
      
      console.log('🎯 COMPLETE Dashboard Statistics:');
      console.log(`   👥 Employees: ${stats.employees.total} total, ${stats.employees.active} active`);
      console.log(`   🕒 Timesheets: ${stats.timesheets.pending} pending, ${stats.timesheets.submitted} submitted, ${stats.timesheets.approved} approved`);
      console.log(`   🏖️ Leaves: ${stats.leaves.pending} pending, ${stats.leaves.approved} approved`);
      console.log(`   💰 Payroll: ${stats.payroll.processed} processed, ${stats.payroll.pending} pending, ${stats.payroll.total} total`);
      
    } catch (error) {
      console.log(`❌ Dashboard stats error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 COMPLETE HRM SYSTEM ENHANCEMENT FINISHED!');
    console.log('');
    console.log('🌐 Your Fully Enhanced HRM Dashboard:');
    console.log('   URL: http://localhost:3000');
    console.log('   Login: admin@company.com');
    console.log('   Password: Kx9mP7qR2nF8sA5t');
    console.log('');
    console.log('📱 All Enhanced Pages Available:');
    console.log('   ✅ Main Dashboard: Complete statistics and activities');
    console.log('   ✅ Employee Management: Comprehensive employee records');
    console.log('   ✅ Timesheet Management: Track and manage work hours');
    console.log('   ✅ Leave Management: Full leave request system');
    console.log('   ✅ Leave Balance Management: Employee leave balance tracking');
    console.log('   ✅ Payroll Management: Complete salary processing');
    console.log('   ✅ Project Management: Project tracking and assignment');
    console.log('');
    console.log(`📈 Complete Enhancement Summary:`);
    console.log(`   💰 Leave Balances: ${balanceSuccessCount} created`);
    console.log(`   🏖️ Leave Requests: ${leaveSuccessCount} created`);
    console.log(`   💼 Salary Structures: ${salaryStructureCount} created`);
    console.log(`   💰 Payroll Entries: ${payrollCount} created`);
    console.log('');
    console.log('✨ Your HRM system is now fully enhanced with comprehensive data!');

  } catch (error) {
    console.log('❌ Error enhancing system:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

createLeaveBalancesCorrectly();
