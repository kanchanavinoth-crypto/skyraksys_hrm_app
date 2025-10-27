// Get full details of the submitted Week 38 timesheets
const { Sequelize, Op } = require('sequelize');

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

async function getWeek38Details() {
  try {
    console.log('📋 Week 38, 2025 Submission Details\n');

    const weekStart = '2025-09-15';
    const weekEnd = '2025-09-21';

    // Get detailed timesheet information
    const [timesheets] = await sequelize.query(`
      SELECT 
        t.id,
        t."projectId",
        t."taskId",
        t."weekStartDate",
        t.status,
        t."totalHoursWorked",
        t."mondayHours",
        t."tuesdayHours", 
        t."wednesdayHours",
        t."thursdayHours",
        t."fridayHours",
        t."saturdayHours",
        t."sundayHours",
        t.description,
        t."submittedAt",
        t."createdAt"
      FROM "timesheets" t
      WHERE t."weekStartDate" >= '${weekStart}' 
        AND t."weekStartDate" <= '${weekEnd}'
        AND t."deletedAt" IS NULL
        AND t."employeeId" = '44e1c634-485f-46ac-b9d9-f9b8b832a553'
      ORDER BY t."createdAt" DESC
    `);

    console.log(`📊 Found ${timesheets.length} timesheets for Week 38:\n`);

    for (let i = 0; i < timesheets.length; i++) {
      const ts = timesheets[i];
      console.log(`${i + 1}. Timesheet ID: ${ts.id}`);
      console.log(`   Week: ${ts.weekStartDate}`);
      console.log(`   Status: ${ts.status}`);
      console.log(`   Total Hours: ${ts.totalHoursWorked}`);
      console.log(`   Project ID: ${ts.projectId}`);
      console.log(`   Task ID: ${ts.taskId}`);
      console.log(`   Daily Hours: M:${ts.mondayHours} T:${ts.tuesdayHours} W:${ts.wednesdayHours} T:${ts.thursdayHours} F:${ts.fridayHours} S:${ts.saturdayHours} S:${ts.sundayHours}`);
      console.log(`   Description: ${ts.description || 'No description'}`);
      console.log(`   Submitted: ${ts.submittedAt}`);
      console.log(`   Created: ${ts.createdAt}`);

      // Get project details
      const [projects] = await sequelize.query(`
        SELECT name FROM "projects" WHERE id = '${ts.projectId}'
      `);
      
      // Get task details  
      const [tasks] = await sequelize.query(`
        SELECT name FROM "tasks" WHERE id = '${ts.taskId}'
      `);

      if (projects.length > 0) {
        console.log(`   Project Name: ${projects[0].name}`);
      } else {
        console.log(`   Project Name: ❌ NOT FOUND`);
      }

      if (tasks.length > 0) {
        console.log(`   Task Name: ${tasks[0].name}`);
      } else {
        console.log(`   Task Name: ❌ NOT FOUND`);
      }

      console.log('');
    }

    // Summary
    const totalHours = timesheets.reduce((sum, ts) => sum + parseFloat(ts.totalHoursWorked || 0), 0);
    const submittedCount = timesheets.filter(ts => ts.status === 'Submitted').length;
    
    console.log('📈 SUMMARY:');
    console.log(`   Total Timesheets: ${timesheets.length}`);
    console.log(`   Submitted: ${submittedCount}`);
    console.log(`   Total Hours: ${totalHours}`);
    console.log(`   Status: ${submittedCount === timesheets.length ? '✅ All Submitted' : '⚠️ Some Pending'}`);

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error getting details:', error);
    await sequelize.close();
  }
}

getWeek38Details();