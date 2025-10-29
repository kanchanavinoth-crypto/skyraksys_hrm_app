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
    
    // Check for any multiple task submissions on the same day
    console.log('🔍 Checking for any multiple task submissions for Aug 4-10, 2025...\n');
    const multipleTasksResult = await pool.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(DISTINCT t."taskId") as unique_tasks,
        COUNT(DISTINCT t."projectId") as unique_projects,
        STRING_AGG(DISTINCT (tk.name), ', ') as task_names,
        STRING_AGG(DISTINCT (p.name), ', ') as project_names
      FROM timesheets t
      LEFT JOIN employees e ON t."employeeId" = e.id
      LEFT JOIN projects p ON t."projectId" = p.id
      LEFT JOIN tasks tk ON t."taskId" = tk.id
      WHERE t."weekStartDate" = '2025-08-04'
        AND t."weekEndDate" = '2025-08-10'
    `);
    
    if (multipleTasksResult.rows.length > 0) {
      const stats = multipleTasksResult.rows[0];
      console.log(`📊 Summary for Aug 4-10, 2025:`);
      console.log(`   Total submissions: ${stats.total_submissions}`);
      console.log(`   Unique tasks: ${stats.unique_tasks}`);
      console.log(`   Unique projects: ${stats.unique_projects}`);
      console.log(`   Task names: ${stats.task_names || 'None'}`);
      console.log(`   Project names: ${stats.project_names || 'None'}`);
      
      if (parseInt(stats.total_submissions) > 1) {
        console.log(`\n✅ You did submit multiple tasks! Found ${stats.total_submissions} submissions for that week.`);
      } else {
        console.log(`\n⚠️  Only 1 submission found for that week.`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking timesheets:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

checkTimesheets();