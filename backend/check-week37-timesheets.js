// Check timesheets for Week 37, 2025 (Sep 8 - Sep 14)
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

async function checkWeek37Timesheets() {
  try {
    console.log('🔍 Checking timesheets for Week 37, 2025 (Sep 8 - Sep 14, 2025)...\n');

    // Week 37, 2025 starts on Monday, Sep 8, 2025
    const weekStart = '2025-09-08';
    const weekEnd = '2025-09-14';

    console.log(`📅 Week range: ${weekStart} to ${weekEnd}\n`);

    // Raw SQL query to check timesheets
    const [timesheets] = await sequelize.query(`
      SELECT 
        t.*,
        e.firstName,
        e.lastName,
        e.email,
        p.name as projectName,
        tk.name as taskName
      FROM "timesheets" t
      LEFT JOIN "employees" e ON t."employeeId" = e.id
      LEFT JOIN "projects" p ON t."projectId" = p.id
      LEFT JOIN "tasks" tk ON t."taskId" = tk.id
      WHERE t."weekStartDate" >= '${weekStart}' 
        AND t."weekStartDate" <= '${weekEnd}'
        AND t."deletedAt" IS NULL
      ORDER BY t."employeeId", t."createdAt" DESC
    `);

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
        const firstTimesheet = employeeTimesheets[0];
        
        console.log(`👤 Employee: ${firstTimesheet.firstName} ${firstTimesheet.lastName} (ID: ${empId})`);
        console.log(`   Email: ${firstTimesheet.email}`);
        console.log(`   Total timesheets: ${employeeTimesheets.length}`);
        
        employeeTimesheets.forEach((timesheet, index) => {
          console.log(`   ${index + 1}. Project: ${timesheet.projectName || 'Unknown'}`);
          console.log(`      Task: ${timesheet.taskName || 'Unknown'}`);
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
      
      const [nearbyTimesheets] = await sequelize.query(`
        SELECT 
          t."weekStartDate",
          t.status,
          e.firstName,
          e.lastName,
          COUNT(*) as count
        FROM "timesheets" t
        LEFT JOIN "employees" e ON t."employeeId" = e.id
        WHERE t."weekStartDate" >= '2025-09-01' 
          AND t."weekStartDate" <= '2025-09-21'
          AND t."deletedAt" IS NULL
        GROUP BY t."weekStartDate", t.status, e.firstName, e.lastName
        ORDER BY t."weekStartDate", e.firstName
      `);

      console.log(`📊 Nearby timesheets (Sep 1-21): ${nearbyTimesheets.length} groups`);
      
      nearbyTimesheets.forEach(group => {
        console.log(`   Week: ${group.weekStartDate}, Employee: ${group.firstName} ${group.lastName}, Status: ${group.status}, Count: ${group.count}`);
      });
    }

    // Check for any deleted timesheets
    console.log('\n🗑️ Checking for soft-deleted timesheets...');
    const [deletedTimesheets] = await sequelize.query(`
      SELECT 
        t.*,
        e.firstName,
        e.lastName
      FROM "timesheets" t
      LEFT JOIN "employees" e ON t."employeeId" = e.id
      WHERE t."weekStartDate" >= '${weekStart}' 
        AND t."weekStartDate" <= '${weekEnd}'
        AND t."deletedAt" IS NOT NULL
      ORDER BY t."deletedAt" DESC
    `);

    if (deletedTimesheets.length > 0) {
      console.log(`⚠️  Found ${deletedTimesheets.length} deleted timesheets for Week 37:`);
      deletedTimesheets.forEach(timesheet => {
        console.log(`   Employee: ${timesheet.firstName} ${timesheet.lastName}, Deleted: ${timesheet.deletedAt}, Status: ${timesheet.status}`);
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

checkWeek37Timesheets();