#!/bin/bash

# ============================================
# Initial Data Seeding Script (Unix/Linux)
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
log $CYAN "[Data Seeding] Seeding initial data for SkyRakSys HRM..."

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

# Create initial data script
log $YELLOW "Creating initial data..."

cat > /tmp/initial_data.sql << 'EOF'
-- =====================================================
-- SkyRakSys HRM Initial Data Seeding
-- =====================================================

-- Insert system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('company_name', 'SkyRakSys Technologies', 'Company name displayed in the application', true),
('company_address', '123 Business Street, Tech City, TC 12345', 'Company physical address', true),
('company_phone', '+1-555-0123', 'Company main phone number', true),
('company_email', 'info@skyraksys.com', 'Company main email address', true),
('company_website', 'https://www.skyraksys.com', 'Company website URL', true),
('currency', 'USD', 'Default currency for payroll and financial calculations', true),
('timezone', 'America/New_York', 'Default timezone for the application', true),
('work_hours_per_day', '8', 'Standard work hours per day', true),
('work_days_per_week', '5', 'Standard work days per week', true),
('overtime_rate', '1.5', 'Overtime pay rate multiplier', false),
('tax_rate', '0.15', 'Default tax rate for payroll calculations', false),
('app_version', '2.0.0', 'Current application version', true),
('maintenance_mode', 'false', 'Enable/disable maintenance mode', false),
('email_notifications', 'true', 'Enable/disable email notifications', false),
('password_min_length', '8', 'Minimum password length requirement', false),
('session_timeout', '1440', 'Session timeout in minutes (24 hours)', false),
('backup_retention_days', '30', 'Number of days to retain backups', false),
('max_file_upload_size', '10', 'Maximum file upload size in MB', false)
ON CONFLICT (key) DO NOTHING;

-- Insert default departments
INSERT INTO departments (id, name, description, is_active) VALUES
(uuid_generate_v4(), 'Human Resources', 'Manages employee relations, recruitment, and HR policies', true),
(uuid_generate_v4(), 'Information Technology', 'Manages technology infrastructure and software development', true),
(uuid_generate_v4(), 'Finance', 'Handles financial planning, accounting, and budgeting', true),
(uuid_generate_v4(), 'Operations', 'Manages day-to-day business operations and processes', true),
(uuid_generate_v4(), 'Sales', 'Handles customer acquisition and revenue generation', true),
(uuid_generate_v4(), 'Marketing', 'Manages brand promotion and market analysis', true),
(uuid_generate_v4(), 'Customer Support', 'Provides customer service and technical support', true),
(uuid_generate_v4(), 'Research & Development', 'Focuses on innovation and product development', true)
ON CONFLICT (name) DO NOTHING;

-- Insert salary structures
INSERT INTO salary_structures (position, department, min_salary, max_salary, base_salary, currency, is_active) VALUES
-- IT Department
('Software Engineer', 'Information Technology', 70000.00, 120000.00, 85000.00, 'USD', true),
('Senior Software Engineer', 'Information Technology', 90000.00, 150000.00, 110000.00, 'USD', true),
('Lead Developer', 'Information Technology', 110000.00, 170000.00, 130000.00, 'USD', true),
('DevOps Engineer', 'Information Technology', 80000.00, 140000.00, 100000.00, 'USD', true),
('System Administrator', 'Information Technology', 65000.00, 110000.00, 80000.00, 'USD', true),
('IT Manager', 'Information Technology', 120000.00, 180000.00, 140000.00, 'USD', true),
('Database Administrator', 'Information Technology', 75000.00, 130000.00, 95000.00, 'USD', true),
('QA Engineer', 'Information Technology', 60000.00, 100000.00, 75000.00, 'USD', true),

-- HR Department
('HR Specialist', 'Human Resources', 50000.00, 80000.00, 60000.00, 'USD', true),
('HR Manager', 'Human Resources', 80000.00, 120000.00, 95000.00, 'USD', true),
('Recruiter', 'Human Resources', 45000.00, 75000.00, 55000.00, 'USD', true),
('HR Director', 'Human Resources', 120000.00, 180000.00, 140000.00, 'USD', true),

-- Finance Department
('Accountant', 'Finance', 50000.00, 80000.00, 60000.00, 'USD', true),
('Senior Accountant', 'Finance', 65000.00, 95000.00, 75000.00, 'USD', true),
('Financial Analyst', 'Finance', 60000.00, 90000.00, 70000.00, 'USD', true),
('Finance Manager', 'Finance', 90000.00, 140000.00, 110000.00, 'USD', true),
('CFO', 'Finance', 150000.00, 250000.00, 180000.00, 'USD', true),

-- Operations Department
('Operations Specialist', 'Operations', 45000.00, 70000.00, 55000.00, 'USD', true),
('Operations Manager', 'Operations', 75000.00, 110000.00, 85000.00, 'USD', true),
('Project Manager', 'Operations', 80000.00, 120000.00, 95000.00, 'USD', true),
('Operations Director', 'Operations', 110000.00, 160000.00, 130000.00, 'USD', true),

-- Sales Department
('Sales Representative', 'Sales', 40000.00, 70000.00, 50000.00, 'USD', true),
('Senior Sales Representative', 'Sales', 55000.00, 85000.00, 65000.00, 'USD', true),
('Sales Manager', 'Sales', 80000.00, 120000.00, 95000.00, 'USD', true),
('Sales Director', 'Sales', 120000.00, 180000.00, 140000.00, 'USD', true),

-- Marketing Department
('Marketing Specialist', 'Marketing', 45000.00, 75000.00, 55000.00, 'USD', true),
('Marketing Manager', 'Marketing', 70000.00, 110000.00, 85000.00, 'USD', true),
('Digital Marketing Specialist', 'Marketing', 50000.00, 80000.00, 60000.00, 'USD', true),
('Marketing Director', 'Marketing', 110000.00, 160000.00, 130000.00, 'USD', true),

-- Customer Support
('Support Specialist', 'Customer Support', 35000.00, 55000.00, 42000.00, 'USD', true),
('Senior Support Specialist', 'Customer Support', 45000.00, 65000.00, 52000.00, 'USD', true),
('Support Manager', 'Customer Support', 65000.00, 95000.00, 75000.00, 'USD', true),

-- R&D Department
('Research Analyst', 'Research & Development', 60000.00, 90000.00, 70000.00, 'USD', true),
('Product Manager', 'Research & Development', 90000.00, 140000.00, 110000.00, 'USD', true),
('R&D Manager', 'Research & Development', 110000.00, 160000.00, 130000.00, 'USD', true)
ON CONFLICT DO NOTHING;

-- Create admin user with bcrypt hash for 'admin123'
INSERT INTO users (id, email, password, role, is_active, email_verified) VALUES
(uuid_generate_v4(), 'admin@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'admin', true, true)
ON CONFLICT (email) DO NOTHING;

-- Create HR manager user
INSERT INTO users (id, email, password, role, is_active, email_verified) VALUES
(uuid_generate_v4(), 'hr@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'hr', true, true)
ON CONFLICT (email) DO NOTHING;

-- Create manager user
INSERT INTO users (id, email, password, role, is_active, email_verified) VALUES
(uuid_generate_v4(), 'manager@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3TGD3TGD3T2', 'manager', true, true)
ON CONFLICT (email) DO NOTHING;

-- Get department IDs for employee creation
DO $$
DECLARE
    hr_dept_id UUID;
    it_dept_id UUID;
    admin_user_id UUID;
    hr_user_id UUID;
    manager_user_id UUID;
BEGIN
    -- Get department IDs
    SELECT id INTO hr_dept_id FROM departments WHERE name = 'Human Resources' LIMIT 1;
    SELECT id INTO it_dept_id FROM departments WHERE name = 'Information Technology' LIMIT 1;
    
    -- Get user IDs
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@skyraksys.com' LIMIT 1;
    SELECT id INTO hr_user_id FROM users WHERE email = 'hr@skyraksys.com' LIMIT 1;
    SELECT id INTO manager_user_id FROM users WHERE email = 'manager@skyraksys.com' LIMIT 1;
    
    -- Create admin employee
    INSERT INTO employees (
        user_id, employee_id, first_name, last_name, email, 
        hire_date, department, position, salary, status
    ) VALUES (
        admin_user_id, 'EMP001', 'System', 'Administrator', 'admin@skyraksys.com',
        CURRENT_DATE - INTERVAL '1 year', 'Information Technology', 'IT Manager', 140000.00, 'active'
    ) ON CONFLICT (employee_id) DO NOTHING;
    
    -- Create HR manager employee
    INSERT INTO employees (
        user_id, employee_id, first_name, last_name, email, 
        hire_date, department, position, salary, status
    ) VALUES (
        hr_user_id, 'EMP002', 'HR', 'Manager', 'hr@skyraksys.com',
        CURRENT_DATE - INTERVAL '6 months', 'Human Resources', 'HR Manager', 95000.00, 'active'
    ) ON CONFLICT (employee_id) DO NOTHING;
    
    -- Create project manager employee
    INSERT INTO employees (
        user_id, employee_id, first_name, last_name, email, 
        hire_date, department, position, salary, status
    ) VALUES (
        manager_user_id, 'EMP003', 'Project', 'Manager', 'manager@skyraksys.com',
        CURRENT_DATE - INTERVAL '3 months', 'Operations', 'Project Manager', 95000.00, 'active'
    ) ON CONFLICT (employee_id) DO NOTHING;
END $$;

-- Update department managers
DO $$
DECLARE
    admin_emp_id UUID;
    hr_emp_id UUID;
    manager_emp_id UUID;
BEGIN
    -- Get employee IDs
    SELECT id INTO admin_emp_id FROM employees WHERE employee_id = 'EMP001' LIMIT 1;
    SELECT id INTO hr_emp_id FROM employees WHERE employee_id = 'EMP002' LIMIT 1;
    SELECT id INTO manager_emp_id FROM employees WHERE employee_id = 'EMP003' LIMIT 1;
    
    -- Update department managers
    UPDATE departments SET manager_id = admin_emp_id WHERE name = 'Information Technology';
    UPDATE departments SET manager_id = hr_emp_id WHERE name = 'Human Resources';
    UPDATE departments SET manager_id = manager_emp_id WHERE name = 'Operations';
END $$;

-- Create initial projects
DO $$
DECLARE
    admin_emp_id UUID;
    manager_emp_id UUID;
    it_dept_id UUID;
    ops_dept_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO admin_emp_id FROM employees WHERE employee_id = 'EMP001' LIMIT 1;
    SELECT id INTO manager_emp_id FROM employees WHERE employee_id = 'EMP003' LIMIT 1;
    SELECT id INTO it_dept_id FROM departments WHERE name = 'Information Technology' LIMIT 1;
    SELECT id INTO ops_dept_id FROM departments WHERE name = 'Operations' LIMIT 1;
    
    -- Create projects
    INSERT INTO projects (
        name, description, start_date, end_date, deadline, 
        status, budget, manager_id, department_id, created_by
    ) VALUES 
    (
        'HRM System Implementation',
        'Implementation and deployment of the new Human Resource Management system',
        CURRENT_DATE - INTERVAL '2 months',
        CURRENT_DATE + INTERVAL '4 months',
        CURRENT_DATE + INTERVAL '3 months',
        'active',
        250000.00,
        admin_emp_id,
        it_dept_id,
        admin_emp_id
    ),
    (
        'Employee Onboarding Process Improvement',
        'Streamline and improve the employee onboarding process',
        CURRENT_DATE - INTERVAL '1 month',
        CURRENT_DATE + INTERVAL '2 months',
        CURRENT_DATE + INTERVAL '1 month',
        'active',
        75000.00,
        manager_emp_id,
        ops_dept_id,
        manager_emp_id
    ),
    (
        'Digital Transformation Initiative',
        'Company-wide digital transformation to improve efficiency and productivity',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '12 months',
        CURRENT_DATE + INTERVAL '10 months',
        'active',
        500000.00,
        admin_emp_id,
        it_dept_id,
        admin_emp_id
    )
    ON CONFLICT DO NOTHING;
END $$;

-- Insert leave types and other enum-based default data
-- This is handled by the enum types in the schema

-- Create some default file upload directories (metadata only)
INSERT INTO file_uploads (
    original_name, filename, path, mime_type, size, 
    uploaded_by, related_table, is_public
) 
SELECT 
    'company_logo.png', 
    'company_logo.png', 
    '/uploads/company/logo.png', 
    'image/png', 
    15360,
    u.id,
    'system_settings',
    true
FROM users u 
WHERE u.email = 'admin@skyraksys.com' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify data insertion
DO $$
DECLARE
    user_count INTEGER;
    employee_count INTEGER;
    department_count INTEGER;
    project_count INTEGER;
    salary_structure_count INTEGER;
    settings_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO employee_count FROM employees;
    SELECT COUNT(*) INTO department_count FROM departments;
    SELECT COUNT(*) INTO project_count FROM projects;
    SELECT COUNT(*) INTO salary_structure_count FROM salary_structures;
    SELECT COUNT(*) INTO settings_count FROM system_settings;
    
    RAISE NOTICE 'Data seeding summary:';
    RAISE NOTICE '  Users: %', user_count;
    RAISE NOTICE '  Employees: %', employee_count;
    RAISE NOTICE '  Departments: %', department_count;
    RAISE NOTICE '  Projects: %', project_count;
    RAISE NOTICE '  Salary Structures: %', salary_structure_count;
    RAISE NOTICE '  System Settings: %', settings_count;
END $$;
EOF

# Execute initial data seeding
log $YELLOW "Executing data seeding..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/initial_data.sql; then
    log $GREEN "✅ Initial data seeded successfully"
else
    log $RED "❌ Failed to seed initial data"
    log $RED "Check the SQL file at /tmp/initial_data.sql for details"
    exit 1
fi

# Clean up temporary file
rm -f /tmp/initial_data.sql

echo ""
log $GREEN "✅ Initial data seeding completed successfully!"
echo ""
log $CYAN "Default login credentials:"
log $CYAN "  Admin User:"
log $CYAN "    Email: admin@skyraksys.com"
log $CYAN "    Password: admin123"
echo ""
log $CYAN "  HR Manager:"
log $CYAN "    Email: hr@skyraksys.com"
log $CYAN "    Password: admin123"
echo ""
log $CYAN "  Project Manager:"
log $CYAN "    Email: manager@skyraksys.com"
log $CYAN "    Password: admin123"
echo ""
log $YELLOW "⚠️  IMPORTANT: Change these default passwords immediately after first login!"
echo ""
log $YELLOW "Next steps:"
log $YELLOW "  1. (Optional) Create test data: ./create-test-data.sh"
log $YELLOW "  2. Start the application: ../start.sh"
log $YELLOW "  3. Access the application at: http://localhost:3000"
echo ""
