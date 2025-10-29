#!/bin/bash

# ============================================
# Test Data Creation Script (Unix/Linux)
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

echo ""
log $CYAN "[Test Data] Creating comprehensive test data for SkyRakSys HRM..."

# Load environment variables
if [[ -f "../backend/.env" ]]; then
    source ../backend/.env
elif [[ -f ".env" ]]; then
    source .env
else
    log $YELLOW "⚠️  Environment file not found. Using default values."
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_NAME=${DB_NAME:-skyraksys_hrm}
    DB_USER=${DB_USER:-postgres}
fi

# Prompt for database password if not set
if [[ -z "$DB_PASSWORD" ]]; then
    echo -n "Enter PostgreSQL password for user $DB_USER: "
    read -s DB_PASSWORD
    echo ""
fi

# Test database connection
log $YELLOW "Testing database connection..."
export PGPASSWORD="$DB_PASSWORD"

if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    log $RED "❌ Failed to connect to database"
    exit 1
fi

log $GREEN "✅ Database connection successful"

# Ask user for confirmation
echo ""
log $YELLOW "This will create comprehensive test data including:"
log $YELLOW "  - 25+ test employees across all departments"
log $YELLOW "  - Multiple projects and tasks"
log $YELLOW "  - Attendance records for the last 3 months"
log $YELLOW "  - Leave requests and payroll records"
log $YELLOW "  - Performance reviews"
echo ""
read -p "Do you want to proceed? (y/N): " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    log $YELLOW "Operation cancelled by user"
    exit 0
fi

# Create test data script
log $YELLOW "Creating comprehensive test data..."

cat > /tmp/test_data.sql << 'EOF'
-- =====================================================
-- SkyRakSys HRM Comprehensive Test Data
-- =====================================================

-- Create test users and employees
DO $$
DECLARE
    dept_it UUID;
    dept_hr UUID;
    dept_finance UUID;
    dept_operations UUID;
    dept_sales UUID;
    dept_marketing UUID;
    dept_support UUID;
    dept_rd UUID;
    admin_emp_id UUID;
    user_counter INTEGER := 4; -- Starting after initial users
    emp_counter INTEGER := 4;  -- Starting after initial employees
    temp_user_id UUID;
    temp_emp_id UUID;
    start_date DATE;
    end_date DATE;
    i INTEGER;
BEGIN
    -- Get department IDs
    SELECT id INTO dept_it FROM departments WHERE name = 'Information Technology';
    SELECT id INTO dept_hr FROM departments WHERE name = 'Human Resources';
    SELECT id INTO dept_finance FROM departments WHERE name = 'Finance';
    SELECT id INTO dept_operations FROM departments WHERE name = 'Operations';
    SELECT id INTO dept_sales FROM departments WHERE name = 'Sales';
    SELECT id INTO dept_marketing FROM departments WHERE name = 'Marketing';
    SELECT id INTO dept_support FROM departments WHERE name = 'Customer Support';
    SELECT id INTO dept_rd FROM departments WHERE name = 'Research & Development';
    
    -- Get admin employee ID for manager references
    SELECT id INTO admin_emp_id FROM employees WHERE employee_id = 'EMP001';

    -- IT Department Employees
    -- Software Engineers
    INSERT INTO users (id, email, password, role, is_active, email_verified) VALUES
    (uuid_generate_v4(), 'john.doe@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true),
    (uuid_generate_v4(), 'jane.smith@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true),
    (uuid_generate_v4(), 'mike.johnson@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true),
    (uuid_generate_v4(), 'sarah.wilson@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true),
    (uuid_generate_v4(), 'alex.brown@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'manager', true, true)
    ON CONFLICT (email) DO NOTHING;

    -- Create IT employees
    INSERT INTO employees (user_id, employee_id, first_name, last_name, email, phone, hire_date, department, position, salary, manager_id, status) VALUES
    ((SELECT id FROM users WHERE email = 'john.doe@skyraksys.com'), 'EMP004', 'John', 'Doe', 'john.doe@skyraksys.com', '+1-555-0104', CURRENT_DATE - INTERVAL '2 years', 'Information Technology', 'Senior Software Engineer', 110000.00, admin_emp_id, 'active'),
    ((SELECT id FROM users WHERE email = 'jane.smith@skyraksys.com'), 'EMP005', 'Jane', 'Smith', 'jane.smith@skyraksys.com', '+1-555-0105', CURRENT_DATE - INTERVAL '18 months', 'Information Technology', 'Software Engineer', 85000.00, admin_emp_id, 'active'),
    ((SELECT id FROM users WHERE email = 'mike.johnson@skyraksys.com'), 'EMP006', 'Mike', 'Johnson', 'mike.johnson@skyraksys.com', '+1-555-0106', CURRENT_DATE - INTERVAL '1 year', 'Information Technology', 'DevOps Engineer', 100000.00, admin_emp_id, 'active'),
    ((SELECT id FROM users WHERE email = 'sarah.wilson@skyraksys.com'), 'EMP007', 'Sarah', 'Wilson', 'sarah.wilson@skyraksys.com', '+1-555-0107', CURRENT_DATE - INTERVAL '8 months', 'Information Technology', 'QA Engineer', 75000.00, admin_emp_id, 'active'),
    ((SELECT id FROM users WHERE email = 'alex.brown@skyraksys.com'), 'EMP008', 'Alex', 'Brown', 'alex.brown@skyraksys.com', '+1-555-0108', CURRENT_DATE - INTERVAL '3 years', 'Information Technology', 'Lead Developer', 130000.00, admin_emp_id, 'active')
    ON CONFLICT (employee_id) DO NOTHING;

    -- HR Department Employees
    INSERT INTO users (id, email, password, role, is_active, email_verified) VALUES
    (uuid_generate_v4(), 'lisa.garcia@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'hr', true, true),
    (uuid_generate_v4(), 'david.miller@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'hr', true, true),
    (uuid_generate_v4(), 'emily.davis@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'hr', true, true)
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO employees (user_id, employee_id, first_name, last_name, email, phone, hire_date, department, position, salary, manager_id, status) VALUES
    ((SELECT id FROM users WHERE email = 'lisa.garcia@skyraksys.com'), 'EMP009', 'Lisa', 'Garcia', 'lisa.garcia@skyraksys.com', '+1-555-0109', CURRENT_DATE - INTERVAL '2 years', 'Human Resources', 'HR Specialist', 60000.00, (SELECT id FROM employees WHERE employee_id = 'EMP002'), 'active'),
    ((SELECT id FROM users WHERE email = 'david.miller@skyraksys.com'), 'EMP010', 'David', 'Miller', 'david.miller@skyraksys.com', '+1-555-0110', CURRENT_DATE - INTERVAL '1 year', 'Human Resources', 'Recruiter', 55000.00, (SELECT id FROM employees WHERE employee_id = 'EMP002'), 'active'),
    ((SELECT id FROM users WHERE email = 'emily.davis@skyraksys.com'), 'EMP011', 'Emily', 'Davis', 'emily.davis@skyraksys.com', '+1-555-0111', CURRENT_DATE - INTERVAL '6 months', 'Human Resources', 'HR Specialist', 60000.00, (SELECT id FROM employees WHERE employee_id = 'EMP002'), 'active')
    ON CONFLICT (employee_id) DO NOTHING;

    -- Finance Department Employees
    INSERT INTO users (id, email, password, role, is_active, email_verified) VALUES
    (uuid_generate_v4(), 'robert.taylor@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true),
    (uuid_generate_v4(), 'jennifer.anderson@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'manager', true, true),
    (uuid_generate_v4(), 'thomas.thomas@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true)
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO employees (user_id, employee_id, first_name, last_name, email, phone, hire_date, department, position, salary, status) VALUES
    ((SELECT id FROM users WHERE email = 'robert.taylor@skyraksys.com'), 'EMP012', 'Robert', 'Taylor', 'robert.taylor@skyraksys.com', '+1-555-0112', CURRENT_DATE - INTERVAL '3 years', 'Finance', 'Senior Accountant', 75000.00, 'active'),
    ((SELECT id FROM users WHERE email = 'jennifer.anderson@skyraksys.com'), 'EMP013', 'Jennifer', 'Anderson', 'jennifer.anderson@skyraksys.com', '+1-555-0113', CURRENT_DATE - INTERVAL '4 years', 'Finance', 'Finance Manager', 110000.00, 'active'),
    ((SELECT id FROM users WHERE email = 'thomas.thomas@skyraksys.com'), 'EMP014', 'Thomas', 'Thomas', 'thomas.thomas@skyraksys.com', '+1-555-0114', CURRENT_DATE - INTERVAL '1 year', 'Finance', 'Financial Analyst', 70000.00, 'active')
    ON CONFLICT (employee_id) DO NOTHING;

    -- Sales Department Employees
    INSERT INTO users (id, email, password, role, is_active, email_verified) VALUES
    (uuid_generate_v4(), 'amanda.white@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true),
    (uuid_generate_v4(), 'kevin.martin@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'manager', true, true),
    (uuid_generate_v4(), 'michelle.lee@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true),
    (uuid_generate_v4(), 'brian.clark@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true)
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO employees (user_id, employee_id, first_name, last_name, email, phone, hire_date, department, position, salary, status) VALUES
    ((SELECT id FROM users WHERE email = 'amanda.white@skyraksys.com'), 'EMP015', 'Amanda', 'White', 'amanda.white@skyraksys.com', '+1-555-0115', CURRENT_DATE - INTERVAL '2 years', 'Sales', 'Senior Sales Representative', 65000.00, 'active'),
    ((SELECT id FROM users WHERE email = 'kevin.martin@skyraksys.com'), 'EMP016', 'Kevin', 'Martin', 'kevin.martin@skyraksys.com', '+1-555-0116', CURRENT_DATE - INTERVAL '5 years', 'Sales', 'Sales Manager', 95000.00, 'active'),
    ((SELECT id FROM users WHERE email = 'michelle.lee@skyraksys.com'), 'EMP017', 'Michelle', 'Lee', 'michelle.lee@skyraksys.com', '+1-555-0117', CURRENT_DATE - INTERVAL '1 year', 'Sales', 'Sales Representative', 50000.00, 'active'),
    ((SELECT id FROM users WHERE email = 'brian.clark@skyraksys.com'), 'EMP018', 'Brian', 'Clark', 'brian.clark@skyraksys.com', '+1-555-0118', CURRENT_DATE - INTERVAL '8 months', 'Sales', 'Sales Representative', 50000.00, 'active')
    ON CONFLICT (employee_id) DO NOTHING;

    -- Marketing Department Employees
    INSERT INTO users (id, email, password, role, is_active, email_verified) VALUES
    (uuid_generate_v4(), 'stephanie.rodriguez@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true),
    (uuid_generate_v4(), 'daniel.lewis@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'manager', true, true),
    (uuid_generate_v4(), 'rachel.walker@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true)
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO employees (user_id, employee_id, first_name, last_name, email, phone, hire_date, department, position, salary, status) VALUES
    ((SELECT id FROM users WHERE email = 'stephanie.rodriguez@skyraksys.com'), 'EMP019', 'Stephanie', 'Rodriguez', 'stephanie.rodriguez@skyraksys.com', '+1-555-0119', CURRENT_DATE - INTERVAL '18 months', 'Marketing', 'Digital Marketing Specialist', 60000.00, 'active'),
    ((SELECT id FROM users WHERE email = 'daniel.lewis@skyraksys.com'), 'EMP020', 'Daniel', 'Lewis', 'daniel.lewis@skyraksys.com', '+1-555-0120', CURRENT_DATE - INTERVAL '3 years', 'Marketing', 'Marketing Manager', 85000.00, 'active'),
    ((SELECT id FROM users WHERE email = 'rachel.walker@skyraksys.com'), 'EMP021', 'Rachel', 'Walker', 'rachel.walker@skyraksys.com', '+1-555-0121', CURRENT_DATE - INTERVAL '1 year', 'Marketing', 'Marketing Specialist', 55000.00, 'active')
    ON CONFLICT (employee_id) DO NOTHING;

    -- Customer Support Employees
    INSERT INTO users (id, email, password, role, is_active, email_verified) VALUES
    (uuid_generate_v4(), 'christopher.hall@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true),
    (uuid_generate_v4(), 'nicole.young@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'manager', true, true),
    (uuid_generate_v4(), 'joshua.king@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true)
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO employees (user_id, employee_id, first_name, last_name, email, phone, hire_date, department, position, salary, status) VALUES
    ((SELECT id FROM users WHERE email = 'christopher.hall@skyraksys.com'), 'EMP022', 'Christopher', 'Hall', 'christopher.hall@skyraksys.com', '+1-555-0122', CURRENT_DATE - INTERVAL '2 years', 'Customer Support', 'Senior Support Specialist', 52000.00, 'active'),
    ((SELECT id FROM users WHERE email = 'nicole.young@skyraksys.com'), 'EMP023', 'Nicole', 'Young', 'nicole.young@skyraksys.com', '+1-555-0123', CURRENT_DATE - INTERVAL '4 years', 'Customer Support', 'Support Manager', 75000.00, 'active'),
    ((SELECT id FROM users WHERE email = 'joshua.king@skyraksys.com'), 'EMP024', 'Joshua', 'King', 'joshua.king@skyraksys.com', '+1-555-0124', CURRENT_DATE - INTERVAL '1 year', 'Customer Support', 'Support Specialist', 42000.00, 'active')
    ON CONFLICT (employee_id) DO NOTHING;

    -- R&D Department Employees
    INSERT INTO users (id, email, password, role, is_active, email_verified) VALUES
    (uuid_generate_v4(), 'patricia.wright@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true),
    (uuid_generate_v4(), 'matthew.lopez@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'manager', true, true),
    (uuid_generate_v4(), 'kimberly.hill@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'employee', true, true)
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO employees (user_id, employee_id, first_name, last_name, email, phone, hire_date, department, position, salary, status) VALUES
    ((SELECT id FROM users WHERE email = 'patricia.wright@skyraksys.com'), 'EMP025', 'Patricia', 'Wright', 'patricia.wright@skyraksys.com', '+1-555-0125', CURRENT_DATE - INTERVAL '3 years', 'Research & Development', 'Research Analyst', 70000.00, 'active'),
    ((SELECT id FROM users WHERE email = 'matthew.lopez@skyraksys.com'), 'EMP026', 'Matthew', 'Lopez', 'matthew.lopez@skyraksys.com', '+1-555-0126', CURRENT_DATE - INTERVAL '5 years', 'Research & Development', 'R&D Manager', 130000.00, 'active'),
    ((SELECT id FROM users WHERE email = 'kimberly.hill@skyraksys.com'), 'EMP027', 'Kimberly', 'Hill', 'kimberly.hill@skyraksys.com', '+1-555-0127', CURRENT_DATE - INTERVAL '2 years', 'Research & Development', 'Product Manager', 110000.00, 'active')
    ON CONFLICT (employee_id) DO NOTHING;

END $$;

-- Update department managers with new employees
UPDATE departments SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP013') WHERE name = 'Finance';
UPDATE departments SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP016') WHERE name = 'Sales';
UPDATE departments SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP020') WHERE name = 'Marketing';
UPDATE departments SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP023') WHERE name = 'Customer Support';
UPDATE departments SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP026') WHERE name = 'Research & Development';

-- Set manager relationships for employees
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP013') WHERE employee_id IN ('EMP012', 'EMP014');
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP016') WHERE employee_id IN ('EMP015', 'EMP017', 'EMP018');
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP020') WHERE employee_id IN ('EMP019', 'EMP021');
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP023') WHERE employee_id IN ('EMP022', 'EMP024');
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP026') WHERE employee_id IN ('EMP025', 'EMP027');
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP008') WHERE employee_id IN ('EMP004', 'EMP005', 'EMP006', 'EMP007'); -- Alex Brown leads dev team

-- Create additional projects
DO $$
DECLARE
    project_id_1 UUID;
    project_id_2 UUID;
    project_id_3 UUID;
    project_id_4 UUID;
    project_id_5 UUID;
BEGIN
    -- Insert more projects
    INSERT INTO projects (name, description, start_date, end_date, status, budget, manager_id, department_id, created_by) VALUES
    ('Customer Portal Development', 'Development of a new customer self-service portal', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '2 months', 'active', 180000.00, 
     (SELECT id FROM employees WHERE employee_id = 'EMP008'), 
     (SELECT id FROM departments WHERE name = 'Information Technology'),
     (SELECT id FROM employees WHERE employee_id = 'EMP001')),
    ('Sales CRM Integration', 'Integration of new CRM system with existing sales processes', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '3 months', 'active', 95000.00,
     (SELECT id FROM employees WHERE employee_id = 'EMP016'),
     (SELECT id FROM departments WHERE name = 'Sales'),
     (SELECT id FROM employees WHERE employee_id = 'EMP016')),
    ('Marketing Automation Platform', 'Implementation of marketing automation tools', CURRENT_DATE - INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '4 months', 'active', 120000.00,
     (SELECT id FROM employees WHERE employee_id = 'EMP020'),
     (SELECT id FROM departments WHERE name = 'Marketing'),
     (SELECT id FROM employees WHERE employee_id = 'EMP020')),
    ('Financial Reporting System', 'Upgrade of financial reporting and analytics system', CURRENT_DATE - INTERVAL '6 weeks', CURRENT_DATE + INTERVAL '5 months', 'active', 200000.00,
     (SELECT id FROM employees WHERE employee_id = 'EMP013'),
     (SELECT id FROM departments WHERE name = 'Finance'),
     (SELECT id FROM employees WHERE employee_id = 'EMP013')),
    ('Customer Support Chatbot', 'Development of AI-powered customer support chatbot', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', 'active', 85000.00,
     (SELECT id FROM employees WHERE employee_id = 'EMP023'),
     (SELECT id FROM departments WHERE name = 'Customer Support'),
     (SELECT id FROM employees WHERE employee_id = 'EMP026'))
    RETURNING id INTO project_id_1, project_id_2, project_id_3, project_id_4, project_id_5;

    -- Get project IDs for task creation
    SELECT id INTO project_id_1 FROM projects WHERE name = 'Customer Portal Development';
    SELECT id INTO project_id_2 FROM projects WHERE name = 'Sales CRM Integration';
    SELECT id INTO project_id_3 FROM projects WHERE name = 'Marketing Automation Platform';
    SELECT id INTO project_id_4 FROM projects WHERE name = 'Financial Reporting System';
    SELECT id INTO project_id_5 FROM projects WHERE name = 'Customer Support Chatbot';

    -- Create tasks for projects
    INSERT INTO tasks (project_id, title, description, assigned_to, created_by, status, priority, start_date, due_date, estimated_hours, completion_percentage) VALUES
    -- Customer Portal Development tasks
    (project_id_1, 'Frontend Development', 'Develop responsive frontend interface', (SELECT id FROM employees WHERE employee_id = 'EMP005'), (SELECT id FROM employees WHERE employee_id = 'EMP008'), 'in_progress', 'high', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '1 month', 120, 65),
    (project_id_1, 'Backend API Development', 'Create RESTful APIs for customer portal', (SELECT id FROM employees WHERE employee_id = 'EMP004'), (SELECT id FROM employees WHERE employee_id = 'EMP008'), 'in_progress', 'high', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '3 weeks', 100, 80),
    (project_id_1, 'Database Design', 'Design database schema for customer data', (SELECT id FROM employees WHERE employee_id = 'EMP006'), (SELECT id FROM employees WHERE employee_id = 'EMP008'), 'completed', 'medium', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE - INTERVAL '2 months', 40, 100),
    (project_id_1, 'Security Implementation', 'Implement authentication and authorization', (SELECT id FROM employees WHERE employee_id = 'EMP006'), (SELECT id FROM employees WHERE employee_id = 'EMP008'), 'todo', 'urgent', CURRENT_DATE + INTERVAL '1 week', CURRENT_DATE + INTERVAL '1 month', 60, 0),
    (project_id_1, 'Testing and QA', 'Comprehensive testing of portal functionality', (SELECT id FROM employees WHERE employee_id = 'EMP007'), (SELECT id FROM employees WHERE employee_id = 'EMP008'), 'todo', 'medium', CURRENT_DATE + INTERVAL '3 weeks', CURRENT_DATE + INTERVAL '6 weeks', 80, 0),

    -- Sales CRM Integration tasks
    (project_id_2, 'CRM System Analysis', 'Analyze existing CRM capabilities and requirements', (SELECT id FROM employees WHERE employee_id = 'EMP015'), (SELECT id FROM employees WHERE employee_id = 'EMP016'), 'completed', 'high', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE - INTERVAL '3 weeks', 32, 100),
    (project_id_2, 'Data Migration Planning', 'Plan migration of existing sales data', (SELECT id FROM employees WHERE employee_id = 'EMP017'), (SELECT id FROM employees WHERE employee_id = 'EMP016'), 'in_progress', 'high', CURRENT_DATE - INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '1 week', 24, 40),
    (project_id_2, 'Integration Development', 'Develop API integrations with existing systems', (SELECT id FROM employees WHERE employee_id = 'EMP005'), (SELECT id FROM employees WHERE employee_id = 'EMP016'), 'in_progress', 'high', CURRENT_DATE - INTERVAL '1 week', CURRENT_DATE + INTERVAL '3 weeks', 60, 25),
    (project_id_2, 'User Training Program', 'Create training materials and conduct sessions', (SELECT id FROM employees WHERE employee_id = 'EMP018'), (SELECT id FROM employees WHERE employee_id = 'EMP016'), 'todo', 'medium', CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '2 months', 40, 0),

    -- Marketing Automation Platform tasks
    (project_id_3, 'Platform Selection', 'Evaluate and select marketing automation platform', (SELECT id FROM employees WHERE employee_id = 'EMP019'), (SELECT id FROM employees WHERE employee_id = 'EMP020'), 'completed', 'high', CURRENT_DATE - INTERVAL '2 weeks', CURRENT_DATE - INTERVAL '1 week', 16, 100),
    (project_id_3, 'Campaign Template Design', 'Design email and social media campaign templates', (SELECT id FROM employees WHERE employee_id = 'EMP021'), (SELECT id FROM employees WHERE employee_id = 'EMP020'), 'in_progress', 'medium', CURRENT_DATE - INTERVAL '1 week', CURRENT_DATE + INTERVAL '2 weeks', 32, 50),
    (project_id_3, 'Lead Scoring Configuration', 'Configure lead scoring and nurturing workflows', (SELECT id FROM employees WHERE employee_id = 'EMP019'), (SELECT id FROM employees WHERE employee_id = 'EMP020'), 'todo', 'high', CURRENT_DATE + INTERVAL '1 week', CURRENT_DATE + INTERVAL '1 month', 40, 0),

    -- Financial Reporting System tasks
    (project_id_4, 'Requirements Gathering', 'Gather detailed reporting requirements from stakeholders', (SELECT id FROM employees WHERE employee_id = 'EMP014'), (SELECT id FROM employees WHERE employee_id = 'EMP013'), 'completed', 'high', CURRENT_DATE - INTERVAL '6 weeks', CURRENT_DATE - INTERVAL '1 month', 24, 100),
    (project_id_4, 'Report Design', 'Design financial dashboard and report layouts', (SELECT id FROM employees WHERE employee_id = 'EMP012'), (SELECT id FROM employees WHERE employee_id = 'EMP013'), 'in_progress', 'high', CURRENT_DATE - INTERVAL '3 weeks', CURRENT_DATE + INTERVAL '1 week', 40, 70),
    (project_id_4, 'Data Integration', 'Integrate data sources for comprehensive reporting', (SELECT id FROM employees WHERE employee_id = 'EMP006'), (SELECT id FROM employees WHERE employee_id = 'EMP013'), 'in_progress', 'urgent', CURRENT_DATE - INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '2 weeks', 60, 45),

    -- Customer Support Chatbot tasks
    (project_id_5, 'AI Model Research', 'Research and select appropriate AI model for chatbot', (SELECT id FROM employees WHERE employee_id = 'EMP025'), (SELECT id FROM employees WHERE employee_id = 'EMP026'), 'in_progress', 'high', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 weeks', 32, 30),
    (project_id_5, 'Knowledge Base Creation', 'Create comprehensive knowledge base for chatbot training', (SELECT id FROM employees WHERE employee_id = 'EMP022'), (SELECT id FROM employees WHERE employee_id = 'EMP023'), 'in_progress', 'medium', CURRENT_DATE - INTERVAL '1 week', CURRENT_DATE + INTERVAL '1 month', 48, 20),
    (project_id_5, 'Chatbot Development', 'Develop and train the chatbot system', (SELECT id FROM employees WHERE employee_id = 'EMP004'), (SELECT id FROM employees WHERE employee_id = 'EMP026'), 'todo', 'high', CURRENT_DATE + INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '3 months', 120, 0);

END $$;

-- Create employee project assignments
INSERT INTO employee_projects (employee_id, project_id, role) VALUES
-- HRM System Implementation
((SELECT id FROM employees WHERE employee_id = 'EMP004'), (SELECT id FROM projects WHERE name = 'HRM System Implementation'), 'Senior Developer'),
((SELECT id FROM employees WHERE employee_id = 'EMP005'), (SELECT id FROM projects WHERE name = 'HRM System Implementation'), 'Frontend Developer'),
((SELECT id FROM employees WHERE employee_id = 'EMP006'), (SELECT id FROM projects WHERE name = 'HRM System Implementation'), 'DevOps Engineer'),
((SELECT id FROM employees WHERE employee_id = 'EMP007'), (SELECT id FROM projects WHERE name = 'HRM System Implementation'), 'QA Engineer'),

-- Customer Portal Development
((SELECT id FROM employees WHERE employee_id = 'EMP004'), (SELECT id FROM projects WHERE name = 'Customer Portal Development'), 'Backend Developer'),
((SELECT id FROM employees WHERE employee_id = 'EMP005'), (SELECT id FROM projects WHERE name = 'Customer Portal Development'), 'Frontend Developer'),
((SELECT id FROM employees WHERE employee_id = 'EMP006'), (SELECT id FROM projects WHERE name = 'Customer Portal Development'), 'DevOps Engineer'),
((SELECT id FROM employees WHERE employee_id = 'EMP007'), (SELECT id FROM projects WHERE name = 'Customer Portal Development'), 'QA Engineer'),

-- Sales CRM Integration
((SELECT id FROM employees WHERE employee_id = 'EMP015'), (SELECT id FROM projects WHERE name = 'Sales CRM Integration'), 'Business Analyst'),
((SELECT id FROM employees WHERE employee_id = 'EMP017'), (SELECT id FROM projects WHERE name = 'Sales CRM Integration'), 'Data Analyst'),
((SELECT id FROM employees WHERE employee_id = 'EMP018'), (SELECT id FROM projects WHERE name = 'Sales CRM Integration'), 'Training Coordinator'),

-- Marketing Automation Platform
((SELECT id FROM employees WHERE employee_id = 'EMP019'), (SELECT id FROM projects WHERE name = 'Marketing Automation Platform'), 'Digital Marketing Lead'),
((SELECT id FROM employees WHERE employee_id = 'EMP021'), (SELECT id FROM projects WHERE name = 'Marketing Automation Platform'), 'Content Specialist'),

-- Financial Reporting System
((SELECT id FROM employees WHERE employee_id = 'EMP012'), (SELECT id FROM projects WHERE name = 'Financial Reporting System'), 'Financial Analyst'),
((SELECT id FROM employees WHERE employee_id = 'EMP014'), (SELECT id FROM projects WHERE name = 'Financial Reporting System'), 'Requirements Analyst')

ON CONFLICT (employee_id, project_id) DO NOTHING;

-- Generate attendance records for the last 3 months
DO $$
DECLARE
    emp_record RECORD;
    current_date DATE;
    end_date DATE;
    day_of_week INTEGER;
    attendance_status attendance_status;
    check_in TIME;
    check_out TIME;
    random_val FLOAT;
BEGIN
    current_date := CURRENT_DATE - INTERVAL '3 months';
    end_date := CURRENT_DATE;
    
    -- Loop through each employee
    FOR emp_record IN SELECT id FROM employees WHERE status = 'active' LOOP
        -- Reset date for each employee
        current_date := CURRENT_DATE - INTERVAL '3 months';
        
        WHILE current_date <= end_date LOOP
            day_of_week := EXTRACT(DOW FROM current_date);
            
            -- Only create records for weekdays (Monday-Friday)
            IF day_of_week BETWEEN 1 AND 5 THEN
                random_val := RANDOM();
                
                -- Determine attendance status (90% present, 5% late, 3% absent, 2% half_day)
                IF random_val < 0.90 THEN
                    attendance_status := 'present';
                    check_in := TIME '09:00:00' + (RANDOM() * INTERVAL '30 minutes');
                    check_out := TIME '17:00:00' + (RANDOM() * INTERVAL '60 minutes');
                ELSIF random_val < 0.95 THEN
                    attendance_status := 'late';
                    check_in := TIME '09:15:00' + (RANDOM() * INTERVAL '45 minutes');
                    check_out := TIME '17:00:00' + (RANDOM() * INTERVAL '60 minutes');
                ELSIF random_val < 0.98 THEN
                    attendance_status := 'absent';
                    check_in := NULL;
                    check_out := NULL;
                ELSE
                    attendance_status := 'half_day';
                    check_in := TIME '09:00:00' + (RANDOM() * INTERVAL '30 minutes');
                    check_out := TIME '13:00:00' + (RANDOM() * INTERVAL '30 minutes');
                END IF;
                
                INSERT INTO attendance (employee_id, date, status, check_in_time, check_out_time, overtime_hours)
                VALUES (
                    emp_record.id,
                    current_date,
                    attendance_status,
                    check_in,
                    check_out,
                    CASE 
                        WHEN attendance_status = 'present' AND RANDOM() < 0.2 THEN ROUND((RANDOM() * 3)::NUMERIC, 2)
                        ELSE 0
                    END
                )
                ON CONFLICT (employee_id, date) DO NOTHING;
            END IF;
            
            current_date := current_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;
END $$;

-- Create leave requests
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason, status, approved_by, approved_at) VALUES
((SELECT id FROM employees WHERE employee_id = 'EMP005'), 'vacation', CURRENT_DATE + INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '2 weeks' + INTERVAL '4 days', 5, 'Family vacation to Hawaii', 'approved', (SELECT id FROM employees WHERE employee_id = 'EMP001'), CURRENT_TIMESTAMP - INTERVAL '1 week'),
((SELECT id FROM employees WHERE employee_id = 'EMP007'), 'sick', CURRENT_DATE - INTERVAL '1 week', CURRENT_DATE - INTERVAL '1 week' + INTERVAL '2 days', 3, 'Flu symptoms', 'approved', (SELECT id FROM employees WHERE employee_id = 'EMP001'), CURRENT_TIMESTAMP - INTERVAL '1 week'),
((SELECT id FROM employees WHERE employee_id = 'EMP015'), 'personal', CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '1 month' + INTERVAL '1 day', 2, 'Personal matters', 'pending', NULL, NULL),
((SELECT id FROM employees WHERE employee_id = 'EMP019'), 'vacation', CURRENT_DATE + INTERVAL '6 weeks', CURRENT_DATE + INTERVAL '6 weeks' + INTERVAL '9 days', 10, 'Summer vacation with family', 'pending', NULL, NULL),
((SELECT id FROM employees WHERE employee_id = 'EMP022'), 'sick', CURRENT_DATE - INTERVAL '2 weeks', CURRENT_DATE - INTERVAL '2 weeks' + INTERVAL '1 day', 2, 'Medical appointment and recovery', 'approved', (SELECT id FROM employees WHERE employee_id = 'EMP023'), CURRENT_TIMESTAMP - INTERVAL '2 weeks'),
((SELECT id FROM employees WHERE employee_id = 'EMP012'), 'vacation', CURRENT_DATE + INTERVAL '3 months', CURRENT_DATE + INTERVAL '3 months' + INTERVAL '14 days', 15, 'Annual family reunion and vacation', 'pending', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Create payroll records for the last 6 months
DO $$
DECLARE
    emp_record RECORD;
    month_start DATE;
    month_end DATE;
    base_sal DECIMAL;
    overtime_amount DECIMAL;
    gross_amount DECIMAL;
    tax_amount DECIMAL;
    net_amount DECIMAL;
    i INTEGER;
BEGIN
    -- Generate payroll for last 6 months
    FOR i IN 0..5 LOOP
        month_start := DATE_TRUNC('month', CURRENT_DATE - (i || ' months')::INTERVAL);
        month_end := month_start + INTERVAL '1 month' - INTERVAL '1 day';
        
        FOR emp_record IN SELECT id, salary FROM employees WHERE status = 'active' AND salary IS NOT NULL LOOP
            base_sal := emp_record.salary / 12; -- Monthly salary
            overtime_amount := (RANDOM() * 500)::DECIMAL(10,2); -- Random overtime
            gross_amount := base_sal + overtime_amount;
            tax_amount := gross_amount * 0.15; -- 15% tax
            net_amount := gross_amount - tax_amount;
            
            INSERT INTO payroll (
                employee_id, pay_period_start, pay_period_end,
                base_salary, overtime_pay, gross_pay, tax_deduction, net_pay,
                pay_date, is_paid
            ) VALUES (
                emp_record.id, month_start, month_end,
                base_sal, overtime_amount, gross_amount, tax_amount, net_amount,
                month_end + INTERVAL '5 days',
                CASE WHEN i > 0 THEN true ELSE false END -- Current month not paid yet
            )
            ON CONFLICT (employee_id, pay_period_start, pay_period_end) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Create performance reviews
INSERT INTO performance_reviews (
    employee_id, reviewer_id, review_period_start, review_period_end,
    overall_rating, goals_achievement, communication_skills, teamwork, technical_skills,
    comments, improvement_areas, goals_next_period
) VALUES
((SELECT id FROM employees WHERE employee_id = 'EMP004'), (SELECT id FROM employees WHERE employee_id = 'EMP008'), CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE - INTERVAL '6 months', 4, 4, 5, 4, 5, 'Excellent technical skills and leadership qualities. Consistently delivers high-quality work.', 'Could improve project timeline estimation', 'Lead the new microservices initiative'),
((SELECT id FROM employees WHERE employee_id = 'EMP005'), (SELECT id FROM employees WHERE employee_id = 'EMP008'), CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE - INTERVAL '6 months', 4, 3, 4, 4, 4, 'Strong frontend development skills with good attention to detail.', 'Work on backend technologies to become more versatile', 'Complete full-stack certification and lead UI/UX improvements'),
((SELECT id FROM employees WHERE employee_id = 'EMP015'), (SELECT id FROM employees WHERE employee_id = 'EMP016'), CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE - INTERVAL '6 months', 5, 5, 5, 4, 3, 'Outstanding sales performance, exceeded targets by 150%. Great customer relationship building.', 'Improve technical product knowledge', 'Mentor junior sales representatives and achieve team lead role'),
((SELECT id FROM employees WHERE employee_id = 'EMP019'), (SELECT id FROM employees WHERE employee_id = 'EMP020'), CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE - INTERVAL '6 months', 4, 4, 4, 5, 4, 'Creative marketing campaigns with measurable results. Great team collaboration.', 'Develop data analytics skills for better campaign measurement', 'Lead the new digital marketing transformation project')
ON CONFLICT DO NOTHING;

-- Add some audit logs for testing
INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES
((SELECT id FROM users WHERE email = 'admin@skyraksys.com'), 'CREATE', 'employees', (SELECT id FROM employees WHERE employee_id = 'EMP004'), '{"first_name": "John", "last_name": "Doe", "position": "Senior Software Engineer"}', '192.168.1.100'),
((SELECT id FROM users WHERE email = 'hr@skyraksys.com'), 'UPDATE', 'employees', (SELECT id FROM employees WHERE employee_id = 'EMP005'), '{"salary": 85000}', '192.168.1.101'),
((SELECT id FROM users WHERE email = 'manager@skyraksys.com'), 'CREATE', 'projects', (SELECT id FROM projects WHERE name = 'Customer Portal Development'), '{"name": "Customer Portal Development", "status": "active"}', '192.168.1.102')
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Test data creation completed successfully!';
RAISE NOTICE 'Created comprehensive test data including:';
RAISE NOTICE '  - 27 employees across all departments';
RAISE NOTICE '  - 8 projects with multiple tasks';
RAISE NOTICE '  - 3 months of attendance records';
RAISE NOTICE '  - Leave requests and payroll records';
RAISE NOTICE '  - Performance reviews and audit logs';
EOF

# Execute test data creation
log $YELLOW "Executing test data creation..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/test_data.sql; then
    log $GREEN "✅ Test data created successfully"
else
    log $RED "❌ Failed to create test data"
    log $RED "Check the SQL file at /tmp/test_data.sql for details"
    exit 1
fi

# Clean up temporary file
rm -f /tmp/test_data.sql

# Display summary
log $YELLOW "Generating data summary..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 
    'Employees' as table_name, COUNT(*) as record_count FROM employees
UNION ALL
SELECT 
    'Departments' as table_name, COUNT(*) as record_count FROM departments
UNION ALL
SELECT 
    'Projects' as table_name, COUNT(*) as record_count FROM projects
UNION ALL
SELECT 
    'Tasks' as table_name, COUNT(*) as record_count FROM tasks
UNION ALL
SELECT 
    'Attendance Records' as table_name, COUNT(*) as record_count FROM attendance
UNION ALL
SELECT 
    'Leave Requests' as table_name, COUNT(*) as record_count FROM leave_requests
UNION ALL
SELECT 
    'Payroll Records' as table_name, COUNT(*) as record_count FROM payroll
UNION ALL
SELECT 
    'Performance Reviews' as table_name, COUNT(*) as record_count FROM performance_reviews
UNION ALL
SELECT 
    'Salary Structures' as table_name, COUNT(*) as record_count FROM salary_structures
ORDER BY table_name;
"

echo ""
log $GREEN "✅ Comprehensive test data creation completed successfully!"
echo ""
log $CYAN "Test accounts created (password: admin123):"
log $CYAN "  Admin: admin@skyraksys.com"
log $CYAN "  HR: hr@skyraksys.com"
log $CYAN "  Manager: manager@skyraksys.com"
log $CYAN "  Employees: john.doe@skyraksys.com, jane.smith@skyraksys.com, etc."
echo ""
log $YELLOW "Next steps:"
log $YELLOW "  1. Start the application: ../start.sh"
log $YELLOW "  2. Access the application at: http://localhost:3000"
log $YELLOW "  3. Login with any of the test accounts"
log $YELLOW "  4. Explore the HR management features"
echo ""
