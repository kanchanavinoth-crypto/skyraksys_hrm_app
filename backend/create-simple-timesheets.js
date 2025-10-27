const { Timesheet, Employee, Project, Task } = require('./models');
const dayjs = require('dayjs');

async function createSampleTimesheets() {
  try {
    console.log('Creating sample timesheets...');
    
    // Get the first employee
    const employee = await Employee.findOne();
    if (!employee) {
      console.log('No employees found');
      return;
    }
    
    console.log('Creating timesheets for:', employee.firstName, employee.lastName);
    
    // Get or create a project
    let project = await Project.findOne();
    if (!project) {
      project = await Project.create({
        name: 'Website Development',
        description: 'Main website development project',
        startDate: dayjs().subtract(30, 'day').toDate(),
        endDate: dayjs().add(30, 'day').toDate(),
        status: 'Active',
        clientName: 'Internal',
        isActive: true,
        managerId: employee.id
      });
      console.log('Created project:', project.name);
    }
    
    // Get or create a task
    let task = await Task.findOne();
    if (!task) {
      task = await Task.create({
        name: 'Frontend Development',
        description: 'React frontend development work',
        estimatedHours: 40,
        actualHours: 0,
        status: 'In Progress',
        priority: 'High',
        availableToAll: true,
        isActive: true,
        projectId: project.id,
        assignedTo: employee.id
      });
      console.log('Created task:', task.name);
    }
    
    // Create timesheets for the current week
    const currentWeek = dayjs().startOf('isoWeek');
    const timesheets = [];
    
    for (let i = 0; i < 5; i++) { // Monday to Friday
      const workDate = currentWeek.add(i, 'day');
      const timesheet = await Timesheet.create({
        workDate: workDate.format('YYYY-MM-DD'),
        hoursWorked: 8.0,
        description: `${project.name} - ${task.name}`,
        status: 'Draft',
        employeeId: employee.id,
        projectId: project.id,
        taskId: task.id
      });
      timesheets.push(timesheet);
      console.log(`Created timesheet for ${workDate.format('YYYY-MM-DD')}: 8 hours`);
    }
    
    console.log(`✅ Created ${timesheets.length} sample timesheets`);
    
    // Verify the data
    const allTimesheets = await Timesheet.findAll({
      include: [
        { model: Project, as: 'project' },
        { model: Task, as: 'task' },
        { model: Employee, as: 'employee' }
      ]
    });
    
    console.log(`\nTotal timesheets in database: ${allTimesheets.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createSampleTimesheets();