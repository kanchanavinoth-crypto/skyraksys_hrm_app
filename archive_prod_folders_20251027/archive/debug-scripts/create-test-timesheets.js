const db = require('./backend/models');

async function createTestTimesheets() {
  try {
    // Get employees to create timesheets for
    const employees = await db.Employee.findAll({ limit: 3 });
    
    if (employees.length === 0) {
      console.log('No employees found. Creating demo employees first...');
      return;
    }

    // Get projects and tasks
    const projects = await db.Project.findAll({ limit: 2 });
    const tasks = await db.Task.findAll({ limit: 2 });

    if (projects.length === 0 || tasks.length === 0) {
      console.log('No projects or tasks found.');
      return;
    }

    // Create some test weekly timesheets
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const project = projects[i % projects.length];
      const task = tasks[i % tasks.length];
      
      const weekStartDate = new Date();
      weekStartDate.setDate(weekStartDate.getDate() - (weekStartDate.getDay() + 7)); // Previous week
      
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);

      const timesheet = await db.Timesheet.create({
        employeeId: employee.id,
        projectId: project.id,
        taskId: task.id,
        weekStartDate: weekStartDate,
        weekEndDate: weekEndDate,
        mondayHours: 8,
        tuesdayHours: 8,
        wednesdayHours: 8,
        thursdayHours: 8,
        fridayHours: 8,
        saturdayHours: 0,
        sundayHours: 0,
        totalHoursWorked: 40,
        description: `Test timesheet for ${employee.firstName} - Week of ${weekStartDate.toDateString()}`,
        status: i === 0 ? 'Submitted' : (i === 1 ? 'Draft' : 'Approved')
      });

      console.log(`✅ Created timesheet for ${employee.firstName} ${employee.lastName} - Status: ${timesheet.status}`);
    }

    console.log('✅ Test timesheets created successfully!');
  } catch (error) {
    console.error('❌ Error creating test timesheets:', error.message);
  }
  process.exit(0);
}

createTestTimesheets();