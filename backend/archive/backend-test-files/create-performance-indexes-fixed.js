const { Pool } = require('pg');

// PostgreSQL connection configuration (using actual DB settings)
const pool = new Pool({
  user: 'hrm_admin',
  host: '127.0.0.1',
  database: 'skyraksys_hrm_dev',
  password: process.env.DB_PASSWORD || 'hrm_password_2025',
  port: 5433,
});

const performanceIndexes = [
  // Employee indexes - using actual column names
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_status ON employees(status);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_email ON employees(email);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_hire_date ON employees("hireDate");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_department ON employees("departmentId");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_manager ON employees("managerId");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_active_status ON employees(status) WHERE status = \'active\';',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_work_location ON employees("workLocation");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_employment_type ON employees("employmentType");',
  
  // User indexes
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users("isActive");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users("lastLoginAt");',
  
  // Timesheet indexes
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_employee ON timesheets("employeeId");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_work_date ON timesheets("workDate");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_status ON timesheets(status);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_submitted ON timesheets("submittedAt");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_approved ON timesheets("approvedAt");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_employee_date ON timesheets("employeeId", "workDate");',
  
  // Leave request indexes
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_employee ON leave_requests("employeeId");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_start_date ON leave_requests("startDate");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_leave_type ON leave_requests("leaveTypeId");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_approver ON leave_requests("approvedBy");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_requests_date_range ON leave_requests("startDate", "endDate");',
  
  // Payroll indexes
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payrolls_employee ON payrolls("employeeId");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payrolls_period ON payrolls("payPeriodStart", "payPeriodEnd");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payrolls_month_year ON payrolls(month, year);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payrolls_status ON payrolls(status);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payrolls_processed ON payrolls("processedAt");',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payrolls_paid ON payrolls("paidAt");',
  
  // Composite indexes for common queries
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_dept_status ON employees("departmentId", status);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_emp_period ON timesheets("employeeId", "workDate", status);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_emp_status_dates ON leave_requests("employeeId", status, "startDate", "endDate");'
];

async function createPerformanceIndexes() {
  try {
    console.log('🚀 Starting performance index creation...');
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connection established');
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const indexSQL of performanceIndexes) {
      try {
        console.log(`Creating index: ${indexSQL.substring(0, 80)}...`);
        await pool.query(indexSQL);
        created++;
        console.log('✅ Index created successfully');
      } catch (error) {
        if (error.code === '42P07') {
          // Index already exists
          skipped++;
          console.log('⚠️ Index already exists, skipping');
        } else {
          errors++;
          console.error(`❌ Error creating index: ${error.message}`);
          console.error(`SQL: ${indexSQL}`);
        }
      }
    }
    
    console.log('\n📊 Performance Index Creation Summary:');
    console.log(`✅ Created: ${created}`);
    console.log(`⚠️ Skipped (already exist): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📈 Total indexes processed: ${performanceIndexes.length}`);
    
    // Check existing indexes
    const result = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND (tablename IN ('employees', 'users', 'timesheets', 'leave_requests', 'payrolls'))
      ORDER BY tablename, indexname;
    `);
    
    console.log('\n📋 Current Indexes:');
    result.rows.forEach(row => {
      console.log(`${row.tablename}.${row.indexname}: ${row.indexdef.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
createPerformanceIndexes().catch(console.error);
