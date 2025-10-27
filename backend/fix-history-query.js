console.log('🔧 FIXING HISTORY QUERY - REMOVING SOFT DELETE FILTERS\n');

const { Timesheet, Employee, Project, Task, sequelize } = require('./models');

async function testFixedHistoryQuery() {
  try {
    // Test with raw SQL first to avoid Sequelize auto-soft-delete
    const rawQuery = `
      SELECT 
        t.id, 
        t."weekStartDate", 
        t."weekEndDate", 
        t."weekNumber", 
        t.year, 
        t."totalHoursWorked",
        t."mondayHours",
        t."tuesdayHours", 
        t."wednesdayHours",
        t."thursdayHours",
        t."fridayHours",
        t."saturdayHours",
        t."sundayHours",
        t.description,
        t.status,
        t."submittedAt",
        p.name as "projectName",
        tk.name as "taskName",
        e."firstName", 
        e."lastName"
      FROM timesheets t
      LEFT JOIN projects p ON t."projectId" = p.id
      LEFT JOIN tasks tk ON t."taskId" = tk.id  
      LEFT JOIN employees e ON t."employeeId" = e.id
      WHERE t."employeeId" = '44e1c634-485f-46ac-b9d9-f9b8b832a553'
        AND t."deletedAt" IS NULL
      ORDER BY t."weekStartDate" DESC
      LIMIT 20;
    `;

    console.log('📊 Executing raw SQL query...');
    const [results] = await sequelize.query(rawQuery);
    
    console.log(`✅ Found ${results.length} timesheets with project/task names:`);
    
    results.forEach((row, index) => {
      console.log(`\n${index + 1}. Week ${row.weekNumber}, ${row.year} (${row.weekStartDate} to ${row.weekEndDate})`);
      console.log(`   📁 Project: ${row.projectName || 'Unknown'}`);
      console.log(`   📋 Task: ${row.taskName || 'Unknown'}`);
      console.log(`   ⏰ Hours: ${row.totalHoursWorked}`);
      console.log(`   📅 Submitted: ${row.submittedAt}`);
      console.log(`   📊 Status: ${row.status}`);
    });

    // Now test the modified Sequelize query without soft delete joins
    console.log('\n🔍 Testing modified Sequelize query...');
    
    const sequelizeResults = await Timesheet.findAll({
      where: {
        employeeId: '44e1c634-485f-46ac-b9d9-f9b8b832a553'
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
          required: false, // LEFT JOIN
          paranoid: false // DISABLE soft delete filter
        },
        {
          model: Task,
          as: 'task', 
          attributes: ['id', 'name'],
          required: false, // LEFT JOIN
          paranoid: false // DISABLE soft delete filter
        },
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName', 'employeeId'],
          required: false
        }
      ],
      order: [['weekStartDate', 'DESC']],
      limit: 20
    });

    console.log(`\n✅ Sequelize query returned ${sequelizeResults.length} records`);
    
    sequelizeResults.slice(0, 3).forEach((timesheet, index) => {
      console.log(`\n${index + 1}. Week ${timesheet.weekNumber}, ${timesheet.year}`);
      console.log(`   📁 Project: ${timesheet.project?.name || 'Unknown'}`);
      console.log(`   📋 Task: ${timesheet.task?.name || 'Unknown'}`);
      console.log(`   ⏰ Hours: ${timesheet.totalHoursWorked}`);
      console.log(`   📅 Submitted: ${timesheet.submittedAt}`);
    });

  } catch (error) {
    console.error('❌ Error in fixed query:', error.message);
    if (error.sql) {
      console.log('\n🔍 SQL that failed:');
      console.log(error.sql);
    }
  }
}

testFixedHistoryQuery();