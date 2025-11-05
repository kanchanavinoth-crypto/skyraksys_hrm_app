/**
 * Add Performance Indexes
 * 
 * This migration adds indexes for frequently queried columns to improve performance
 * Created: October 27, 2025
 * 
 * Note: Using camelCase column names to match Sequelize model definitions
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Adding performance indexes...');

    try {
      // Timesheets indexes (using camelCase)
      await queryInterface.addIndex('timesheets', ['employeeId', 'weekStartDate'], {
        name: 'idx_timesheets_employee_week',
        concurrently: true
      });
      console.log('✅ Added idx_timesheets_employee_week');

      await queryInterface.addIndex('timesheets', ['status'], {
        name: 'idx_timesheets_status',
        concurrently: true
      });
      console.log('✅ Added idx_timesheets_status');

      await queryInterface.addIndex('timesheets', ['projectId'], {
        name: 'idx_timesheets_project',
        concurrently: true
      });
      console.log('✅ Added idx_timesheets_project');

      // Leave requests indexes
      await queryInterface.addIndex('leave_requests', ['employeeId', 'status'], {
        name: 'idx_leave_requests_employee_status',
        concurrently: true
      });
      console.log('✅ Added idx_leave_requests_employee_status');

      await queryInterface.addIndex('leave_requests', ['startDate', 'endDate'], {
        name: 'idx_leave_requests_dates',
        concurrently: true
      });
      console.log('✅ Added idx_leave_requests_dates');

      await queryInterface.addIndex('leave_requests', ['leaveTypeId'], {
        name: 'idx_leave_requests_type',
        concurrently: true
      });
      console.log('✅ Added idx_leave_requests_type');

      // Payrolls indexes
      await queryInterface.addIndex('payrolls', ['employeeId', 'payPeriodStart', 'payPeriodEnd'], {
        name: 'idx_payrolls_employee_period',
        concurrently: true
      });
      console.log('✅ Added idx_payrolls_employee_period');

      await queryInterface.addIndex('payrolls', ['status'], {
        name: 'idx_payrolls_status',
        concurrently: true
      });
      console.log('✅ Added idx_payrolls_status');

      // Audit logs indexes (only if table exists)
      const tables = await queryInterface.showAllTables();
      if (tables.includes('audit_logs')) {
        await queryInterface.addIndex('audit_logs', ['userId', 'action', 'createdAt'], {
          name: 'idx_audit_logs_user_action',
          concurrently: true
        });
        console.log('✅ Added idx_audit_logs_user_action');

        await queryInterface.addIndex('audit_logs', ['tableName', 'recordId'], {
          name: 'idx_audit_logs_resource',
          concurrently: true
        });
        console.log('✅ Added idx_audit_logs_resource');
      } else {
        console.log('⏭️  audit_logs table does not exist, skipping indexes');
      }

      // Employees composite index for common queries
      await queryInterface.addIndex('employees', ['departmentId', 'positionId'], {
        name: 'idx_employees_dept_position',
        concurrently: true,
        where: {
          status: 'Active'
        }
      });
      console.log('✅ Added idx_employees_dept_position');

      await queryInterface.addIndex('employees', ['status'], {
        name: 'idx_employees_status',
        concurrently: true
      });
      console.log('✅ Added idx_employees_status');

      // Leave balances indexes
      await queryInterface.addIndex('leave_balances', ['employeeId', 'leaveTypeId', 'year'], {
        name: 'idx_leave_balances_employee_type_year',
        concurrently: true
      });
      console.log('✅ Added idx_leave_balances_employee_type_year');

      console.log('🎉 All performance indexes added successfully!');
    } catch (error) {
      console.error('❌ Error adding indexes:', error.message);
      // If index already exists, that's okay
      if (error.message && error.message.includes('already exists')) {
        console.log('ℹ️  Some indexes may already exist - continuing...');
      } else {
        throw error;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Removing performance indexes...');

    try {
      // Check which tables exist before removing indexes
      const tables = await queryInterface.showAllTables();
      
      // Remove all indexes in reverse order
      if (tables.includes('leave_balances')) {
        await queryInterface.removeIndex('leave_balances', 'idx_leave_balances_employee_type_year');
      }
      if (tables.includes('employees')) {
        await queryInterface.removeIndex('employees', 'idx_employees_status');
        await queryInterface.removeIndex('employees', 'idx_employees_dept_position');
      }
      if (tables.includes('audit_logs')) {
        await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_resource');
        await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_user_action');
      }
      if (tables.includes('payrolls')) {
        await queryInterface.removeIndex('payrolls', 'idx_payrolls_status');
        await queryInterface.removeIndex('payrolls', 'idx_payrolls_employee_period');
      }
      if (tables.includes('leave_requests')) {
        await queryInterface.removeIndex('leave_requests', 'idx_leave_requests_type');
        await queryInterface.removeIndex('leave_requests', 'idx_leave_requests_dates');
        await queryInterface.removeIndex('leave_requests', 'idx_leave_requests_employee_status');
      }
      if (tables.includes('timesheets')) {
        await queryInterface.removeIndex('timesheets', 'idx_timesheets_project');
        await queryInterface.removeIndex('timesheets', 'idx_timesheets_status');
        await queryInterface.removeIndex('timesheets', 'idx_timesheets_employee_week');
      }

      console.log('✅ All performance indexes removed');
    } catch (error) {
      console.error('❌ Error removing indexes:', error.message);
      throw error;
    }
  }
};
