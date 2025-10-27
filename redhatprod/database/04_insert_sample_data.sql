-- RHEL 9.6 Production Database Sample Data Script
-- Skyraksys HRM System - Initial Data Setup
-- Run after 03_create_triggers.sql

\c skyraksys_hrm_prod;

-- ==============================================
-- SAMPLE USERS
-- ==============================================
INSERT INTO users (username, email, password, role, is_active) VALUES
('admin', 'admin@skyraksys.com', '$2b$10$rQJ8z2zWj9X8KvM2XnFv6OqO4pXf3wRb8nZv4pJmNxC5qY1tE9nF2', 'admin', true),
('hr_manager', 'hr@skyraksys.com', '$2b$10$rQJ8z2zWj9X8KvM2XnFv6OqO4pXf3wRb8nZv4pJmNxC5qY1tE9nF2', 'hr', true),
('john_doe', 'john.doe@skyraksys.com', '$2b$10$rQJ8z2zWj9X8KvM2XnFv6OqO4pXf3wRb8nZv4pJmNxC5qY1tE9nF2', 'employee', true),
('jane_smith', 'jane.smith@skyraksys.com', '$2b$10$rQJ8z2zWj9X8KvM2XnFv6OqO4pXf3wRb8nZv4pJmNxC5qY1tE9nF2', 'employee', true),
('mike_wilson', 'mike.wilson@skyraksys.com', '$2b$10$rQJ8z2zWj9X8KvM2XnFv6OqO4pXf3wRb8nZv4pJmNxC5qY1tE9nF2', 'employee', true),
('sarah_johnson', 'sarah.johnson@skyraksys.com', '$2b$10$rQJ8z2zWj9X8KvM2XnFv6OqO4pXf3wRb8nZv4pJmNxC5qY1tE9nF2', 'hr', true);

-- ==============================================
-- DEPARTMENTS
-- ==============================================
INSERT INTO departments (name, description, is_active) VALUES
('Information Technology', 'Software development and IT operations', true),
('Human Resources', 'Employee management and recruitment', true),
('Finance', 'Financial planning and accounting', true),
('Marketing', 'Product marketing and sales support', true),
('Operations', 'Business operations and project management', true);

-- ==============================================
-- POSITIONS
-- ==============================================
INSERT INTO positions (title, department_id, description, min_salary, max_salary, is_active) VALUES
('Software Developer', 1, 'Full-stack software development', 600000, 1200000, true),
('Senior Software Developer', 1, 'Senior level software development with leadership', 1000000, 1800000, true),
('DevOps Engineer', 1, 'Infrastructure and deployment automation', 800000, 1500000, true),
('HR Manager', 2, 'Human resources management and strategy', 800000, 1400000, true),
('HR Executive', 2, 'HR operations and employee relations', 400000, 800000, true),
('Finance Manager', 3, 'Financial planning and budget management', 900000, 1600000, true),
('Accountant', 3, 'Accounting and financial record keeping', 350000, 700000, true),
('Marketing Manager', 4, 'Marketing strategy and campaign management', 700000, 1300000, true),
('Project Manager', 5, 'Project planning and execution', 800000, 1500000, true);

-- ==============================================
-- EMPLOYEES
-- ==============================================
INSERT INTO employees (user_id, employee_id, first_name, last_name, email, phone, address, date_of_birth, hire_date, department, position, salary, is_active) VALUES
(1, 'EMP001', 'System', 'Administrator', 'admin@skyraksys.com', '+91-9876543210', 'Mumbai, Maharashtra', '1985-01-15', '2020-01-01', 'Information Technology', 'System Administrator', 1500000, true),
(2, 'EMP002', 'Priya', 'Sharma', 'hr@skyraksys.com', '+91-9876543211', 'Mumbai, Maharashtra', '1988-03-22', '2020-02-01', 'Human Resources', 'HR Manager', 1200000, true),
(3, 'EMP003', 'John', 'Doe', 'john.doe@skyraksys.com', '+91-9876543212', 'Pune, Maharashtra', '1990-05-10', '2021-03-15', 'Information Technology', 'Software Developer', 800000, true),
(4, 'EMP004', 'Jane', 'Smith', 'jane.smith@skyraksys.com', '+91-9876543213', 'Mumbai, Maharashtra', '1992-07-18', '2021-06-01', 'Information Technology', 'Software Developer', 750000, true),
(5, 'EMP005', 'Mike', 'Wilson', 'mike.wilson@skyraksys.com', '+91-9876543214', 'Bangalore, Karnataka', '1987-11-25', '2020-08-10', 'Information Technology', 'Senior Software Developer', 1300000, true),
(6, 'EMP006', 'Sarah', 'Johnson', 'sarah.johnson@skyraksys.com', '+91-9876543215', 'Mumbai, Maharashtra', '1989-04-12', '2021-01-20', 'Human Resources', 'HR Executive', 600000, true);

-- ==============================================
-- DEFAULT PAYSLIP TEMPLATE
-- ==============================================
INSERT INTO payslip_templates (name, template_type, description, configuration, earnings_structure, deductions_structure, is_default, is_active, created_by) VALUES
('Standard Indian Payslip', 'standard', 'Default template for Indian payroll with standard components', 
'{"company": {"name": "Skyraksys HRM", "address": "Mumbai, Maharashtra, India", "pan": "AAECS1234F", "tan": "MUMS12345A"}, "template_settings": {"show_company_logo": true, "show_employee_photo": false, "currency": "INR", "date_format": "DD/MM/YYYY"}}',
'{"basic_salary": {"label": "Basic Salary", "type": "fixed", "taxable": true, "order": 1}, "hra": {"label": "House Rent Allowance", "type": "percentage", "percentage": 40, "base": "basic_salary", "taxable": true, "order": 2}, "medical_allowance": {"label": "Medical Allowance", "type": "fixed", "amount": 1250, "taxable": false, "order": 3}, "transport_allowance": {"label": "Transport Allowance", "type": "fixed", "amount": 1600, "taxable": false, "order": 4}, "special_allowance": {"label": "Special Allowance", "type": "calculated", "taxable": true, "order": 5}, "overtime": {"label": "Overtime", "type": "variable", "taxable": true, "order": 6}, "bonus": {"label": "Bonus/Incentive", "type": "variable", "taxable": true, "order": 7}}',
'{"pf": {"label": "Provident Fund", "type": "percentage", "percentage": 12, "base": "basic_salary", "max_amount": 1800, "order": 1}, "esic": {"label": "ESIC", "type": "percentage", "percentage": 0.75, "base": "gross_salary", "applicable_if": "gross_salary <= 21000", "order": 2}, "professional_tax": {"label": "Professional Tax", "type": "slab", "slabs": [{"min": 0, "max": 5000, "amount": 0}, {"min": 5001, "max": 10000, "amount": 150}, {"min": 10001, "max": 25000, "amount": 200}, {"min": 25001, "max": 999999, "amount": 200}], "order": 3}, "income_tax": {"label": "Income Tax (TDS)", "type": "variable", "order": 4}, "loan_deduction": {"label": "Loan Deduction", "type": "variable", "order": 5}, "advance_deduction": {"label": "Advance Deduction", "type": "variable", "order": 6}}',
true, true, 1);

INSERT INTO payslip_templates (name, template_type, description, configuration, earnings_structure, deductions_structure, is_default, is_active, created_by) VALUES
('Executive Template', 'executive', 'Template for executive level employees with additional benefits', 
'{"company": {"name": "Skyraksys HRM", "address": "Mumbai, Maharashtra, India", "pan": "AAECS1234F", "tan": "MUMS12345A"}, "template_settings": {"show_company_logo": true, "show_employee_photo": true, "currency": "INR", "date_format": "DD/MM/YYYY"}}',
'{"basic_salary": {"label": "Basic Salary", "type": "fixed", "taxable": true, "order": 1}, "hra": {"label": "House Rent Allowance", "type": "percentage", "percentage": 50, "base": "basic_salary", "taxable": true, "order": 2}, "medical_allowance": {"label": "Medical Allowance", "type": "fixed", "amount": 15000, "taxable": false, "order": 3}, "transport_allowance": {"label": "Transport Allowance", "type": "fixed", "amount": 3200, "taxable": false, "order": 4}, "special_allowance": {"label": "Special Allowance", "type": "calculated", "taxable": true, "order": 5}, "management_allowance": {"label": "Management Allowance", "type": "percentage", "percentage": 20, "base": "basic_salary", "taxable": true, "order": 6}, "performance_bonus": {"label": "Performance Bonus", "type": "variable", "taxable": true, "order": 7}}',
'{"pf": {"label": "Provident Fund", "type": "percentage", "percentage": 12, "base": "basic_salary", "max_amount": 1800, "order": 1}, "esic": {"label": "ESIC", "type": "percentage", "percentage": 0.75, "base": "gross_salary", "applicable_if": "gross_salary <= 21000", "order": 2}, "professional_tax": {"label": "Professional Tax", "type": "slab", "slabs": [{"min": 0, "max": 5000, "amount": 0}, {"min": 5001, "max": 10000, "amount": 150}, {"min": 10001, "max": 25000, "amount": 200}, {"min": 25001, "max": 999999, "amount": 200}], "order": 3}, "income_tax": {"label": "Income Tax (TDS)", "type": "variable", "order": 4}, "loan_deduction": {"label": "Loan Deduction", "type": "variable", "order": 5}}',
false, true, 1);

-- ==============================================
-- SALARY STRUCTURES
-- ==============================================
INSERT INTO salary_structures (employee_id, template_id, basic_salary, hra, medical_allowance, transport_allowance, special_allowance, pf_deduction, esic_deduction, professional_tax, effective_from, is_active, created_by) VALUES
(1, 1, 60000, 24000, 1250, 1600, 20000, 1800, 0, 200, '2024-01-01', true, 1),
(2, 1, 50000, 20000, 1250, 1600, 15000, 1800, 0, 200, '2024-01-01', true, 1),
(3, 1, 35000, 14000, 1250, 1600, 8000, 4200, 449, 200, '2024-01-01', true, 1),
(4, 1, 32000, 12800, 1250, 1600, 7500, 3840, 407, 200, '2024-01-01', true, 1),
(5, 2, 55000, 27500, 15000, 3200, 25000, 1800, 0, 200, '2024-01-01', true, 1),
(6, 1, 25000, 10000, 1250, 1600, 5000, 3000, 318, 150, '2024-01-01', true, 1);

-- ==============================================
-- SAMPLE PROJECTS
-- ==============================================
INSERT INTO projects (name, description, client_name, start_date, end_date, status, project_manager_id, budget) VALUES
('HRM System Development', 'Complete HR Management System with payroll', 'Internal Project', '2024-01-01', '2024-12-31', 'active', 5, 5000000),
('E-commerce Platform', 'Full-featured e-commerce solution', 'ABC Corporation', '2024-02-01', '2024-08-31', 'active', 5, 3000000),
('Mobile Banking App', 'Secure mobile banking application', 'XYZ Bank', '2024-03-01', '2024-10-31', 'active', 1, 8000000);

-- ==============================================
-- SAMPLE TASKS
-- ==============================================
INSERT INTO tasks (project_id, title, description, assigned_to, status, priority, estimated_hours, start_date, due_date, created_by) VALUES
(1, 'Database Design', 'Design database schema for HRM system', 3, 'completed', 'high', 40, '2024-01-01', '2024-01-15', 1),
(1, 'Backend API Development', 'Develop REST APIs for all modules', 3, 'in_progress', 'high', 120, '2024-01-16', '2024-03-31', 1),
(1, 'Frontend Development', 'React frontend for HRM system', 4, 'in_progress', 'high', 100, '2024-02-01', '2024-04-30', 1),
(1, 'Payroll Module', 'Complete payroll calculation engine', 5, 'pending', 'high', 80, '2024-03-01', '2024-05-31', 1),
(2, 'Product Catalog', 'Product management system', 4, 'in_progress', 'medium', 60, '2024-02-01', '2024-04-15', 5),
(3, 'Security Implementation', 'Multi-factor authentication', 5, 'pending', 'urgent', 50, '2024-03-15', '2024-05-01', 1);

-- ==============================================
-- SAMPLE ATTENDANCE DATA (Current Month)
-- ==============================================
-- Generate attendance for current month for all employees
DO $$
DECLARE
    emp_record RECORD;
    date_record DATE;
    current_month_start DATE;
    current_month_end DATE;
    random_status VARCHAR(20);
    random_checkin TIME;
    random_checkout TIME;
BEGIN
    current_month_start := DATE_TRUNC('month', CURRENT_DATE);
    current_month_end := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
    
    FOR emp_record IN SELECT id FROM employees WHERE is_active = true LOOP
        FOR date_record IN SELECT generate_series(current_month_start, LEAST(current_month_end, CURRENT_DATE), '1 day'::interval)::date LOOP
            -- Skip weekends (assuming Saturday=6, Sunday=0)
            IF EXTRACT(DOW FROM date_record) NOT IN (0, 6) THEN
                -- Generate random attendance pattern
                IF random() < 0.95 THEN  -- 95% attendance rate
                    random_status := 'present';
                    random_checkin := ('09:00:00'::time + (random() * interval '2 hours'))::time;
                    random_checkout := ('17:30:00'::time + (random() * interval '2 hours'))::time;
                ELSE
                    random_status := 'absent';
                    random_checkin := NULL;
                    random_checkout := NULL;
                END IF;
                
                INSERT INTO attendance (employee_id, date, check_in, check_out, status)
                VALUES (
                    emp_record.id,
                    date_record,
                    CASE WHEN random_checkin IS NOT NULL THEN date_record + random_checkin ELSE NULL END,
                    CASE WHEN random_checkout IS NOT NULL THEN date_record + random_checkout ELSE NULL END,
                    random_status
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ==============================================
-- SAMPLE PAYROLL DATA (Previous Month)
-- ==============================================
INSERT INTO payroll_data (employee_id, pay_period, month, year, earnings_data, deductions_data, attendance_data, created_by) VALUES
(1, '2024-01-31', 1, 2024, 
'{"basic_salary": 60000, "hra": 24000, "medical_allowance": 1250, "transport_allowance": 1600, "special_allowance": 20000, "overtime": 0, "bonus": 5000}',
'{"pf": 1800, "esic": 0, "professional_tax": 200, "income_tax": 8000, "loan_deduction": 0, "advance_deduction": 0}',
'{"total_working_days": 22, "present_days": 22, "lop_days": 0, "overtime_hours": 0}', 1),

(2, '2024-01-31', 1, 2024,
'{"basic_salary": 50000, "hra": 20000, "medical_allowance": 1250, "transport_allowance": 1600, "special_allowance": 15000, "overtime": 0, "bonus": 3000}',
'{"pf": 1800, "esic": 0, "professional_tax": 200, "income_tax": 6500, "loan_deduction": 0, "advance_deduction": 0}',
'{"total_working_days": 22, "present_days": 22, "lop_days": 0, "overtime_hours": 0}', 1),

(3, '2024-01-31', 1, 2024,
'{"basic_salary": 35000, "hra": 14000, "medical_allowance": 1250, "transport_allowance": 1600, "special_allowance": 8000, "overtime": 2500, "bonus": 1000}',
'{"pf": 4200, "esic": 449, "professional_tax": 200, "income_tax": 2500, "loan_deduction": 0, "advance_deduction": 0}',
'{"total_working_days": 22, "present_days": 21, "lop_days": 1, "overtime_hours": 10}', 1),

(4, '2024-01-31', 1, 2024,
'{"basic_salary": 32000, "hra": 12800, "medical_allowance": 1250, "transport_allowance": 1600, "special_allowance": 7500, "overtime": 1800, "bonus": 500}',
'{"pf": 3840, "esic": 407, "professional_tax": 200, "income_tax": 2200, "loan_deduction": 0, "advance_deduction": 0}',
'{"total_working_days": 22, "present_days": 20, "lop_days": 2, "overtime_hours": 8}', 1),

(5, '2024-01-31', 1, 2024,
'{"basic_salary": 55000, "hra": 27500, "medical_allowance": 15000, "transport_allowance": 3200, "special_allowance": 25000, "management_allowance": 11000, "performance_bonus": 8000}',
'{"pf": 1800, "esic": 0, "professional_tax": 200, "income_tax": 12000, "loan_deduction": 0, "advance_deduction": 0}',
'{"total_working_days": 22, "present_days": 22, "lop_days": 0, "overtime_hours": 0}', 1),

(6, '2024-01-31', 1, 2024,
'{"basic_salary": 25000, "hra": 10000, "medical_allowance": 1250, "transport_allowance": 1600, "special_allowance": 5000, "overtime": 0, "bonus": 1500}',
'{"pf": 3000, "esic": 318, "professional_tax": 150, "income_tax": 1000, "loan_deduction": 0, "advance_deduction": 0}',
'{"total_working_days": 22, "present_days": 21, "lop_days": 1, "overtime_hours": 0}', 1);

-- ==============================================
-- SAMPLE PAYSLIPS
-- ==============================================
-- Generate payslips based on the payroll data above
INSERT INTO payslips (employee_id, template_id, payroll_data_id, pay_period, month, year, earnings, deductions, attendance, gross_earnings, total_deductions, net_pay, net_pay_in_words, status, generated_at, created_by) VALUES

-- Payslip for EMP005 (Mike Wilson - Senior Software Developer)
(5, 1, 5, '2024-01-31', 1, 2024,
'{"basic_salary": 55000, "hra": 27500, "medical_allowance": 15000, "transport_allowance": 3200, "special_allowance": 25000, "management_allowance": 11000, "performance_bonus": 8000}',
'{"pf": 1800, "esic": 0, "professional_tax": 200, "income_tax": 12000, "loan_deduction": 0, "advance_deduction": 0}',
'{"total_working_days": 22, "present_days": 22, "lop_days": 0, "overtime_hours": 0}',
144700.00, 14000.00, 130700.00, 
'One Lakh Thirty Thousand Seven Hundred Rupees Only', 
'approved', '2024-02-01 10:00:00', 1),

-- Payslip for EMP003 (John Doe - Software Developer)
(3, 1, 3, '2024-01-31', 1, 2024,
'{"basic_salary": 35000, "hra": 14000, "medical_allowance": 1250, "transport_allowance": 1600, "special_allowance": 8000, "overtime": 2500, "bonus": 1000}',
'{"pf": 4200, "esic": 449, "professional_tax": 200, "income_tax": 2500, "loan_deduction": 0, "advance_deduction": 0}',
'{"total_working_days": 22, "present_days": 21, "lop_days": 1, "overtime_hours": 10}',
63350.00, 7349.00, 56001.00,
'Fifty Six Thousand One Rupees Only',
'approved', '2024-02-01 10:15:00', 1),

-- Payslip for EMP004 (Jane Smith - Software Developer)
(4, 1, 4, '2024-01-31', 1, 2024,
'{"basic_salary": 32000, "hra": 12800, "medical_allowance": 1250, "transport_allowance": 1600, "special_allowance": 7500, "overtime": 1800, "bonus": 500}',
'{"pf": 3840, "esic": 407, "professional_tax": 200, "income_tax": 2200, "loan_deduction": 0, "advance_deduction": 0}',
'{"total_working_days": 22, "present_days": 20, "lop_days": 2, "overtime_hours": 8}',
57450.00, 6647.00, 50803.00,
'Fifty Thousand Eight Hundred Three Rupees Only',
'approved', '2024-02-01 10:30:00', 1);

-- ==============================================
-- UPDATE SEQUENCES TO PROPER VALUES
-- ==============================================
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));
SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));
SELECT setval('positions_id_seq', (SELECT MAX(id) FROM positions));
SELECT setval('payslip_templates_id_seq', (SELECT MAX(id) FROM payslip_templates));
SELECT setval('salary_structures_id_seq', (SELECT MAX(id) FROM salary_structures));
SELECT setval('payroll_data_id_seq', (SELECT MAX(id) FROM payroll_data));
SELECT setval('payslips_id_seq', (SELECT MAX(id) FROM payslips));
SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));
SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));

-- ==============================================
-- VERIFY DATA INSERTION
-- ==============================================
\echo '=== DATA VERIFICATION ==='
\echo 'Users count:'
SELECT COUNT(*) FROM users;
\echo 'Employees count:'
SELECT COUNT(*) FROM employees;
\echo 'Departments count:'
SELECT COUNT(*) FROM departments;
\echo 'Payslip Templates count:'
SELECT COUNT(*) FROM payslip_templates;
\echo 'Salary Structures count:'
SELECT COUNT(*) FROM salary_structures;
\echo 'Projects count:'
SELECT COUNT(*) FROM projects;
\echo 'Tasks count:'
SELECT COUNT(*) FROM tasks;
\echo 'Attendance records count:'
SELECT COUNT(*) FROM attendance;
\echo 'Payroll data count:'
SELECT COUNT(*) FROM payroll_data;
\echo 'Payslips count:'
SELECT COUNT(*) FROM payslips;

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================
\echo 'Sample data inserted successfully!'
\echo 'Default admin credentials:'
\echo 'Username: admin'
\echo 'Password: password123'
\echo ''
\echo 'HR Manager credentials:'
\echo 'Username: hr_manager'
\echo 'Password: password123'
\echo ''
\echo 'Database setup complete!'
\echo 'Next step: Configure application environment variables'