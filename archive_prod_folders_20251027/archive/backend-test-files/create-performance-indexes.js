const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'skyraksys_hrm',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

const createPerformanceIndexes = async () => {
  console.log('🚀 Creating performance indexes for HRM system...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    const indexes = [
      // Employee table indexes
      'CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(departmentId) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_employees_position_id ON employees(positionId) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(managerId) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employeeId) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(userId) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hireDate) WHERE "deletedAt" IS NULL',
      
      // Timesheet indexes
      'CREATE INDEX IF NOT EXISTS idx_timesheets_employee_id ON timesheets(employeeId) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_timesheets_project_id ON timesheets(projectId) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_timesheets_work_date ON timesheets(workDate) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status) WHERE "deletedAt" IS NULL',
      
      // Leave requests indexes
      'CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employeeId) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type_id ON leave_requests(leaveTypeId) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON leave_requests(startDate) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status) WHERE "deletedAt" IS NULL',
      
      // Payroll indexes
      'CREATE INDEX IF NOT EXISTS idx_payrolls_employee_id ON payrolls(employeeId) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_payrolls_month_year ON payrolls(month, year) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_payrolls_status ON payrolls(status) WHERE "deletedAt" IS NULL',
      
      // Users table indexes
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(isActive) WHERE "deletedAt" IS NULL',
      
      // Departments and Positions indexes
      'CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(isActive)',
      'CREATE INDEX IF NOT EXISTS idx_positions_is_active ON positions(isActive)',
      'CREATE INDEX IF NOT EXISTS idx_positions_department_id ON positions(departmentId)',
      
      // Projects and Tasks indexes
      'CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(isActive)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(projectId)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(isActive)',
      
      // Composite indexes for common queries
      'CREATE INDEX IF NOT EXISTS idx_employees_dept_pos ON employees(departmentId, positionId) WHERE "deletedAt" IS NULL',
      'CREATE INDEX IF NOT EXISTS idx_timesheets_emp_date ON timesheets(employeeId, workDate) WHERE "deletedAt" IS NULL'
    ];

    console.log(`📊 Creating ${indexes.length} performance indexes...`);
    
    for (let i = 0; i < indexes.length; i++) {
      const indexSQL = indexes[i];
      try {
        await sequelize.query(indexSQL);
        console.log(`✅ Index ${i + 1}/${indexes.length}: ${indexSQL.match(/idx_\w+/)[0]} created successfully`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Index ${i + 1}/${indexes.length}: ${indexSQL.match(/idx_\w+/)[0]} already exists`);
        } else {
          console.error(`❌ Failed to create index ${i + 1}/${indexes.length}:`, error.message);
        }
      }
    }

    console.log('🎉 Performance indexes creation completed!');
    console.log('📈 Database performance should be significantly improved for queries involving:');
    console.log('   - Employee lookups by department, position, manager');
    console.log('   - Timesheet queries by employee and date');
    console.log('   - Leave request filtering by employee and status');
    console.log('   - Payroll queries by employee and period');
    console.log('   - User authentication and role-based queries');

  } catch (error) {
    console.error('❌ Error creating performance indexes:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the script
createPerformanceIndexes();
