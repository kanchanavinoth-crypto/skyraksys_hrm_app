const { Pool } = require('pg');

const pool = new Pool({
  user: 'hrm_admin',
  host: 'localhost',
  database: 'skyraksys_hrm',
  password: 'hrm_secure_2024',
  port: 5433,
});

async function checkOctSubmissions() {
  try {
    console.log('📋 Checking Oct 5-11, 2025 timesheet submissions...\n');
    
    // Get timesheets for week starting Oct 5, 2025 (week 41)
    const timesheetsQuery = `
      SELECT 
        t.id,
        t."weekStartDate",
        t."weekEndDate", 
        t."weekNumber",
        t.year,
        t.status,
        t."totalHoursWorked",
        t."submittedAt",
        t."createdAt",
        e."firstName" || ' ' || e."lastName" as employee_name,
        p.name as project_name,
        tk.name as task_name
      FROM timesheets t
      JOIN employees e ON t."employeeId" = e.id
      LEFT JOIN projects p ON t."projectId" = p.id
      LEFT JOIN tasks tk ON t."taskId" = tk.id
      WHERE t."weekStartDate" = '2025-10-05'
        AND t."deletedAt" IS NULL
      ORDER BY t."createdAt";
    `;
    
    const result = await pool.query(timesheetsQuery);
    
    console.log(`✅ Found ${result.rows.length} timesheets for week Oct 5-11, 2025:`);
    console.log('===========================================================');
    
    if (result.rows.length === 0) {
      console.log('❌ No timesheets found for this week');
    } else {
      result.rows.forEach((ts, index) => {
        console.log(`${index + 1}. Employee: ${ts.employee_name}`);
        console.log(`   Week: ${ts.weekStartDate} to ${ts.weekEndDate} (Week ${ts.weekNumber}, ${ts.year})`);
        console.log(`   Project: ${ts.project_name}`);
        console.log(`   Task: ${ts.task_name}`);
        console.log(`   Status: ${ts.status}`);
        console.log(`   Hours: ${ts.totalHoursWorked}`);
        console.log(`   Created: ${ts.createdAt}`);
        console.log(`   Submitted: ${ts.submittedAt || 'Not submitted'}`);
        console.log('   ---');
      });
    }
    
    // Also check if there were any failed creation attempts in logs
    console.log('\n🔍 Checking for recent error logs related to timesheet creation...');
    
  } catch (error) {
    console.error('❌ Error checking Oct submissions:', error);
  } finally {
    await pool.end();
  }
}

checkOctSubmissions();