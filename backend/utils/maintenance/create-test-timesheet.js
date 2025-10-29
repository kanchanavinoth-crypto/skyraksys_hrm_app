// Create timesheet for test user
const { User, Employee, Timesheet, Project, Task } = require('./models');
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');

dayjs.extend(isoWeek);

async function createTimesheetForTestUser() {
  console.log('\n=== Creating Timesheet for Test User ===\n');

  try {
    // Find test user
    const user = await User.findOne({ 
      where: { email: 'test@skyraksys.com' },
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });

    if (!user || !user.employee) {
      console.log('❌ Test user or employee not found');
      return;
    }

    console.log(`👤 Found test user: ${user.firstName} ${user.lastName}`);
    console.log(`👔 Employee ID: ${user.employee.id}`);

    // Get a project and task
    const project = await Project.findOne();
    const task = await Task.findOne();

    if (!project || !task) {
      console.log('❌ No projects or tasks found');
      return;
    }

    // Create a current week timesheet for test user
    const currentWeek = dayjs().startOf('isoWeek');
    
    const timesheet = await Timesheet.create({
      employeeId: user.employee.id,
      projectId: project.id,
      taskId: task.id,
      weekStartDate: currentWeek.format('YYYY-MM-DD'),
      weekEndDate: currentWeek.endOf('isoWeek').format('YYYY-MM-DD'),
      weekNumber: currentWeek.isoWeek(),
      year: currentWeek.year(),
      mondayHours: 8,
      tuesdayHours: 7.5,
      wednesdayHours: 8,
      thursdayHours: 6,
      fridayHours: 5.5,
      saturdayHours: 0,
      sundayHours: 0,
      totalHoursWorked: 35,
      description: `Test timesheet for week of ${currentWeek.format('MMM DD, YYYY')}`,
      status: 'Draft'
    });

    console.log(`✅ Created timesheet: ${timesheet.id}`);
    console.log(`📅 Week: ${timesheet.weekStartDate} to ${timesheet.weekEndDate}`);
    console.log(`⏰ Total hours: ${timesheet.totalHoursWorked}`);
    console.log(`📊 Status: ${timesheet.status}`);

  } catch (error) {
    console.error('❌ Error creating timesheet:', error.message);
  }
}

createTimesheetForTestUser().then(() => {
  console.log('\n🎉 Timesheet creation completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});