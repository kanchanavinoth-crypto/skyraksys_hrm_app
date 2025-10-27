// Check timesheets for Week 37, 2025 (Sep 8 - Sep 14)
const { Sequelize } = require('sequelize');
const { Timesheet, Employee, Project, Task } = require('./backend/models');

async function checkWeek37Timesheets() {
  try {
    console.log('🔍 Checking timesheets for Week 37, 2025 (Sep 8 - Sep 14, 2025)...\n');

    // Week 37, 2025 starts on Monday, Sep 8, 2025
    const weekStart = '2025-09-08';
    const weekEnd = '2025-09-14';

    console.log(`📅 Week range: ${weekStart} to ${weekEnd}\n`);

    // Check all timesheets for this week
    const timesheets = await Timesheet.findAll({
      where: {
        weekStartDate: {
          [Sequelize.Op.between]: [weekStart, weekEnd]
        }
      },
      include: [
        { 
          model: Employee, 
          as: 'employee', 
          attributes: ['id', 'firstName', 'lastName', 'email'] 
        },
        { 
          model: Project, 
          as: 'project', 
          attributes: ['id', 'name'] 
        },
        { 
          model: Task, 
          as: 'task', 
          attributes: ['id', 'name'] 
        }
      ],
      order: [['employeeId', 'ASC'], ['createdAt', 'DESC']]
    });

    console.log(`📊 Total timesheets found for Week 37: ${timesheets.length}\n`);

    if (timesheets.length > 0) {
      // Group by employee
      const employeeGroups = {};
      timesheets.forEach(timesheet => {
        const empId = timesheet.employeeId;
        if (!employeeGroups[empId]) {
          employeeGroups[empId] = [];
        }
        employeeGroups[empId].push(timesheet);
      });

      Object.keys(employeeGroups).forEach(empId => {
        const employeeTimesheets = employeeGroups[empId];
        const employee = employeeTimesheets[0].employee;
        
        console.log(`👤 Employee: ${employee.firstName} ${employee.lastName} (ID: ${empId})`);
        console.log(`   Total timesheets: ${employeeTimesheets.length}`);
        
        employeeTimesheets.forEach((timesheet, index) => {
          console.log(`   ${index + 1}. Project: ${timesheet.project?.name || 'Unknown'}`);
          console.log(`      Task: ${timesheet.task?.name || 'Unknown'}`);
          console.log(`      Week Start: ${timesheet.weekStartDate}`);
          console.log(`      Status: ${timesheet.status}`);
          console.log(`      Total Hours: ${timesheet.totalHoursWorked}`);
          console.log(`      Created: ${timesheet.createdAt}`);
          console.log(`      Updated: ${timesheet.updatedAt}`);
          console.log(`      Hours: M:${timesheet.mondayHours} T:${timesheet.tuesdayHours} W:${timesheet.wednesdayHours} T:${timesheet.thursdayHours} F:${timesheet.fridayHours} S:${timesheet.saturdayHours} S:${timesheet.sundayHours}`);
          console.log('');
        });
        console.log('─'.repeat(60));
      });
    } else {
      console.log('❌ No timesheets found for Week 37, 2025');
      
      // Check if there are any timesheets around that date range
      console.log('\n🔍 Checking nearby weeks...');
      
      const nearbyTimesheets = await Timesheet.findAll({
        where: {
          weekStartDate: {
            [Sequelize.Op.between]: ['2025-09-01', '2025-09-21']
          }
        },
        include: [
          { 
            model: Employee, 
            as: 'employee', 
            attributes: ['id', 'firstName', 'lastName'] 
          }
        ],
        order: [['weekStartDate', 'ASC'], ['employeeId', 'ASC']]
      });

      console.log(`📊 Nearby timesheets (Sep 1-21): ${nearbyTimesheets.length}`);
      
      nearbyTimesheets.forEach(timesheet => {
        console.log(`   Week: ${timesheet.weekStartDate}, Employee: ${timesheet.employee?.firstName} ${timesheet.employee?.lastName}, Status: ${timesheet.status}`);
      });
    }

    // Check for any deleted timesheets
    console.log('\n🗑️ Checking for soft-deleted timesheets...');
    const deletedTimesheets = await Timesheet.findAll({
      where: {
        weekStartDate: {
          [Sequelize.Op.between]: [weekStart, weekEnd]
        },
        deletedAt: {
          [Sequelize.Op.not]: null
        }
      },
      paranoid: false, // Include soft-deleted records
      include: [
        { 
          model: Employee, 
          as: 'employee', 
          attributes: ['id', 'firstName', 'lastName'] 
        }
      ]
    });

    if (deletedTimesheets.length > 0) {
      console.log(`⚠️  Found ${deletedTimesheets.length} deleted timesheets for Week 37:`);
      deletedTimesheets.forEach(timesheet => {
        console.log(`   Employee: ${timesheet.employee?.firstName} ${timesheet.employee?.lastName}, Deleted: ${timesheet.deletedAt}`);
      });
    } else {
      console.log('✅ No deleted timesheets found');
    }

  } catch (error) {
    console.error('❌ Error checking Week 37 timesheets:', error);
  }
}

checkWeek37Timesheets();