const { Pool } = require('pg');

const pool = new Pool({
  user: 'hrm_admin',
  host: 'localhost',
  database: 'skyraksys_hrm',
  password: 'hrm_secure_2024',
  port: 5433,
});

async function checkOct20Submissions() {
  try {
    console.log('📋 Checking Oct 20-26, 2025 timesheet submissions...\n');
    
    // Get timesheets for week starting Oct 20, 2025 (week 43)
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
        t."updatedAt",
        e."firstName" || ' ' || e."lastName" as employee_name,
        p.name as project_name,
        tk.name as task_name,
        t."mondayHours",
        t."tuesdayHours", 
        t."wednesdayHours",
        t."thursdayHours",
        t."fridayHours",
        t."saturdayHours",
        t."sundayHours"
      FROM timesheets t
      JOIN employees e ON t."employeeId" = e.id
      LEFT JOIN projects p ON t."projectId" = p.id
      LEFT JOIN tasks tk ON t."taskId" = tk.id
      WHERE t."weekStartDate" = '2025-10-20'
        AND t."deletedAt" IS NULL
      ORDER BY t."createdAt";
    `;
    
    const result = await pool.query(timesheetsQuery);
    
    console.log(`✅ Found ${result.rows.length} timesheets for week Oct 20-26, 2025:`);
    console.log('================================================================');
    
    if (result.rows.length === 0) {
      console.log('❌ No timesheets found for this week');
    } else {
      result.rows.forEach((ts, index) => {
        console.log(`${index + 1}. Employee: ${ts.employee_name}`);
        console.log(`   ID: ${ts.id}`);
        console.log(`   Week: ${ts.weekStartDate} to ${ts.weekEndDate} (Week ${ts.weekNumber}, ${ts.year})`);
        console.log(`   Project: ${ts.project_name}`);
        console.log(`   Task: ${ts.task_name}`);
        console.log(`   Status: ${ts.status}`);
        console.log(`   Total Hours: ${ts.totalHoursWorked}`);
        console.log(`   Daily Hours: M:${ts.mondayHours} T:${ts.tuesdayHours} W:${ts.wednesdayHours} Th:${ts.thursdayHours} F:${ts.fridayHours} Sa:${ts.saturdayHours} Su:${ts.sundayHours}`);
        console.log(`   Created: ${ts.createdAt}`);
        console.log(`   Updated: ${ts.updatedAt}`);
        console.log(`   Submitted: ${ts.submittedAt || 'Not submitted'}`);
        console.log('   ===');
      });
    }
    
    // Check for any recent timesheets that might have been created today
    console.log('\n🔍 Checking for any recent timesheet creation attempts today...');
    
    const recentQuery = `
      SELECT 
        t.id,
        t."weekStartDate",
        t.status,
        t."createdAt",
        e."firstName" || ' ' || e."lastName" as employee_name,
        p.name as project_name,
        tk.name as task_name
      FROM timesheets t
      JOIN employees e ON t."employeeId" = e.id
      LEFT JOIN projects p ON t."projectId" = p.id
      LEFT JOIN tasks tk ON t."taskId" = tk.id
      WHERE DATE(t."createdAt") = CURRENT_DATE
        AND t."deletedAt" IS NULL
      ORDER BY t."createdAt" DESC;
    `;
    
    const recentResult = await pool.query(recentQuery);
    
    console.log(`\n📅 Found ${recentResult.rows.length} timesheets created today:`);
    console.log('========================================');
    
    if (recentResult.rows.length === 0) {
      console.log('❌ No timesheets created today');
    } else {
      recentResult.rows.forEach((ts, index) => {
        console.log(`${index + 1}. ${ts.employee_name} - Week: ${ts.weekStartDate} - ${ts.project_name}/${ts.task_name} - Status: ${ts.status} - Created: ${ts.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking Oct 20 submissions:', error);
  } finally {
    await pool.end();
  }
}

checkOct20Submissions();