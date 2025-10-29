const { Timesheet } = require('./models');

async function checkTimesheets() {
  try {
    const timesheets = await Timesheet.findAll({
      attributes: ['id', 'employeeId', 'projectId', 'weekStartDate', 'weekEndDate', 'status'],
      order: [['weekStartDate', 'DESC']],
      limit: 15
    });
    
    console.log('\n=== Existing Timesheets (Most Recent) ===\n');
    timesheets.forEach((t, idx) => {
      console.log(`${idx + 1}. Week ${t.weekStartDate} to ${t.weekEndDate}`);
      console.log(`   Status: ${t.status}, EmployeeID: ${t.employeeId.substring(0, 8)}...`);
      console.log(`   ProjectID: ${t.projectId.substring(0, 8)}...`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTimesheets();
