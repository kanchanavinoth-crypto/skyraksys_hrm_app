// Create Sample Weekly Timesheets with proper weekStartDate
const { Sequelize, DataTypes } = require('sequelize');
const { Employee, Project, Task, Timesheet } = require('./models');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isoWeek = require('dayjs/plugin/isoWeek');
const { v4: uuidv4 } = require('uuid');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

async function createWeeklyTimesheets() {
  console.log('\n=== Creating Sample Weekly Timesheets ===\n');

  try {
    // Get the first employee
    const employee = await Employee.findOne();
    if (!employee) {
      console.log('❌ No employees found. Create an employee first.');
      return;
    }

    console.log(`👤 Creating weekly timesheets for: ${employee.firstName} ${employee.lastName}`);

    // Get some projects and tasks
    const projects = await Project.findAll({ limit: 3 });
    const tasks = await Task.findAll({ limit: 5 });

    if (projects.length === 0 || tasks.length === 0) {
      console.log('❌ No projects or tasks found. Create them first.');
      return;
    }

    console.log(`📋 Using ${projects.length} projects and ${tasks.length} tasks`);

    // Create weekly timesheets for the last 6 weeks including this week
    const weeklyTimesheets = [];
    
    for (let weekOffset = -5; weekOffset <= 0; weekOffset++) {
      const weekStart = dayjs().startOf('isoWeek').add(weekOffset, 'week');
      const weekEnd = weekStart.endOf('isoWeek');
      
      // Pick a random project and task for this week
      const project = projects[Math.abs(weekOffset) % projects.length];
      const task = tasks[Math.abs(weekOffset) % tasks.length];
      
      // Generate random hours for each day
      const mondayHours = Math.floor(Math.random() * 6) + 2; // 2-8 hours
      const tuesdayHours = Math.floor(Math.random() * 6) + 2;
      const wednesdayHours = Math.floor(Math.random() * 6) + 2;
      const thursdayHours = Math.floor(Math.random() * 6) + 2;
      const fridayHours = Math.floor(Math.random() * 6) + 2;
      
      const totalHours = mondayHours + tuesdayHours + wednesdayHours + thursdayHours + fridayHours;
      
      const timesheet = {
        id: uuidv4(),
        employeeId: employee.id,
        projectId: project.id,
        taskId: task.id,
        weekStartDate: weekStart.format('YYYY-MM-DD'),
        weekEndDate: weekEnd.format('YYYY-MM-DD'),
        weekNumber: weekStart.isoWeek(),
        year: weekStart.year(),
        mondayHours,
        tuesdayHours,
        wednesdayHours,
        thursdayHours,
        fridayHours,
        saturdayHours: 0,
        sundayHours: 0,
        totalHoursWorked: totalHours,
        description: `Week of ${weekStart.format('MMM DD, YYYY')} - ${project.name} - ${task.name}`,
        status: weekOffset === 0 ? 'Draft' : (weekOffset >= -2 ? 'Submitted' : 'Approved')
      };
      
      weeklyTimesheets.push(timesheet);
      
      console.log(`📅 Week ${weekStart.format('MMM DD')}: ${totalHours}h total - ${timesheet.status}`);
    }
    
    // Create timesheets in database
    const created = await Timesheet.bulkCreate(weeklyTimesheets, {
      ignoreDuplicates: true,
      fields: [
        'id', 'employeeId', 'projectId', 'taskId', 'weekStartDate', 'weekEndDate', 
        'weekNumber', 'year', 'mondayHours', 'tuesdayHours', 'wednesdayHours', 
        'thursdayHours', 'fridayHours', 'saturdayHours', 'sundayHours', 
        'totalHoursWorked', 'description', 'status'
      ]
    });
    
    console.log(`\n✅ Created ${created.length} weekly timesheets successfully!`);
    
    // Show summary
    const allTimesheets = await Timesheet.findAll({
      where: { employeeId: employee.id },
      include: [
        { model: Project, as: 'project' },
        { model: Task, as: 'task' }
      ],
      order: [['weekStartDate', 'DESC']]
    });
    
    console.log(`\n📊 Total timesheets for ${employee.firstName}: ${allTimesheets.length}`);
    
    allTimesheets.forEach((ts, index) => {
      const weekStart = dayjs(ts.weekStartDate);
      const weekEnd = dayjs(ts.weekEndDate);
      console.log(`  ${index + 1}. Week ${weekStart.format('MMM DD')} - ${weekEnd.format('MMM DD, YYYY')}`);
      console.log(`     Status: ${ts.status} | Hours: ${ts.totalHoursWorked} | Project: ${ts.project?.name}`);
    });

  } catch (error) {
    console.error('❌ Error creating weekly timesheets:', error.message);
    console.error(error);
  }
}

// Run if called directly
if (require.main === module) {
  createWeeklyTimesheets().then(() => {
    console.log('\n🎉 Weekly timesheet creation completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { createWeeklyTimesheets };