const db = require('./backend/models');

async function checkTimesheets() {
  try {
    const timesheets = await db.Timesheet.findAll({
      include: [{ model: db.Employee, as: 'employee' }],
      limit: 5
    });
    console.log('Found', timesheets.length, 'timesheets');
    timesheets.forEach(t => {
      console.log('- ID:', t.id, 'Employee:', t.employee?.firstName, 'Status:', t.status);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkTimesheets();