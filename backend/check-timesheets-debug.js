const db = require('./models');

async function checkTimesheets() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected');
    
    const timesheets = await db.Timesheet.findAll({
      include: [
        { model: db.Employee, as: 'employee', attributes: ['firstName', 'lastName'] },
        { model: db.Project, as: 'project', attributes: ['name'] },
        { model: db.Task, as: 'task', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log('Total timesheets found:', timesheets.length);
    
    timesheets.forEach((ts, i) => {
      console.log(`${i+1}. ID: ${ts.id}`);
      console.log(`   Employee: ${ts.employee?.firstName} ${ts.employee?.lastName}`);
      console.log(`   Work Date: ${ts.workDate}`);
      console.log(`   Hours: ${ts.hoursWorked}`);
      console.log(`   Status: ${ts.status}`);
      console.log(`   Project: ${ts.project?.name || 'No project'}`);
      console.log(`   Task: ${ts.task?.name || 'No task'}`);
      console.log(`   Description: ${ts.description}`);
      console.log('   ---');
    });
    
    // Check status distribution
    const statusCounts = await db.Timesheet.findAll({
      attributes: ['status', [db.sequelize.fn('COUNT', '*'), 'count']],
      group: ['status'],
      raw: true
    });
    
    console.log('\nStatus Distribution:');
    statusCounts.forEach(sc => {
      console.log(`${sc.status}: ${sc.count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkTimesheets();