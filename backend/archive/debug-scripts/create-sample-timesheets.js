require('dotenv').config();
const db = require('./backend/models');

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
      
      // Create 1-2 timesheets per day
      const timesheetsPerDay = Math.random() > 0.5 ? 2 : 1;
      
      for (let j = 0; j < timesheetsPerDay; j++) {
        const project = projects[j % projects.length];
        const task = tasks[(i * 2 + j) % tasks.length];
        const hours = Math.floor(Math.random() * 6) + 2; // 2-8 hours
        
        const timesheet = {
          employeeId: employee.id,
          projectId: project.id,
          taskId: task.id,
          workDate: workDate.toISOString().split('T')[0],
          hoursWorked: hours,
          description: `${project.name} - ${task.name} - Development work`,
          status: 'Draft',
          clockInTime: '09:00:00',
          clockOutTime: `${9 + hours}:00:00`,
          breakHours: hours > 6 ? 1 : 0.5
        };
        
        timesheets.push(timesheet);
      }
    }
    
    // Create timesheets in database
    const created = await Timesheet.bulkCreate(timesheets, {
      ignoreDuplicates: true // Skip if already exists
    });
    
    console.log(`✅ Created ${created.length} sample timesheets`);
    
    // Show summary
    const summary = await Timesheet.findAll({
      where: { employeeId: employee.id },
      include: ['project', 'task'],
      order: [['workDate', 'ASC']]
    });
    
    console.log('\n📊 Weekly Timesheet Summary:');
    summary.forEach(timesheet => {
      console.log(`  ${timesheet.workDate}: ${timesheet.hoursWorked}h - ${timesheet.project.name} / ${timesheet.task.name}`);
    });
    
    const totalHours = summary.reduce((sum, t) => sum + parseFloat(t.hoursWorked), 0);
    console.log(`\n⏱️  Total hours for the week: ${totalHours}h`);
    
  } catch (error) {
    console.error('❌ Error creating sample timesheets:', error);
  } finally {
    process.exit();
  }
}

createSampleTimesheets();