// Simple timesheet check for Week 37, 2025
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

async function checkWeek37Simple() {
  try {
    console.log('🔍 Checking timesheets for Week 37, 2025 (Sep 8 - Sep 14, 2025)...\n');

    // Week 37, 2025 starts on Monday, Sep 8, 2025
    const weekStart = '2025-09-08';
    const weekEnd = '2025-09-14';

    console.log(`📅 Week range: ${weekStart} to ${weekEnd}\n`);

    // First, just check timesheets without joins
    const [timesheets] = await sequelize.query(`
      SELECT * FROM "timesheets" 
      WHERE "weekStartDate" >= '${weekStart}' 
        AND "weekStartDate" <= '${weekEnd}'
        AND "deletedAt" IS NULL
      ORDER BY "employeeId", "createdAt" DESC
    `);

    console.log(`📊 Total timesheets found for Week 37: ${timesheets.length}\n`);

    if (timesheets.length > 0) {
      timesheets.forEach((timesheet, index) => {
        console.log(`${index + 1}. Timesheet ID: ${timesheet.id}`);
        console.log(`   Employee ID: ${timesheet.employeeId}`);
        console.log(`   Project ID: ${timesheet.projectId}`);
        console.log(`   Task ID: ${timesheet.taskId}`);
        console.log(`   Week Start: ${timesheet.weekStartDate}`);
        console.log(`   Status: ${timesheet.status}`);
        console.log(`   Total Hours: ${timesheet.totalHoursWorked}`);
        console.log(`   Created: ${timesheet.createdAt}`);
        console.log(`   Updated: ${timesheet.updatedAt}`);
        console.log(`   Daily Hours: M:${timesheet.mondayHours} T:${timesheet.tuesdayHours} W:${timesheet.wednesdayHours} T:${timesheet.thursdayHours} F:${timesheet.fridayHours} S:${timesheet.saturdayHours} S:${timesheet.sundayHours}`);
        console.log('');
      });
    } else {
      console.log('❌ No timesheets found for Week 37, 2025');
      
      // Check if there are any timesheets around that date range
      console.log('\n🔍 Checking nearby weeks...');
      
      const [nearbyTimesheets] = await sequelize.query(`
        SELECT 
          "weekStartDate",
          "status",
          "employeeId",
          COUNT(*) as count
        FROM "timesheets"
        WHERE "weekStartDate" >= '2025-09-01' 
          AND "weekStartDate" <= '2025-09-21'
          AND "deletedAt" IS NULL
        GROUP BY "weekStartDate", "status", "employeeId"
        ORDER BY "weekStartDate"
      `);

      console.log(`📊 Nearby timesheets (Sep 1-21): ${nearbyTimesheets.length} groups`);
      
      nearbyTimesheets.forEach(group => {
        console.log(`   Week: ${group.weekStartDate}, Employee: ${group.employeeId}, Status: ${group.status}, Count: ${group.count}`);
      });

      // Check all timesheets for any employee
      console.log('\n🔍 Checking latest timesheets (any week)...');
      
      const [latestTimesheets] = await sequelize.query(`
        SELECT 
          "weekStartDate",
          "employeeId",
          "status",
          "createdAt"
        FROM "timesheets"
        WHERE "deletedAt" IS NULL
        ORDER BY "createdAt" DESC
        LIMIT 10
      `);

      console.log(`📊 Latest 10 timesheets:`);
      
      latestTimesheets.forEach((ts, index) => {
        console.log(`   ${index + 1}. Week: ${ts.weekStartDate}, Employee: ${ts.employeeId}, Status: ${ts.status}, Created: ${ts.createdAt}`);
      });
    }

    // Check for any deleted timesheets
    console.log('\n🗑️ Checking for soft-deleted timesheets...');
    const [deletedTimesheets] = await sequelize.query(`
      SELECT 
        "weekStartDate",
        "employeeId",
        "status",
        "deletedAt"
      FROM "timesheets"
      WHERE "weekStartDate" >= '${weekStart}' 
        AND "weekStartDate" <= '${weekEnd}'
        AND "deletedAt" IS NOT NULL
      ORDER BY "deletedAt" DESC
    `);

    if (deletedTimesheets.length > 0) {
      console.log(`⚠️  Found ${deletedTimesheets.length} deleted timesheets for Week 37:`);
      deletedTimesheets.forEach(timesheet => {
        console.log(`   Employee: ${timesheet.employeeId}, Deleted: ${timesheet.deletedAt}, Status: ${timesheet.status}`);
      });
    } else {
      console.log('✅ No deleted timesheets found');
    }

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error checking Week 37 timesheets:', error);
    await sequelize.close();
  }
}

checkWeek37Simple();