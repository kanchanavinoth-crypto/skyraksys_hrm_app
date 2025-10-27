// Check exact timestamps and investigate history visibility issues
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

async function checkTimestampsAndHistory() {
  try {
    console.log('🔍 DETAILED TIMESTAMP ANALYSIS & HISTORY INVESTIGATION\n');

    const weekStart = '2025-09-15';
    const weekEnd = '2025-09-21';
    const employeeId = '44e1c634-485f-46ac-b9d9-f9b8b832a553';

    // Get ALL timesheets for this employee with detailed timestamps
    const [allTimesheets] = await sequelize.query(`
      SELECT 
        t.id,
        t."weekStartDate",
        t."weekEndDate", 
        t."weekNumber",
        t.year,
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
        t."updatedAt",
        t."deletedAt",
        p.name as projectName,
        tk.name as taskName,
        e."firstName",
        e."lastName"
      FROM "timesheets" t
      LEFT JOIN "projects" p ON t."projectId" = p.id
      LEFT JOIN "tasks" tk ON t."taskId" = tk.id
      LEFT JOIN "employees" e ON t."employeeId" = e.id
      WHERE t."employeeId" = '${employeeId}'
        AND t."deletedAt" IS NULL
      ORDER BY t."weekStartDate" DESC, t."createdAt" DESC
    `);

    console.log(`📊 ALL TIMESHEETS FOR EMPLOYEE (${allTimesheets[0]?.firstName} ${allTimesheets[0]?.lastName}):`);
    console.log(`Total found: ${allTimesheets.length}\n`);

    // Group by week for analysis
    const weekGroups = {};
    allTimesheets.forEach(ts => {
      const weekKey = ts.weekStartDate;
      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = [];
      }
      weekGroups[weekKey].push(ts);
    });

    Object.keys(weekGroups).sort().reverse().forEach(weekStart => {
      const timesheets = weekGroups[weekStart];
      const weekNumber = timesheets[0].weekNumber;
      const year = timesheets[0].year;
      
      console.log(`📅 WEEK ${weekNumber}, ${year} (${weekStart} to ${timesheets[0].weekEndDate})`);
      console.log(`   Timesheets: ${timesheets.length}`);
      
      timesheets.forEach((ts, index) => {
        console.log(`   ${index + 1}. ${ts.projectName || 'Unknown'} - ${ts.taskName || 'Unknown'}`);
        console.log(`      ID: ${ts.id}`);
        console.log(`      Hours: ${ts.totalHoursWorked} (M:${ts.mondayHours} T:${ts.tuesdayHours} W:${ts.wednesdayHours} T:${ts.thursdayHours} F:${ts.fridayHours} S:${ts.saturdayHours} S:${ts.sundayHours})`);
        console.log(`      Status: ${ts.status}`);
        console.log(`      Created: ${ts.createdAt}`);
        console.log(`      Updated: ${ts.updatedAt}`);
        console.log(`      Submitted: ${ts.submittedAt || 'Not submitted'}`);
        console.log(`      Deleted: ${ts.deletedAt || 'Not deleted'}`);
        console.log('');
      });
      console.log('─'.repeat(80));
    });

    // Focus on Week 38 (your recent submission)
    console.log('\n🎯 WEEK 38 DETAILED ANALYSIS:');
    const week38 = allTimesheets.filter(ts => ts.weekStartDate === '2025-09-15');
    
    if (week38.length > 0) {
      console.log(`Found ${week38.length} timesheets for Week 38`);
      
      // Check submission timeline
      const submissionTimes = week38.map(ts => new Date(ts.submittedAt || ts.createdAt)).sort();
      const earliestSubmission = submissionTimes[0];
      const latestSubmission = submissionTimes[submissionTimes.length - 1];
      
      console.log(`\n⏰ SUBMISSION TIMELINE:`);
      console.log(`   Earliest: ${earliestSubmission}`);
      console.log(`   Latest: ${latestSubmission}`);
      console.log(`   Time span: ${Math.round((latestSubmission - earliestSubmission) / 1000)} seconds`);
      
      // Group by submission time to see batches
      const submissionBatches = {};
      week38.forEach(ts => {
        const submissionTime = (ts.submittedAt || ts.createdAt).substring(0, 19); // Remove milliseconds
        if (!submissionBatches[submissionTime]) {
          submissionBatches[submissionTime] = [];
        }
        submissionBatches[submissionTime].push(ts);
      });
      
      console.log(`\n📦 SUBMISSION BATCHES:`);
      Object.keys(submissionBatches).sort().forEach(time => {
        const batch = submissionBatches[time];
        console.log(`   ${time}: ${batch.length} timesheets`);
        batch.forEach(ts => {
          console.log(`      - ${ts.projectName} - ${ts.taskName} (${ts.totalHoursWorked}h)`);
        });
      });
      
    } else {
      console.log('❌ No timesheets found for Week 38!');
    }

    // Check what the API would return (simulate frontend call)
    console.log('\n🌐 SIMULATING FRONTEND API CALL:');
    console.log('Checking what /api/timesheets would return...');
    
    const [apiSimulation] = await sequelize.query(`
      SELECT 
        t.*,
        p.name as "project.name",
        tk.name as "task.name",
        e."firstName" as "employee.firstName",
        e."lastName" as "employee.lastName"
      FROM "timesheets" t
      LEFT JOIN "projects" p ON t."projectId" = p.id
      LEFT JOIN "tasks" tk ON t."taskId" = tk.id  
      LEFT JOIN "employees" e ON t."employeeId" = e.id
      WHERE t."employeeId" = '${employeeId}'
        AND t."deletedAt" IS NULL
      ORDER BY t."weekStartDate" DESC
      LIMIT 10
    `);

    console.log(`API would return ${apiSimulation.length} timesheets`);
    apiSimulation.forEach((ts, index) => {
      console.log(`${index + 1}. Week ${ts.weekStartDate}: ${ts['project.name']} - ${ts['task.name']} (${ts.totalHoursWorked}h, ${ts.status})`);
    });

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error checking timestamps:', error);
    await sequelize.close();
  }
}

checkTimestampsAndHistory();