// Real-time submission tracing for Week 38, 2025
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

async function traceWeek38Submission() {
  try {
    console.log('🔍 Tracing Week 38, 2025 submission process...\n');

    // Week 38, 2025 starts on Monday, Sep 15, 2025
    const weekStart = '2025-09-15';
    const weekEnd = '2025-09-21';

    console.log(`📅 Week range: ${weekStart} to ${weekEnd}\n`);

    // Check current state before submission
    console.log('📊 BEFORE SUBMISSION STATE:');
    const [beforeTimesheets] = await sequelize.query(`
      SELECT 
        t.id,
        t."weekStartDate",
        t.status,
        t."totalHoursWorked",
        t."createdAt",
        t."updatedAt",
        p.name as projectName,
        tk.name as taskName
      FROM "timesheets" t
      LEFT JOIN "projects" p ON t."projectId" = p.id
      LEFT JOIN "tasks" tk ON t."taskId" = tk.id
      WHERE t."weekStartDate" >= '${weekStart}' 
        AND t."weekStartDate" <= '${weekEnd}'
        AND t."deletedAt" IS NULL
        AND t."employeeId" = '44e1c634-485f-46ac-b9d9-f9b8b832a553'
      ORDER BY t."createdAt" DESC
    `);

    if (beforeTimesheets.length > 0) {
      console.log(`Found ${beforeTimesheets.length} existing timesheets:\n`);
      beforeTimesheets.forEach((ts, index) => {
        console.log(`${index + 1}. ID: ${ts.id}`);
        console.log(`   Project: ${ts.projectName}`);
        console.log(`   Task: ${ts.taskName}`);
        console.log(`   Status: ${ts.status}`);
        console.log(`   Hours: ${ts.totalHoursWorked}`);
        console.log(`   Created: ${ts.createdAt}`);
        console.log(`   Updated: ${ts.updatedAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No existing timesheets found for Week 38\n');
    }

    // Monitor for changes every 2 seconds for 30 seconds
    console.log('👀 MONITORING FOR CHANGES (30 seconds)...\n');
    let lastCount = beforeTimesheets.length;
    let iterations = 0;
    const maxIterations = 15; // 30 seconds / 2 seconds

    const monitor = setInterval(async () => {
      iterations++;
      
      try {
        const [currentTimesheets] = await sequelize.query(`
          SELECT 
            t.id,
            t."weekStartDate",
            t.status,
            t."totalHoursWorked",
            t."submittedAt",
            t."createdAt",
            t."updatedAt",
            p.name as projectName,
            tk.name as taskName
          FROM "timesheets" t
          LEFT JOIN "projects" p ON t."projectId" = p.id
          LEFT JOIN "tasks" tk ON t."taskId" = tk.id
          WHERE t."weekStartDate" >= '${weekStart}' 
            AND t."weekStartDate" <= '${weekEnd}'
            AND t."deletedAt" IS NULL
            AND t."employeeId" = '44e1c634-485f-46ac-b9d9-f9b8b832a553'
          ORDER BY t."updatedAt" DESC
        `);

        if (currentTimesheets.length !== lastCount) {
          console.log(`🔔 CHANGE DETECTED! Count changed from ${lastCount} to ${currentTimesheets.length}`);
          console.log(`⏰ Time: ${new Date().toISOString()}\n`);
          
          currentTimesheets.forEach((ts, index) => {
            console.log(`${index + 1}. ID: ${ts.id.substring(0, 8)}...`);
            console.log(`   Project: ${ts.projectName}`);
            console.log(`   Task: ${ts.taskName}`);
            console.log(`   Status: ${ts.status}`);
            console.log(`   Hours: ${ts.totalHoursWorked}`);
            console.log(`   Submitted: ${ts.submittedAt || 'Not submitted'}`);
            console.log(`   Created: ${ts.createdAt}`);
            console.log(`   Updated: ${ts.updatedAt}`);
            console.log('');
          });
          
          lastCount = currentTimesheets.length;
        } else {
          process.stdout.write(`⏰ ${new Date().toLocaleTimeString()} - Monitoring... (${iterations}/${maxIterations})\r`);
        }

        if (iterations >= maxIterations) {
          clearInterval(monitor);
          console.log('\n\n📊 FINAL STATE:');
          
          const [finalTimesheets] = await sequelize.query(`
            SELECT 
              t.id,
              t."weekStartDate",
              t.status,
              t."totalHoursWorked",
              t."submittedAt",
              t."createdAt",
              t."updatedAt",
              p.name as projectName,
              tk.name as taskName
            FROM "timesheets" t
            LEFT JOIN "projects" p ON t."projectId" = p.id
            LEFT JOIN "tasks" tk ON t."taskId" = tk.id
            WHERE t."weekStartDate" >= '${weekStart}' 
              AND t."weekStartDate" <= '${weekEnd}'
              AND t."deletedAt" IS NULL
              AND t."employeeId" = '44e1c634-485f-46ac-b9d9-f9b8b832a553'
            ORDER BY t."updatedAt" DESC
          `);

          console.log(`Final count: ${finalTimesheets.length} timesheets\n`);
          
          finalTimesheets.forEach((ts, index) => {
            console.log(`${index + 1}. ${ts.projectName} - ${ts.taskName}`);
            console.log(`   Status: ${ts.status}, Hours: ${ts.totalHoursWorked}`);
            console.log(`   Submitted: ${ts.submittedAt || 'Not submitted'}`);
            console.log('');
          });

          await sequelize.close();
        }
      } catch (error) {
        console.error('Error during monitoring:', error);
        clearInterval(monitor);
        await sequelize.close();
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Error setting up trace:', error);
    await sequelize.close();
  }
}

traceWeek38Submission();