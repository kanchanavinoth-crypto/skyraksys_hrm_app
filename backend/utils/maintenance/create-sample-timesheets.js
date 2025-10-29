require('dotenv').config();
const db = require('./models');

const Timesheet = db.Timesheet;
const Employee = db.Employee;
const Project = db.Project;
const Task = db.Task;

async function createSampleTimesheets() {
  try {
    console.log('🔄 Creating sample weekly timesheets...');
    
    // Get first employee
    const employee = await Employee.findOne();
    if (!employee) {
      console.log('❌ No employees found');
      return;
    }
    
    // Get projects and tasks
    const projects = await Project.findAll({ limit: 2 });
    const tasks = await Task.findAll({ limit: 4 });
    
    if (projects.length === 0 || tasks.length === 0) {
      console.log('❌ No projects or tasks found');
      return;
    }
    
    console.log(`👤 Creating timesheets for: ${employee.firstName} ${employee.lastName}`);
    console.log(`📋 Projects: ${projects.map(p => p.name).join(', ')}`);
    console.log(`📝 Tasks: ${tasks.map(t => t.name).join(', ')}`);
    
    // Create timesheets for current week (Monday to Friday)
    const today = new Date();
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(today.getDate() - daysFromMonday);
    
    const timesheets = [];
    
    // Create 5 days of timesheets (Monday to Friday)
    for (let i = 0; i < 5; i++) {
      const workDate = new Date(monday);
      workDate.setDate(monday.getDate() + i);
      
      // Create 1-2 timesheets per day with different projects/tasks
      const timesheetsPerDay = Math.random() > 0.3 ? 2 : 1;
      
      for (let j = 0; j < timesheetsPerDay; j++) {
        const project = projects[j % projects.length];
        const task = tasks[(i * 2 + j) % tasks.length];
        const hours = Math.floor(Math.random() * 4) + 3; // 3-6 hours per task
        
        const timesheet = {
          employeeId: employee.id,
          projectId: project.id,
          taskId: task.id,
          workDate: workDate.toISOString().split('T')[0],
          hoursWorked: hours,
          description: `${project.name} - ${task.name} - Development and testing work for week of ${workDate.toLocaleDateString()}`,
          status: 'Draft',
          clockInTime: '09:00:00',
          clockOutTime: `${9 + hours}:00:00`,
          breakHours: hours > 5 ? 1 : 0.5
        };
        
        timesheets.push(timesheet);
      }
    }
    
    // Create timesheets in database
    const created = await Timesheet.bulkCreate(timesheets, {
      ignoreDuplicates: true // Skip if already exists due to unique constraint
    });
    
    console.log(`✅ Created ${created.length} sample timesheets`);
    
    // Show summary
    const summary = await Timesheet.findAll({
      where: { employeeId: employee.id },
      include: ['project', 'task'],
      order: [['workDate', 'ASC']]
    });
    
    console.log('\n📊 Weekly Timesheet Summary:');
    let totalHours = 0;
    const weekData = {};
    
    summary.forEach(timesheet => {
      const date = timesheet.workDate;
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      if (!weekData[date]) weekData[date] = { dayName, hours: 0, entries: 0 };
      weekData[date].hours += parseFloat(timesheet.hoursWorked);
      weekData[date].entries += 1;
      totalHours += parseFloat(timesheet.hoursWorked);
      
      console.log(`  ${dayName} ${date}: ${timesheet.hoursWorked}h - ${timesheet.project.name} / ${timesheet.task.name}`);
    });
    
    console.log(`\n⏱️  Total hours for the week: ${totalHours}h`);
    console.log(`📈 Average hours per day: ${(totalHours / Object.keys(weekData).length).toFixed(1)}h`);
    
    // Show status breakdown
    const statusCounts = await db.sequelize.query(
      `SELECT status, COUNT(*) as count FROM timesheets WHERE "employeeId" = ? GROUP BY status`,
      {
        replacements: [employee.id],
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    console.log('\n📋 Status Breakdown:');
    statusCounts.forEach(status => {
      console.log(`  ${status.status}: ${status.count} timesheets`);
    });
    
  } catch (error) {
    console.error('❌ Error creating sample timesheets:', error);
  } finally {
    process.exit();
  }
}

createSampleTimesheets();