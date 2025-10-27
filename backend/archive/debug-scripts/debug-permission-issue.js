const db = require('./backend/models');

(async () => {
  try {
    console.log('🔍 DEBUGGING PERMISSION ISSUE');
    console.log('================================');
    
    // Find the user trying to approve
    const user = await db.User.findByPk('82510468-5b39-4feb-ae1f-a5806f4ab79b', {
      include: [{ model: db.Employee, as: 'employee' }]
    });
    
    console.log('\n👤 USER DETAILS:');
    console.log('User ID:', user?.id);
    console.log('User Role:', user?.role);
    console.log('Employee ID:', user?.employee?.id);
    console.log('Employee Full Name:', user?.employee?.firstName, user?.employee?.lastName);
    
    // Find the timesheet being approved
    const timesheet = await db.Timesheet.findByPk('917116db-0845-4922-b94c-510dcb8eeeee', {
      include: [{ model: db.Employee, as: 'employee' }]
    });
    
    console.log('\n📄 TIMESHEET DETAILS:');
    console.log('Timesheet ID:', timesheet?.id);
    console.log('Employee ID:', timesheet?.employeeId);
    console.log('Employee Name:', timesheet?.employee?.firstName, timesheet?.employee?.lastName);
    console.log('Manager ID:', timesheet?.employee?.managerId);
    console.log('Status:', timesheet?.status);
    
    // Test the permission logic manually
    console.log('\n🔐 PERMISSION ANALYSIS:');
    if (!user || !timesheet) {
      console.log('❌ User or timesheet not found');
      process.exit(1);
    }
    
    console.log('1. Cannot approve own timesheet check:');
    console.log('   timesheet.employeeId === user.employee?.id:', timesheet.employeeId === user.employee?.id);
    
    console.log('2. Admin/HR check:');
    console.log('   user.role === admin/hr:', user.role === 'admin' || user.role === 'hr');
    
    console.log('3. Manager check:');
    console.log('   user.role === manager:', user.role === 'manager');
    console.log('   managerId === userEmployeeId:', timesheet.employee?.managerId === user.employee?.id);
    
    console.log('4. Status check:');
    console.log('   timesheet.status === Submitted:', timesheet.status === 'Submitted');
    
    // Call the actual permission method
    const canApprove = timesheet.canBeApprovedBy(
      user.role, 
      user.id, 
      user.employee?.id, 
      timesheet.employee?.managerId
    );
    
    console.log('\n✅ FINAL RESULT:');
    console.log('canBeApprovedBy() returns:', canApprove);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();