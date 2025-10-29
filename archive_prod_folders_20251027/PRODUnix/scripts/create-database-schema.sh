#!/bin/bash

# ============================================
# Database Schema Creation Script (Unix/Linux)
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
log $CYAN "[Database Schema] Creating SkyRakSys HRM database schema..."

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

if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    log $RED "❌ Failed to connect to PostgreSQL server"
    log $RED "Please check your database credentials and ensure PostgreSQL is running"
    exit 1
fi

log $GREEN "✅ Database connection successful"

# Create database if it doesn't exist
log $YELLOW "Creating database '$DB_NAME' if it doesn't exist..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
        CREATE DATABASE $DB_NAME;
    END IF;
END
\$\$;
" > /dev/null 2>&1

if [[ $? -eq 0 ]]; then
    log $GREEN "✅ Database '$DB_NAME' is ready"
else
    log $RED "❌ Failed to create database '$DB_NAME'"
    exit 1
fi

# Create schema script
log $YELLOW "Creating database schema..."

cat > /tmp/schema.sql << 'EOF'
-- =====================================================
-- SkyRakSys HRM Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'hr', 'manager', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'terminated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM ('vacation', 'sick', 'personal', 'maternity', 'paternity', 'emergency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'half_day');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('active', 'completed', 'on_hold', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Employees Table
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    hire_date DATE NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    salary DECIMAL(12,2),
    manager_id UUID REFERENCES employees(id),
    status employee_status DEFAULT 'active',
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Departments Table
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES employees(id),
    budget DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Projects Table
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    deadline DATE,
    status project_status DEFAULT 'active',
    budget DECIMAL(15,2),
    manager_id UUID REFERENCES employees(id),
    department_id UUID REFERENCES departments(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Tasks Table
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES employees(id),
    created_by UUID REFERENCES employees(id),
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',
    start_date DATE,
    due_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Employee Projects (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(100),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, project_id)
);

-- =====================================================
-- Attendance Table
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    break_duration INTEGER DEFAULT 0, -- in minutes
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- =====================================================
-- Leave Requests Table
-- =====================================================
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    reason TEXT,
    status leave_status DEFAULT 'pending',
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Payroll Table
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    bonus DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    gross_pay DECIMAL(12,2) NOT NULL,
    tax_deduction DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(12,2) NOT NULL,
    pay_date DATE,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, pay_period_start, pay_period_end)
);

-- =====================================================
-- Salary Structures Table
-- =====================================================
CREATE TABLE IF NOT EXISTS salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    min_salary DECIMAL(12,2) NOT NULL,
    max_salary DECIMAL(12,2) NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Performance Reviews Table
-- =====================================================
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES employees(id),
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    goals_achievement INTEGER CHECK (goals_achievement >= 1 AND goals_achievement <= 5),
    communication_skills INTEGER CHECK (communication_skills >= 1 AND communication_skills <= 5),
    teamwork INTEGER CHECK (teamwork >= 1 AND teamwork <= 5),
    technical_skills INTEGER CHECK (technical_skills >= 1 AND technical_skills <= 5),
    comments TEXT,
    employee_comments TEXT,
    improvement_areas TEXT,
    goals_next_period TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Audit Logs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- System Settings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- File Uploads Table
-- =====================================================
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    size INTEGER,
    uploaded_by UUID REFERENCES users(id),
    related_table VARCHAR(100),
    related_id UUID,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_department_id ON projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);

-- Leave requests indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_pay_period ON payroll(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_pay_date ON payroll(pay_date);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- Triggers for Updated At
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trigger_update_%I_updated_at ON %I;
            CREATE TRIGGER trigger_update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- Employee details with user info
CREATE OR REPLACE VIEW employee_details AS
SELECT 
    e.*,
    u.email as user_email,
    u.role as user_role,
    u.is_active as user_active,
    u.last_login,
    m.first_name as manager_first_name,
    m.last_name as manager_last_name,
    m.email as manager_email
FROM employees e
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN employees m ON e.manager_id = m.id;

-- Project progress view
CREATE OR REPLACE VIEW project_progress AS
SELECT 
    p.*,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    ROUND(
        CASE 
            WHEN COUNT(t.id) > 0 
            THEN (COUNT(CASE WHEN t.status = 'completed' THEN 1 END) * 100.0 / COUNT(t.id))
            ELSE 0 
        END, 2
    ) as completion_percentage,
    m.first_name as manager_first_name,
    m.last_name as manager_last_name
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN employees m ON p.manager_id = m.id
GROUP BY p.id, m.first_name, m.last_name;

-- Employee attendance summary
CREATE OR REPLACE VIEW employee_attendance_summary AS
SELECT 
    e.id as employee_id,
    e.first_name,
    e.last_name,
    e.employee_id,
    DATE_TRUNC('month', a.date) as month,
    COUNT(*) as total_days,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
    ROUND(
        (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as attendance_percentage
FROM employees e
LEFT JOIN attendance a ON e.id = a.employee_id
WHERE a.date IS NOT NULL
GROUP BY e.id, e.first_name, e.last_name, e.employee_id, DATE_TRUNC('month', a.date);

-- =====================================================
-- Functions for Business Logic
-- =====================================================

-- Function to calculate working days between dates
CREATE OR REPLACE FUNCTION calculate_working_days(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
    working_days INTEGER := 0;
    current_date DATE := start_date;
BEGIN
    WHILE current_date <= end_date LOOP
        -- Exclude weekends (Saturday = 6, Sunday = 0)
        IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
            working_days := working_days + 1;
        END IF;
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN working_days;
END;
$$ LANGUAGE plpgsql;

-- Function to get employee hierarchy
CREATE OR REPLACE FUNCTION get_employee_hierarchy(emp_id UUID)
RETURNS TABLE(
    id UUID,
    employee_id VARCHAR,
    full_name TEXT,
    level INTEGER
) AS $$
WITH RECURSIVE hierarchy AS (
    -- Base case: selected employee
    SELECT 
        e.id,
        e.employee_id,
        e.first_name || ' ' || e.last_name as full_name,
        0 as level
    FROM employees e
    WHERE e.id = emp_id
    
    UNION ALL
    
    -- Recursive case: direct reports
    SELECT 
        e.id,
        e.employee_id,
        e.first_name || ' ' || e.last_name as full_name,
        h.level + 1
    FROM employees e
    INNER JOIN hierarchy h ON e.manager_id = h.id
)
SELECT * FROM hierarchy;
$$ LANGUAGE sql;
EOF

# Execute schema creation
log $YELLOW "Executing schema creation..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/schema.sql > /dev/null 2>&1; then
    log $GREEN "✅ Database schema created successfully"
else
    log $RED "❌ Failed to create database schema"
    log $RED "Check the SQL file at /tmp/schema.sql for details"
    exit 1
fi

# Clean up temporary file
rm -f /tmp/schema.sql

# Verify schema creation
log $YELLOW "Verifying schema creation..."
table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
")

if [[ $table_count -gt 0 ]]; then
    log $GREEN "✅ Schema verification complete. Created $table_count tables."
    
    # List created tables
    log $CYAN "Created tables:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
    "
else
    log $RED "❌ Schema verification failed. No tables found."
    exit 1
fi

echo ""
log $GREEN "✅ Database schema creation completed successfully!"
log $YELLOW "Next steps:"
log $YELLOW "  1. Run initial data seeding: ./seed-initial-data.sh"
log $YELLOW "  2. Run test data creation: ./create-test-data.sh"
log $YELLOW "  3. Start the application: ../start.sh"
echo ""
