const { Pool } = require('pg');
const pool = new Pool({
  user: 'hrm_admin',
  host: 'localhost',
  database: 'skyraksys_hrm',
  password: 'hrm_secure_2024',
  port: 5433,
});

async function findMissingTasks() {
  try {
    console.log('🔍 Investigating your missing timesheet tasks...\n');
    
    // Check all recent submissions by the employee who submitted for Aug 4-10
    const employeeResult = await pool.query(`
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
      WHERE e."firstName" = 'John' AND e."lastName" = 'Developer'
      ORDER BY t."createdAt" DESC
      LIMIT 10
    `);
    
    console.log(`📋 Found ${employeeResult.rows.length} recent submissions by John Developer:\n`);
    
    employeeResult.rows.forEach((row, index) => {
      const startDate = new Date(row.weekStartDate).toLocaleDateString();
      const endDate = new Date(row.weekEndDate).toLocaleDateString();
      const createdDate = new Date(row.createdAt).toLocaleDateString();
      
      console.log(`📅 Submission #${index + 1}:`);
      console.log(`   Week: ${startDate} to ${endDate}`);
      console.log(`   Project: ${row.project_name || 'N/A'}`);
      console.log(`   Task: ${row.task_name || 'N/A'}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Total Hours: ${row.totalHoursWorked}`);
      console.log(`   Created: ${createdDate}`);
      console.log(`   Submitted: ${row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : 'Not submitted'}`);
      console.log('');
    });
    
    // Check for any draft or unsaved submissions
    console.log('🔍 Checking for draft or unsaved timesheets...\n');
    const draftResult = await pool.query(`
      SELECT 
        t.id,
        t."weekStartDate",
        t."weekEndDate",
        t.status,
        t."totalHoursWorked",
        t."createdAt",
        t."updatedAt",
        e."firstName" || ' ' || e."lastName" as employee_name,
        p.name as project_name,
        tk.name as task_name
      FROM timesheets t
      LEFT JOIN employees e ON t."employeeId" = e.id
      LEFT JOIN projects p ON t."projectId" = p.id
      LEFT JOIN tasks tk ON t."taskId" = tk.id
      WHERE t.status = 'Draft' 
         OR t."submittedAt" IS NULL
      ORDER BY t."createdAt" DESC
      LIMIT 10
    `);
    
    if (draftResult.rows.length > 0) {
      console.log(`📝 Found ${draftResult.rows.length} draft/unsaved timesheets:`);
      draftResult.rows.forEach((row, index) => {
        const startDate = new Date(row.weekStartDate).toLocaleDateString();
        const endDate = new Date(row.weekEndDate).toLocaleDateString();
        
        console.log(`   Draft #${index + 1}: ${row.employee_name} - ${startDate} to ${endDate} (${row.project_name}/${row.task_name}) - ${row.totalHoursWorked} hours`);
      });
    } else {
      console.log('❌ No draft timesheets found');
    }
    
    // Check for submissions made today (Sept 22, 2025)
    console.log('\n🔍 Checking for any submissions made today (Sept 22, 2025)...\n');
    const todayResult = await pool.query(`
      SELECT 
        t.id,
        t."weekStartDate",
        t."weekEndDate",
        t.status,
        t."totalHoursWorked",
        t."createdAt",
        t."submittedAt",
        e."firstName" || ' ' || e."lastName" as employee_name,
        p.name as project_name,
        tk.name as task_name
      FROM timesheets t
      LEFT JOIN employees e ON t."employeeId" = e.id
      LEFT JOIN projects p ON t."projectId" = p.id
      LEFT JOIN tasks tk ON t."taskId" = tk.id
      WHERE DATE(t."createdAt") = '2025-09-22'
         OR DATE(t."submittedAt") = '2025-09-22'
      ORDER BY t."createdAt" DESC
    `);
    
    if (todayResult.rows.length > 0) {
      console.log(`📅 Found ${todayResult.rows.length} submissions made today:`);
      todayResult.rows.forEach((row, index) => {
        const startDate = new Date(row.weekStartDate).toLocaleDateString();
        const endDate = new Date(row.weekEndDate).toLocaleDateString();
        const createdTime = new Date(row.createdAt).toLocaleTimeString();
        const submittedTime = row.submittedAt ? new Date(row.submittedAt).toLocaleTimeString() : 'Not submitted';
        
        console.log(`   Today #${index + 1}: ${row.employee_name}`);
        console.log(`      Week: ${startDate} to ${endDate}`);
        console.log(`      Project/Task: ${row.project_name}/${row.task_name}`);
        console.log(`      Status: ${row.status}`);
        console.log(`      Hours: ${row.totalHoursWorked}`);
        console.log(`      Created: ${createdTime}`);
        console.log(`      Submitted: ${submittedTime}`);
        console.log('');
      });
    } else {
      console.log('❌ No submissions made today');
    }
    
  } catch (error) {
    console.error('❌ Error investigating missing tasks:', error.message);
  } finally {
    await pool.end();
  }
}

findMissingTasks();