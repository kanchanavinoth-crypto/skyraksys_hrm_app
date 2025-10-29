// Check timesheet ownership and test login
const { Timesheet, Employee, User } = require('./models');

async function checkTimesheetOwnership() {
  console.log('\n=== Checking Timesheet Ownership ===\n');

  try {
    // Get timesheets with employee and user details
    const timesheets = await Timesheet.findAll({
      include: [{
        model: Employee,
        as: 'employee',
        include: [{
          model: User,
          as: 'user'
        }]
      }],
      order: [['weekStartDate', 'DESC']],
      limit: 5 // Just show recent ones
    });

    console.log(`📅 Found ${timesheets.length} recent timesheets:`);
    
    timesheets.forEach((ts, index) => {
      console.log(`\n  ${index + 1}. Week: ${ts.weekStartDate} - Hours: ${ts.totalHoursWorked}`);
      if (ts.employee) {
        console.log(`     Employee: ${ts.employee.firstName} ${ts.employee.lastName}`);
        if (ts.employee.user) {
          console.log(`     User Email: ${ts.employee.user.email} (Role: ${ts.employee.user.role})`);
        } else {
          console.log(`     No user record found`);
        }
      } else {
        console.log(`     Employee ID: ${ts.employeeId} - NOT FOUND`);
      }
      console.log(`     Status: ${ts.status}`);
    });

    // Find a user we can test with
    const userWithTimesheets = timesheets.find(ts => ts.employee && ts.employee.user);
    if (userWithTimesheets) {
      console.log(`\n🎯 Test User Found:`);
      console.log(`   Email: ${userWithTimesheets.employee.user.email}`);
      console.log(`   Name: ${userWithTimesheets.employee.firstName} ${userWithTimesheets.employee.lastName}`);
      console.log(`   Role: ${userWithTimesheets.employee.user.role}`);
      console.log(`   Has ${timesheets.filter(ts => ts.employeeId === userWithTimesheets.employeeId).length} timesheets`);
    }

  } catch (error) {
    console.error('❌ Error checking timesheets:', error.message);
  }
}

checkTimesheetOwnership().then(() => {
  console.log('\n🎉 Timesheet ownership check completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});