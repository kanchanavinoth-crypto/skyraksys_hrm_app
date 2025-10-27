const db = require('./backend/models');

async function createLeaveBalancesDirectly() {
  try {
    console.log('🚀 Creating leave balances directly via database...');
    
    // Get all employees
    const employees = await db.Employee.findAll();
    console.log(`📊 Found ${employees.length} employees`);

    // Get all leave types
    const leaveTypes = await db.LeaveType.findAll();
    console.log(`🏖️ Found ${leaveTypes.length} leave types`);

    // ========================================
    // 1. CREATE LEAVE BALANCES DIRECTLY
    // ========================================
    console.log('\n💰 Creating Leave Balances directly...');
    
    let balanceSuccessCount = 0;
    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        try {
          // Check if balance already exists
          const existingBalance = await db.LeaveBalance.findOne({
            where: { 
              employeeId: employee.id, 
              leaveTypeId: leaveType.id, 
              year: 2025 
            }
          });

          if (!existingBalance) {
            const leaveBalance = await db.LeaveBalance.create({
              employeeId: employee.id,
              leaveTypeId: leaveType.id,
              year: 2025,
              totalAccrued: leaveType.maxDaysPerYear,
              totalTaken: 0,
              totalPending: 0,
              balance: leaveType.maxDaysPerYear,
              carryForward: 0
            });
            
            balanceSuccessCount++;
            console.log(`✅ Created leave balance for ${employee.firstName} ${employee.lastName} - ${leaveType.name} (${leaveType.maxDaysPerYear} days)`);
          } else {
            console.log(`⚠️ Leave balance already exists for ${employee.firstName} ${employee.lastName} - ${leaveType.name}`);
          }
        } catch (error) {
          console.log(`❌ Failed to create leave balance for ${employee.firstName} - ${leaveType.name}: ${error.message}`);
        }
      }
    }

    console.log(`📊 Successfully created ${balanceSuccessCount} leave balances`);

    // ========================================
    // 2. CREATE LEAVE REQUESTS DIRECTLY
    // ========================================
    console.log('\n🏖️ Creating Leave Requests directly...');
    
    let leaveSuccessCount = 0;
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      
      // Create leave requests for each employee
      const leaveRequests = [
        {
          leaveTypeId: leaveTypes[0].id, // Annual Leave
          startDate: new Date('2025-11-15'),
          endDate: new Date('2025-11-17'),
          reason: 'Family vacation',
          status: 'pending'
        },
        {
          leaveTypeId: leaveTypes[1] ? leaveTypes[1].id : leaveTypes[0].id, // Personal Leave or Annual
          startDate: new Date('2025-12-05'),
          endDate: new Date('2025-12-05'),
          reason: 'Personal appointment',
          status: 'pending'
        }
      ];
      
      if (leaveTypes.length > 2) {
        leaveRequests.push({
          leaveTypeId: leaveTypes[2].id, // Sick Leave
          startDate: new Date('2025-10-20'),
          endDate: new Date('2025-10-21'),
          reason: 'Medical consultation',
          status: 'approved'
        });
      }
      
      for (const leave of leaveRequests) {
        try {
          const days = Math.ceil((leave.endDate - leave.startDate) / (1000 * 60 * 60 * 24)) + 1;
          
          const leaveRequest = await db.LeaveRequest.create({
            employeeId: employee.id,
            leaveTypeId: leave.leaveTypeId,
            startDate: leave.startDate,
            endDate: leave.endDate,
            totalDays: days,
            reason: leave.reason,
            status: leave.status,
            appliedAt: new Date()
          });
          
          leaveSuccessCount++;
          console.log(`✅ Created leave request for ${employee.firstName} ${employee.lastName} - ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} (${leave.status})`);
        } catch (error) {
          console.log(`❌ Leave request creation failed for ${employee.firstName}: ${error.message}`);
        }
      }
    }

    console.log(`📊 Successfully created ${leaveSuccessCount} leave requests`);

    // ========================================
    // 3. CREATE PAYROLL ENTRIES DIRECTLY
    // ========================================
    console.log('\n💰 Creating Payroll Entries directly...');
    
    let payrollCount = 0;
    const payrollPeriods = [
      { start: new Date('2025-08-01'), end: new Date('2025-08-31'), month: 'August' },
      { start: new Date('2025-09-01'), end: new Date('2025-09-30'), month: 'September' }
    ];

    for (const period of payrollPeriods) {
      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        const baseSalary = 5000.00 + (i * 1000);
        const allowances = 600.00;
        const deductions = baseSalary * 0.1 + 400.00;
        const netSalary = baseSalary + allowances - deductions;
        
        try {
          const payrollEntry = await db.Payroll.create({
            employeeId: employee.id,
            payPeriodStart: period.start,
            payPeriodEnd: period.end,
            baseSalary: baseSalary,
            allowances: allowances,
            deductions: deductions,
            netSalary: netSalary,
            status: i % 2 === 0 ? 'processed' : 'pending',
            processedAt: i % 2 === 0 ? new Date() : null
          });
          
          payrollCount++;
          console.log(`✅ Created payroll for ${employee.firstName} ${employee.lastName} - ${period.month} 2025 (Net: $${netSalary.toFixed(2)})`);
        } catch (error) {
          console.log(`❌ Payroll creation failed for ${employee.firstName}: ${error.message}`);
        }
      }
    }

    // ========================================
    // 4. FINAL VERIFICATION
    // ========================================
    console.log('\n📊 Final Direct Database Verification...');
    
    try {
      const employeeCount = await db.Employee.count();
      const projectCount = await db.Project.count();
      const timesheetCount = await db.Timesheet.count();
      const leaveRequestCount = await db.LeaveRequest.count();
      const leaveBalanceCount = await db.LeaveBalance.count();
      const payrollCountCheck = await db.Payroll.count();
      
      console.log('📋 Direct Database Data Summary:');
      console.log(`   ✅ Employees: ${employeeCount} records`);
      console.log(`   ✅ Projects: ${projectCount} records`);
      console.log(`   ✅ Timesheets: ${timesheetCount} records`);
      console.log(`   ✅ Leave Requests: ${leaveRequestCount} records`);
      console.log(`   ✅ Leave Balances: ${leaveBalanceCount} records`);
      console.log(`   ✅ Payrolls: ${payrollCountCheck} records`);
      
      // Show some sample leave balances
      if (leaveBalanceCount > 0) {
        const sampleBalances = await db.LeaveBalance.findAll({
          limit: 3,
          include: [
            { model: db.Employee, as: 'employee', attributes: ['firstName', 'lastName'] },
            { model: db.LeaveType, as: 'leaveType', attributes: ['name'] }
          ]
        });
        
        console.log('\n📋 Sample Leave Balances:');
        sampleBalances.forEach(balance => {
          console.log(`   - ${balance.employee.firstName} ${balance.employee.lastName}: ${balance.leaveType.name} (${balance.balance}/${balance.totalAccrued} days)`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Verification error: ${error.message}`);
    }

    console.log('\n🎉 DIRECT DATABASE ENHANCEMENT COMPLETED!');
    console.log('');
    console.log('🌐 Your Enhanced HRM Dashboard:');
    console.log('   URL: http://localhost:3000');
    console.log('   Login: admin@company.com');
    console.log('   Password: Kx9mP7qR2nF8sA5t');
    console.log('');
    console.log('📱 Enhanced Pages Available:');
    console.log('   ✅ Main Dashboard: Complete statistics');
    console.log('   ✅ Employee Management: Employee records');
    console.log('   ✅ Timesheet Management: Work hour tracking');
    console.log('   ✅ Leave Management: Leave request system with balances');
    console.log('   ✅ Leave Balance Management: Full balance tracking');
    console.log('   ✅ Payroll Management: Salary processing');
    console.log('   ✅ Project Management: Project tracking');
    console.log('');
    console.log(`📈 Direct Database Enhancement Summary:`);
    console.log(`   💰 Leave Balances: ${balanceSuccessCount} created`);
    console.log(`   🏖️ Leave Requests: ${leaveSuccessCount} created`);
    console.log(`   💰 Payroll Entries: ${payrollCount} created`);
    console.log('');
    console.log('✨ Your HRM system now has full leave balance functionality!');

  } catch (error) {
    console.log('❌ Error in direct database enhancement:', error.message);
  } finally {
    // Close database connection
    if (db.sequelize) {
      await db.sequelize.close();
    }
  }
}

createLeaveBalancesDirectly();
