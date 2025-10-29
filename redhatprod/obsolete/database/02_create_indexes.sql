-- RHEL 9.6 Production Database Indexes Script
-- Skyraksys HRM System - Performance Optimization Indexes
-- Run after 01_create_schema.sql

\c skyraksys_hrm_prod;

-- ==============================================
-- USERS TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ==============================================
-- EMPLOYEES TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_position ON employees(position);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_name ON employees(first_name, last_name);

-- ==============================================
-- DEPARTMENTS TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_head_id ON departments(head_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_active ON departments(is_active);

-- ==============================================
-- POSITIONS TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_title ON positions(title);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_department_id ON positions(department_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_active ON positions(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_salary_range ON positions(min_salary, max_salary);

-- ==============================================
-- PAYSLIP TEMPLATES TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslip_templates_name ON payslip_templates(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslip_templates_type ON payslip_templates(template_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslip_templates_default ON payslip_templates(is_default);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslip_templates_active ON payslip_templates(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslip_templates_created_by ON payslip_templates(created_by);

-- ==============================================
-- SALARY STRUCTURES TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_structures_employee_id ON salary_structures(employee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_structures_template_id ON salary_structures(template_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_structures_effective_from ON salary_structures(effective_from);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_structures_effective_to ON salary_structures(effective_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_structures_active ON salary_structures(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_structures_employee_active ON salary_structures(employee_id, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_structures_effective_period ON salary_structures(employee_id, effective_from, effective_to);

-- ==============================================
-- PAYROLL DATA TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_data_employee_id ON payroll_data(employee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_data_pay_period ON payroll_data(pay_period);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_data_month_year ON payroll_data(month, year);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_data_employee_month_year ON payroll_data(employee_id, month, year);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_data_created_by ON payroll_data(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_data_created_at ON payroll_data(created_at);

-- ==============================================
-- PAYSLIPS TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_template_id ON payslips(template_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_payroll_data_id ON payslips(payroll_data_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_pay_period ON payslips(pay_period);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_month_year ON payslips(month, year);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_employee_month_year ON payslips(employee_id, month, year);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_status ON payslips(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_locked ON payslips(is_locked);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_created_by ON payslips(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_approved_by ON payslips(approved_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_generated_at ON payslips(generated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_approved_at ON payslips(approved_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_net_pay ON payslips(net_pay);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_employee_status ON payslips(employee_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_status_period ON payslips(status, month, year);

-- ==============================================
-- ATTENDANCE TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_month_year ON attendance(EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_employee_month_year ON attendance(employee_id, EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date));

-- ==============================================
-- LEAVES TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaves_start_date ON leaves(start_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaves_end_date ON leaves(end_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaves_status ON leaves(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaves_type ON leaves(leave_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaves_approved_by ON leaves(approved_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaves_employee_status ON leaves(employee_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaves_date_range ON leaves(start_date, end_date);

-- ==============================================
-- PROJECTS TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_client ON projects(client_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_manager_id ON projects(project_manager_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_end_date ON projects(end_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_date_range ON projects(start_date, end_date);

-- ==============================================
-- TASKS TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assignee_status ON tasks(assigned_to, status);

-- ==============================================
-- TIMESHEETS TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_employee_id ON timesheets(employee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_project_id ON timesheets(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_task_id ON timesheets(task_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_date ON timesheets(date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_status ON timesheets(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_approved_by ON timesheets(approved_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_employee_date ON timesheets(employee_id, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_employee_status ON timesheets(employee_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_project_date ON timesheets(project_id, date);

-- ==============================================
-- AUDIT LOGS TABLE INDEXES
-- ==============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- ==============================================
-- FUNCTIONAL INDEXES FOR JSON COLUMNS
-- ==============================================
-- Payslip Templates Configuration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslip_templates_config_gin ON payslip_templates USING GIN (configuration);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslip_templates_earnings_gin ON payslip_templates USING GIN (earnings_structure);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslip_templates_deductions_gin ON payslip_templates USING GIN (deductions_structure);

-- Salary Structures JSON columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_structures_allowances_gin ON salary_structures USING GIN (other_allowances);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_structures_deductions_gin ON salary_structures USING GIN (other_deductions);

-- Payroll Data JSON columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_data_earnings_gin ON payroll_data USING GIN (earnings_data);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_data_deductions_gin ON payroll_data USING GIN (deductions_data);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_data_attendance_gin ON payroll_data USING GIN (attendance_data);

-- Payslips JSON columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_earnings_gin ON payslips USING GIN (earnings);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_deductions_gin ON payslips USING GIN (deductions);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_attendance_gin ON payslips USING GIN (attendance);

-- ==============================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- ==============================================
-- Active records only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_only ON users(id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_active_only ON employees(id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_active_only ON departments(id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_positions_active_only ON positions(id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslip_templates_active_only ON payslip_templates(id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_structures_active_only ON salary_structures(id) WHERE is_active = true;

-- Default templates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslip_templates_default_only ON payslip_templates(id) WHERE is_default = true;

-- Non-locked payslips
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_unlocked ON payslips(id) WHERE is_locked = false;

-- Pending approvals
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_pending_approval ON payslips(id) WHERE status = 'draft';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaves_pending_approval ON leaves(id) WHERE status = 'pending';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timesheets_pending_approval ON timesheets(id) WHERE status = 'submitted';

-- Current month/year data (useful for payroll processing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payslips_current_month ON payslips(employee_id, id) 
    WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE);

-- ==============================================
-- ANALYZE TABLES FOR STATISTICS
-- ==============================================
ANALYZE users;
ANALYZE employees;
ANALYZE departments;
ANALYZE positions;
ANALYZE payslip_templates;
ANALYZE salary_structures;
ANALYZE payroll_data;
ANALYZE payslips;
ANALYZE attendance;
ANALYZE leaves;
ANALYZE projects;
ANALYZE tasks;
ANALYZE timesheets;
ANALYZE audit_logs;

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================
\echo 'Database indexes created successfully!'
\echo 'Next step: Run 03_create_triggers.sql'