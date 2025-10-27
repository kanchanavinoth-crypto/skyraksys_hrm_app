-- Database Performance Indexes for HRM System
-- This script adds essential indexes to improve query performance
-- Run this script after backing up your database

-- Employee table indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(departmentId) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_position_id ON employees(positionId) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(managerId) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employeeId) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(userId) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hireDate) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON employees(employmentType) WHERE deletedAt IS NULL;

-- Timesheet indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_id ON timesheets(employeeId) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_timesheets_project_id ON timesheets(projectId) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_timesheets_task_id ON timesheets(taskId) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_timesheets_work_date ON timesheets(workDate) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_timesheets_approved_by ON timesheets(approvedBy) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_timesheets_work_date_employee ON timesheets(workDate, employeeId) WHERE deletedAt IS NULL;

-- Leave requests indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employeeId) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type_id ON leave_requests(leaveTypeId) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON leave_requests(startDate) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_leave_requests_end_date ON leave_requests(endDate) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_leave_requests_approved_by ON leave_requests(approvedBy) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_leave_requests_date_range ON leave_requests(startDate, endDate) WHERE deletedAt IS NULL;

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payrolls_employee_id ON payrolls(employeeId) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_payrolls_month_year ON payrolls(month, year) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_payrolls_status ON payrolls(status) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_payrolls_processed_by ON payrolls(processedBy) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_payrolls_pay_period ON payrolls(payPeriodStart, payPeriodEnd) WHERE deletedAt IS NULL;

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(isActive) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(lastLoginAt) WHERE deletedAt IS NULL;

-- Departments and Positions indexes
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(isActive);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_positions_is_active ON positions(isActive);
CREATE INDEX IF NOT EXISTS idx_positions_title ON positions(title);
CREATE INDEX IF NOT EXISTS idx_positions_department_id ON positions(departmentId);

-- Projects and Tasks indexes
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(isActive);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(managerId);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(startDate);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(endDate);

CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(isActive);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(projectId);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assignedTo);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Leave types and balances indexes
CREATE INDEX IF NOT EXISTS idx_leave_types_is_active ON leave_types(isActive);
CREATE INDEX IF NOT EXISTS idx_leave_types_name ON leave_types(name);

CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_id ON leave_balances(employeeId);
CREATE INDEX IF NOT EXISTS idx_leave_balances_leave_type_id ON leave_balances(leaveTypeId);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON leave_balances(year);

-- Salary structures indexes
CREATE INDEX IF NOT EXISTS idx_salary_structures_employee_id ON salary_structures(employeeId);
CREATE INDEX IF NOT EXISTS idx_salary_structures_is_active ON salary_structures(isActive);
CREATE INDEX IF NOT EXISTS idx_salary_structures_effective_from ON salary_structures(effectiveFrom);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_employees_dept_pos ON employees(departmentId, positionId) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_timesheets_emp_date ON timesheets(employeeId, workDate) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_leave_requests_emp_status ON leave_requests(employeeId, status) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_payrolls_emp_period ON payrolls(employeeId, year, month) WHERE deletedAt IS NULL;

-- Full text search indexes (PostgreSQL specific)
-- Uncomment if using PostgreSQL and need full-text search capabilities
-- CREATE INDEX IF NOT EXISTS idx_employees_fulltext ON employees USING gin(to_tsvector('english', firstName || ' ' || lastName || ' ' || email));
-- CREATE INDEX IF NOT EXISTS idx_projects_fulltext ON projects USING gin(to_tsvector('english', name || ' ' || description));

-- Performance monitoring indexes
CREATE INDEX IF NOT EXISTS idx_employees_created_at ON employees(createdAt) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_timesheets_created_at ON timesheets(createdAt) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_leave_requests_created_at ON leave_requests(createdAt) WHERE deletedAt IS NULL;
CREATE INDEX IF NOT EXISTS idx_payrolls_created_at ON payrolls(createdAt) WHERE deletedAt IS NULL;

-- Print completion message
-- SELECT 'Database performance indexes created successfully!' as status;
