const { Pool } = require('pg');
const pool = new Pool({
  user: 'hrm_admin',
  host: 'localhost',
  database: 'skyraksys_hrm',
  password: 'hrm_secure_2024',
  port: 5433,
});

async function checkTimesheets() {
  try {
    console.log('🔍 Checking timesheet submissions for Aug 4-10, 2025...\n');
    
    // Check all timesheets in that date range
    const result = await pool.query(`
      SELECT 
        t.id,
        t."weekStartDate",
        t."weekEndDate",
        t."mondayHours",
        t."tuesdayHours",
        t."wednesdayHours",
        t."thursdayHours",
        t."fridayHours",
        t."saturdayHours",
        t."sundayHours",
        t."totalHoursWorked",
        t.status,
        t."submittedAt",
        t."createdAt",
        t."updatedAt",
        t.description,
        e."firstName" || ' ' || e."lastName" as employee_name,
        p.name as project_name,
        tk.name as task_name
      FROM timesheets t
      LEFT JOIN employees e ON t."employeeId" = e.id
      LEFT JOIN projects p ON t."projectId" = p.id
      LEFT JOIN tasks tk ON t."taskId" = tk.id
      WHERE t."weekStartDate" = '2025-08-04'
        AND t."weekEndDate" = '2025-08-10'
      ORDER BY t."createdAt" ASC
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No timesheet submissions found for Aug 4-10, 2025');
      
      // Check nearby dates
      console.log('\n🔍 Checking for submissions around Aug 4-10, 2025...\n');
      const nearbyResult = await pool.query(`
        SELECT 
          t."weekStartDate",
          t."weekEndDate",
          COUNT(*) as submission_count,
          STRING_AGG(DISTINCT (e."firstName" || ' ' || e."lastName"), ', ') as employees
        FROM timesheets t
        LEFT JOIN employees e ON t."employeeId" = e.id
        WHERE t."weekStartDate" BETWEEN '2025-08-01' AND '2025-08-15'
        GROUP BY t."weekStartDate", t."weekEndDate"
        ORDER BY t."weekStartDate"
      `);
      
      if (nearbyResult.rows.length > 0) {
        console.log('📅 Found submissions for nearby weeks:');
        nearbyResult.rows.forEach(row => {
          console.log(`   ${row.weekStartDate} to ${row.weekEndDate}: ${row.submission_count} submissions by ${row.employees || 'Unknown'}`);
        });
      } else {
        console.log('❌ No submissions found for any weeks in August 2025');
      }
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
        console.log(`   Total Hours: ${row.totalHoursWorked}`);
        console.log(`   Daily Hours: Mon(${row.mondayHours}) Tue(${row.tuesdayHours}) Wed(${row.wednesdayHours}) Thu(${row.thursdayHours}) Fri(${row.fridayHours}) Sat(${row.saturdayHours}) Sun(${row.sundayHours})`);
        console.log(`   Description: ${row.description || 'None'}`);
        console.log(`   Submitted: ${row.submittedAt || 'Not submitted'}`);
        console.log(`   Created: ${row.createdAt}`);
        console.log(`   Updated: ${row.updatedAt}`);
        console.log('');
      });
    }
    
    // Check all timesheet submissions to see what weeks have data
    console.log('\n🔍 Checking all timesheet submissions by week...\n');
    const allResult = await pool.query(`
      SELECT 
        t."weekStartDate",
        t."weekEndDate",
        COUNT(*) as submission_count,
        STRING_AGG(DISTINCT (e."firstName" || ' ' || e."lastName"), ', ') as employees,
        MIN(t."createdAt") as earliest_submission,
        MAX(t."createdAt") as latest_submission,
        STRING_AGG(DISTINCT t.status, ', ') as statuses
      FROM timesheets t
      LEFT JOIN employees e ON t."employeeId" = e.id
      GROUP BY t."weekStartDate", t."weekEndDate"
      ORDER BY t."weekStartDate" DESC
      LIMIT 15
    `);
    
    if (allResult.rows.length > 0) {
      console.log('📊 All timesheet submissions by week (most recent first):');
      allResult.rows.forEach(row => {
        const startDate = new Date(row.weekStartDate).toLocaleDateString();
        const endDate = new Date(row.weekEndDate).toLocaleDateString();
        console.log(`   ${startDate} to ${endDate}: ${row.submission_count} submissions by ${row.employees || 'Unknown'} (Status: ${row.statuses})`);
      });
    } else {
      console.log('📊 No timesheet submissions found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking timesheets:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

checkTimesheets();