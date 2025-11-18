const db = require('./models');

async function checkTimesheets() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Get all employees
    const employees = await db.Employee.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email'],
      limit: 10
    });
    
    console.log('👥 Employees:');
    employees.forEach((emp) => {
      console.log(`  ${emp.firstName} ${emp.lastName} (${emp.email})`);
      console.log(`      ID: ${emp.id}`);
    });
    
    // Get timesheets with full details
    const timesheets = await db.Timesheet.findAll({
      include: [
        { model: db.Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: db.Project, as: 'project', attributes: ['id', 'name'] },
        { model: db.Task, as: 'task', attributes: ['id', 'name'] }
      ],
      order: [['weekStartDate', 'DESC']],
      limit: 10
    });
    
    console.log('\n📋 Total timesheets found:', timesheets.length);
    
    if (timesheets.length > 0) {
      console.log('\n📊 Sample timesheets:');
      timesheets.forEach((ts, i) => {
        console.log(`  ${i+1}. Week: ${ts.weekStartDate} to ${ts.weekEndDate}`);
        console.log(`     Employee: ${ts.employee?.firstName} ${ts.employee?.lastName} (${ts.employee?.email})`);
        console.log(`     Employee ID: ${ts.employeeId}`);
        console.log(`     Project: ${ts.project?.name}`);
        console.log(`     Task: ${ts.task?.name}`);
        console.log(`     Status: ${ts.status}`);
        console.log(`     Total Hours: ${ts.totalHoursWorked}`);
        console.log('');
      });
    }
    
    // Check for different statuses
    const statuses = await db.Timesheet.findAll({
      attributes: ['status', [db.sequelize.fn('COUNT', '*'), 'count']],
      group: ['status']
    });
    
    console.log('📈 Status distribution:');
    statuses.forEach(s => {
      console.log(`  ${s.status}: ${s.get('count')}`);
    });
    
    // Check current week specifically
    const now = new Date();
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekStartStr = weekStart.toISOString().split('T')[0];
    console.log('\n🗓️ Checking current week:', weekStartStr);
    
    const currentWeekTimesheets = await db.Timesheet.findAll({
      where: { weekStartDate: weekStartStr },
      include: [
        { model: db.Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });
    
    console.log('Current week timesheets:', currentWeekTimesheets.length);
    currentWeekTimesheets.forEach(ts => {
      console.log(`  - ${ts.employee?.firstName} ${ts.employee?.lastName}: ${ts.status} (${ts.totalHoursWorked}h)`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTimesheets();
