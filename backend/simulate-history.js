// Direct backend test using Sequelize models to simulate what History API returns
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Initialize database connection
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5433,
  database: 'skyraksys_hrm',
  username: 'hrm_admin',
  password: 'hrm_secure_2024',
  logging: false
});

// Define the Timesheet model structure based on backend
const Timesheet = sequelize.define('Timesheet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  weekStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  weekEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  weekNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  totalHoursWorked: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  mondayHours: DataTypes.DECIMAL(4, 2),
  tuesdayHours: DataTypes.DECIMAL(4, 2),
  wednesdayHours: DataTypes.DECIMAL(4, 2),
  thursdayHours: DataTypes.DECIMAL(4, 2),
  fridayHours: DataTypes.DECIMAL(4, 2),
  saturdayHours: DataTypes.DECIMAL(4, 2),
  sundayHours: DataTypes.DECIMAL(4, 2),
  description: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Rejected'),
    defaultValue: 'Draft'
  },
  submittedAt: DataTypes.DATE,
  approvedAt: DataTypes.DATE,
  rejectedAt: DataTypes.DATE,
  approverComments: DataTypes.TEXT,
  approvedBy: DataTypes.UUID
}, {
  tableName: 'timesheets',
  paranoid: true // This enables soft deletes
});

// Define associations similar to backend
const Project = sequelize.define('Project', {
  id: { type: DataTypes.UUID, primaryKey: true },
  name: DataTypes.STRING
}, { tableName: 'projects', paranoid: true });

const Task = sequelize.define('Task', {
  id: { type: DataTypes.UUID, primaryKey: true },
  name: DataTypes.STRING
}, { tableName: 'tasks', paranoid: true });

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.UUID, primaryKey: true },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  employeeId: DataTypes.STRING
}, { tableName: 'employees', paranoid: true });

// Set up associations
Timesheet.belongsTo(Project, { foreignKey: 'projectId' });
Timesheet.belongsTo(Task, { foreignKey: 'taskId' });
Timesheet.belongsTo(Employee, { foreignKey: 'employeeId' });

async function simulateHistoryAPI() {
  try {
    console.log('🔍 SIMULATING HISTORY API USING BACKEND MODELS\n');

    const employeeId = '44e1c634-485f-46ac-b9d9-f9b8b832a553'; // John Developer

    // This simulates the exact call the TimesheetHistory component makes
    const timesheets = await Timesheet.findAll({
      where: {
        employeeId: employeeId
      },
      include: [
        {
          model: Project,
          attributes: ['id', 'name']
        },
        {
          model: Task,
          attributes: ['id', 'name']
        },
        {
          model: Employee,
          attributes: ['id', 'firstName', 'lastName', 'employeeId'],
          as: 'Employee'
        }
      ],
      order: [['weekStartDate', 'DESC']],
      limit: 20 // History component probably has pagination
    });

    console.log(`📊 Found ${timesheets.length} timesheets for employee\n`);

    if (timesheets.length === 0) {
      console.log('❌ No timesheets found - this explains why History is empty!');
      await sequelize.close();
      return;
    }

    // Check the structure
    console.log('📋 Data structure of first timesheet:');
    const first = timesheets[0];
    console.log(`   ID: ${first.id}`);
    console.log(`   Week: ${first.weekStartDate}`);
    console.log(`   Project: ${first.Project?.name || 'NULL'}`);
    console.log(`   Task: ${first.Task?.name || 'NULL'}`);
    console.log(`   Employee: ${first.Employee?.firstName || 'NULL'}`);
    console.log(`   Status: ${first.status}`);
    console.log(`   Hours: ${first.totalHoursWorked}`);
    console.log(`   Has Project Object: ${!!first.Project}`);
    console.log(`   Has Task Object: ${!!first.Task}\n`);

    // Look for Week 38 specifically
    const week38 = timesheets.filter(ts => ts.weekStartDate === '2025-09-15');
    console.log(`🎯 Week 38 timesheets found: ${week38.length}`);

    if (week38.length > 0) {
      console.log('✅ Week 38 timesheets exist in the data:');
      week38.forEach((ts, index) => {
        console.log(`${index + 1}. ${ts.Project?.name || 'No Project'} - ${ts.Task?.name || 'No Task'}`);
        console.log(`   Status: ${ts.status}, Hours: ${ts.totalHoursWorked}`);
        console.log(`   Created: ${ts.createdAt}`);
        console.log(`   Submitted: ${ts.submittedAt || 'Not submitted'}`);
      });
    } else {
      console.log('❌ No Week 38 timesheets found in limited results');
    }

    // Check what weeks are in the first 20 results
    console.log('\n📅 Weeks in the first 20 results (what History would show):');
    const uniqueWeeks = [...new Set(timesheets.map(ts => ts.weekStartDate))].sort().reverse();
    uniqueWeeks.forEach(week => {
      const count = timesheets.filter(ts => ts.weekStartDate === week).length;
      console.log(`   ${week}: ${count} timesheet(s)`);
    });

    // Check if there's a pagination/limit issue
    console.log('\n🔍 Checking if Week 38 is beyond the limit...');
    const allTimesheets = await Timesheet.findAll({
      where: { employeeId: employeeId },
      attributes: ['weekStartDate', 'createdAt'],
      order: [['weekStartDate', 'DESC']]
    });

    const week38Position = allTimesheets.findIndex(ts => ts.weekStartDate === '2025-09-15');
    if (week38Position !== -1) {
      console.log(`Week 38 is at position ${week38Position + 1} in the full list`);
      if (week38Position >= 20) {
        console.log('⚠️  ISSUE FOUND: Week 38 is beyond the 20-item limit!');
        console.log('   History component needs pagination or higher limit');
      }
    }

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error simulating History API:', error);
    await sequelize.close();
  }
}

simulateHistoryAPI();