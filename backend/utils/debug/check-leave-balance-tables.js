const db = require('./models');

async function checkLeaveBalanceTables() {
  try {
    console.log('Checking Leave Balance related tables...\n');

    // Test LeaveBalance model
    console.log('1. Checking LeaveBalance table...');
    const leaveBalanceCount = await db.LeaveBalance.count();
    console.log(`   ✓ LeaveBalance table exists with ${leaveBalanceCount} records\n`);

    // Test LeaveType model
    console.log('2. Checking LeaveType table...');
    const leaveTypeCount = await db.LeaveType.count();
    console.log(`   ✓ LeaveType table exists with ${leaveTypeCount} records`);
    
    const leaveTypes = await db.LeaveType.findAll();
    console.log('   Leave Types:');
    leaveTypes.forEach(lt => {
      console.log(`     - ${lt.name} (ID: ${lt.id})`);
    });
    console.log();

    // Test Employee model
    console.log('3. Checking Employee table...');
    const employeeCount = await db.Employee.count();
    console.log(`   ✓ Employee table exists with ${employeeCount} records`);
    
    const activeEmployees = await db.Employee.count({ where: { status: 'Active' } }); // Capital 'A'
    console.log(`   Active employees: ${activeEmployees}\n`);

    // Test associations
    console.log('4. Testing associations...');
    const sampleBalance = await db.LeaveBalance.findOne({
      include: [
        { model: db.Employee, as: 'employee' },
        { model: db.LeaveType, as: 'leaveType' }
      ]
    });
    
    if (sampleBalance) {
      console.log('   ✓ Associations working correctly');
      console.log(`   Sample: ${sampleBalance.employee?.firstName} - ${sampleBalance.leaveType?.name}`);
    } else {
      console.log('   ⚠ No leave balance records found to test associations');
    }

    console.log('\n✅ All checks passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

checkLeaveBalanceTables();
