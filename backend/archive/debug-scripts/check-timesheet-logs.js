const { Pool } = require('pg');
const pool = new Pool({
  user: 'skyraksys_user',
  host: 'localhost',
  database: 'skyraksys_hrm',
  password: 'skyraksys_password',
  port: 5432,
});

async function checkTimesheets() {
  try {
    console.log('🔍 Checking timesheet submissions for Aug 4-10, 2025...\n');
    
    // Check all timesheets in that date range
    const result = await pool.query(`
      SELECT 
        wt.id,
        wt."weekStartDate",
        wt."weekEndDate",
        wt."mondayHours",
        wt."tuesdayHours",
        wt."wednesdayHours",
        wt."thursdayHours",
        wt."fridayHours",
        wt."saturdayHours",
        wt."sundayHours",
        wt."totalHours",
        wt.status,
        wt."submittedAt",
        wt."createdAt",
        wt."updatedAt",
        e."firstName" || ' ' || e."lastName" as employee_name,
        p.name as project_name,
        t.name as task_name
      FROM "weekly_timesheets" wt
      LEFT JOIN employees e ON wt."employeeId" = e.id
      LEFT JOIN projects p ON wt."projectId" = p.id
      LEFT JOIN tasks t ON wt."taskId" = t.id
      WHERE wt."weekStartDate" = '2025-08-04'
        AND wt."weekEndDate" = '2025-08-10'
      ORDER BY wt."createdAt" ASC
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No timesheet submissions found for Aug 4-10, 2025');
    } else {
      console.log(`✅ Found ${result.rows.length} timesheet submission(s) for Aug 4-10, 2025:\n`);
      
      result.rows.forEach((row, index) => {
        console.log(`📋 Submission #${index + 1}:`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Employee: ${row.employee_name || 'N/A'}`);
        console.log(`   Project: ${row.project_name || 'N/A'}`);
        console.log(`   Task: ${row.task_name || 'N/A'}`);
        console.log(`   Week: ${row.weekStartDate} to ${row.weekEndDate}`);
        console.log(`   Status: ${row.status}`);
        console.log(`   Total Hours: ${row.totalHours}`);
        console.log(`   Daily Hours: Mon(${row.mondayHours}) Tue(${row.tuesdayHours}) Wed(${row.wednesdayHours}) Thu(${row.thursdayHours}) Fri(${row.fridayHours}) Sat(${row.saturdayHours}) Sun(${row.sundayHours})`);
        console.log(`   Submitted: ${row.submittedAt || 'Not submitted'}`);
        console.log(`   Created: ${row.createdAt}`);
        console.log(`   Updated: ${row.updatedAt}`);
        console.log('');
      });
    }
    
    // Also check for any other week ranges around that time
    console.log('🔍 Checking nearby week ranges...\n');
    const nearbyResult = await pool.query(`
      SELECT 
        wt."weekStartDate",
        wt."weekEndDate",
        COUNT(*) as submission_count,
        STRING_AGG(DISTINCT (e."firstName" || ' ' || e."lastName"), ', ') as employees
      FROM "weekly_timesheets" wt
      LEFT JOIN employees e ON wt."employeeId" = e.id
      WHERE wt."weekStartDate" BETWEEN '2025-08-01' AND '2025-08-15'
      GROUP BY wt."weekStartDate", wt."weekEndDate"
      ORDER BY wt."weekStartDate"
    `);
    
    if (nearbyResult.rows.length > 0) {
      console.log('📅 Nearby week submissions:');
      nearbyResult.rows.forEach(row => {
        console.log(`   ${row.weekStartDate} to ${row.weekEndDate}: ${row.submission_count} submissions by ${row.employees || 'Unknown'}`);
      });
    } else {
      console.log('📅 No submissions found in nearby weeks (Aug 1-15, 2025)');
    }
    
    // Check all timesheet submissions to see what's in the database
    console.log('\n🔍 Checking all recent timesheet submissions...\n');
    const allResult = await pool.query(`
      SELECT 
        wt."weekStartDate",
        wt."weekEndDate",
        COUNT(*) as submission_count,
        STRING_AGG(DISTINCT (e."firstName" || ' ' || e."lastName"), ', ') as employees,
        MIN(wt."createdAt") as earliest_submission,
        MAX(wt."createdAt") as latest_submission
      FROM "weekly_timesheets" wt
      LEFT JOIN employees e ON wt."employeeId" = e.id
      GROUP BY wt."weekStartDate", wt."weekEndDate"
      ORDER BY wt."createdAt" DESC
      LIMIT 10
    `);
    
    if (allResult.rows.length > 0) {
      console.log('📊 Recent timesheet submissions (last 10 weeks):');
      allResult.rows.forEach(row => {
        console.log(`   ${row.weekStartDate} to ${row.weekEndDate}: ${row.submission_count} submissions by ${row.employees || 'Unknown'} (${row.earliest_submission} to ${row.latest_submission})`);
      });
    } else {
      console.log('📊 No timesheet submissions found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking timesheets:', error.message);
  } finally {
    await pool.end();
  }
}

checkTimesheets();