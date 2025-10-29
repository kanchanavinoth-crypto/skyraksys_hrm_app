// Investigate the missing 4th task and submission discrepancies
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

async function investigateSubmissionIssue() {
  try {
    console.log('🔍 INVESTIGATING Week 38 Submission Discrepancies\n');

    const weekStart = '2025-09-15';
    const weekEnd = '2025-09-21';
    const employeeId = '44e1c634-485f-46ac-b9d9-f9b8b832a553';

    // Check what tasks the user was trying to submit
    console.log('📋 Expected Tasks from User Input:');
    console.log('1. Project: 4c82665a-698e-4ea9-8bfb-1033794b7527, Task: 457e0a06-4d49-4a99-bfcc-a238aa74f582 (20h: 4+4+4+4+4+0+0)');
    console.log('2. Project: 35347682-ed3f-4a1c-88b9-78cad7d8e7ad, Task: fc5b9c5d-48c4-47f4-addc-a1bf1e6ce3d1 (14h: 2+2+2+2+2+2+2)');
    console.log('3. Project: 35347682-ed3f-4a1c-88b9-78cad7d8e7ad, Task: 6c090a29-096a-492a-a7c7-690ec0b4c6ef (7h: 1+1+1+1+1+1+1)');
    console.log('4. Project: 35347682-ed3f-4a1c-88b9-78cad7d8e7ad, Task: baed1fc5-3fd6-4383-8e45-9fec7bb44fa5 (7h: 1+1+1+1+1+1+1)');
    console.log('Expected Total: 48h\n');

    // Get actual submitted timesheets for Week 38
    const [actualTimesheets] = await sequelize.query(`
      SELECT 
        t.id,
        t."projectId",
        t."taskId", 
        t."totalHoursWorked",
        t."mondayHours",
        t."tuesdayHours",
        t."wednesdayHours", 
        t."thursdayHours",
        t."fridayHours",
        t."saturdayHours",
        t."sundayHours",
        t.status,
        t."submittedAt",
        t."createdAt",
        p.name as projectName,
        tk.name as taskName
      FROM "timesheets" t
      LEFT JOIN "projects" p ON t."projectId" = p.id
      LEFT JOIN "tasks" tk ON t."taskId" = tk.id
      WHERE t."weekStartDate" >= '${weekStart}' 
        AND t."weekStartDate" <= '${weekEnd}'
        AND t."deletedAt" IS NULL
        AND t."employeeId" = '${employeeId}'
      ORDER BY t."createdAt" DESC
    `);

    console.log('📊 ACTUAL SUBMITTED TIMESHEETS:');
    console.log(`Found ${actualTimesheets.length} timesheets\n`);

    let totalActualHours = 0;
    actualTimesheets.forEach((ts, index) => {
      console.log(`${index + 1}. ${ts.projectName} - ${ts.taskName}`);
      console.log(`   Project ID: ${ts.projectId}`);
      console.log(`   Task ID: ${ts.taskId}`);
      console.log(`   Total Hours: ${ts.totalHoursWorked}`);
      console.log(`   Daily: M:${ts.mondayHours} T:${ts.tuesdayHours} W:${ts.wednesdayHours} T:${ts.thursdayHours} F:${ts.fridayHours} S:${ts.saturdayHours} S:${ts.sundayHours}`);
      console.log(`   Status: ${ts.status}`);
      console.log(`   Submitted: ${ts.submittedAt}`);
      console.log('');
      
      totalActualHours += parseFloat(ts.totalHoursWorked || 0);
    });

    console.log(`Total Actual Hours: ${totalActualHours}h`);
    console.log(`Expected Hours: 48h`);
    console.log(`Difference: ${totalActualHours - 48}h\n`);

    // Check for missing task combinations
    console.log('🔍 CHECKING FOR MISSING TASK COMBINATIONS:');
    
    const expectedTasks = [
      { projectId: '4c82665a-698e-4ea9-8bfb-1033794b7527', taskId: '457e0a06-4d49-4a99-bfcc-a238aa74f582', expectedHours: 20 },
      { projectId: '35347682-ed3f-4a1c-88b9-78cad7d8e7ad', taskId: 'fc5b9c5d-48c4-47f4-addc-a1bf1e6ce3d1', expectedHours: 14 },
      { projectId: '35347682-ed3f-4a1c-88b9-78cad7d8e7ad', taskId: '6c090a29-096a-492a-a7c7-690ec0b4c6ef', expectedHours: 7 },
      { projectId: '35347682-ed3f-4a1c-88b9-78cad7d8e7ad', taskId: 'baed1fc5-3fd6-4383-8e45-9fec7bb44fa5', expectedHours: 7 }
    ];

    expectedTasks.forEach((expected, index) => {
      const found = actualTimesheets.find(ts => 
        ts.projectId === expected.projectId && ts.taskId === expected.taskId
      );
      
      if (found) {
        const hoursDiff = parseFloat(found.totalHoursWorked) - expected.expectedHours;
        console.log(`✅ Task ${index + 1}: FOUND`);
        console.log(`   Expected: ${expected.expectedHours}h, Actual: ${found.totalHoursWorked}h, Diff: ${hoursDiff > 0 ? '+' : ''}${hoursDiff}h`);
      } else {
        console.log(`❌ Task ${index + 1}: MISSING`);
        console.log(`   Project: ${expected.projectId}`);
        console.log(`   Task: ${expected.taskId}`);
        console.log(`   Expected Hours: ${expected.expectedHours}h`);
      }
      console.log('');
    });

    // Check if there are any draft timesheets that failed to submit
    console.log('🔍 CHECKING FOR FAILED SUBMISSIONS (Draft status):');
    const [draftTimesheets] = await sequelize.query(`
      SELECT 
        t.id,
        t."projectId", 
        t."taskId",
        t."totalHoursWorked",
        t.status,
        t."createdAt",
        p.name as projectName,
        tk.name as taskName
      FROM "timesheets" t
      LEFT JOIN "projects" p ON t."projectId" = p.id
      LEFT JOIN "tasks" tk ON t."taskId" = tk.id
      WHERE t."weekStartDate" >= '${weekStart}' 
        AND t."weekStartDate" <= '${weekEnd}'
        AND t."deletedAt" IS NULL
        AND t."employeeId" = '${employeeId}'
        AND t.status = 'Draft'
      ORDER BY t."createdAt" DESC
    `);

    if (draftTimesheets.length > 0) {
      console.log(`Found ${draftTimesheets.length} draft timesheets (failed to submit):`);
      draftTimesheets.forEach((ts, index) => {
        console.log(`${index + 1}. ${ts.projectName} - ${ts.taskName}: ${ts.totalHoursWorked}h (Draft)`);
      });
    } else {
      console.log('No draft timesheets found');
    }

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error investigating submission:', error);
    await sequelize.close();
  }
}

investigateSubmissionIssue();