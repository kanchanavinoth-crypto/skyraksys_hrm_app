-- PostgreSQL Production Database Setup for Skyraksys HRM
-- This script creates the complete database schema with indexes and constraints

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with enhanced security
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('employee', 'manager', 'admin')),
    department VARCHAR(100),
    job_title VARCHAR(100),
    hire_date DATE,
    salary DECIMAL(12,2),
    manager_id INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timesheets table with enhanced tracking
CREATE TABLE timesheets (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    break_duration INTEGER DEFAULT 0,
    total_hours DECIMAL(4,2) GENERATED ALWAYS AS (
        CASE 
            WHEN end_time IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 - (break_duration::decimal / 60)
            ELSE 0 
        END
    ) STORED,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    project_name VARCHAR(100),
    task_description TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    overtime_rate DECIMAL(5,2) DEFAULT 1.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Leave requests table with workflow support
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('vacation', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reason TEXT,
    manager_notes TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    handover_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (end_date >= start_date),
    CHECK (days_requested > 0)
);

-- Leave balances table
CREATE TABLE leave_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 0,
    used_days INTEGER NOT NULL DEFAULT 0,
    remaining_days INTEGER GENERATED ALWAYS AS (total_days - used_days) STORED,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, leave_type, year),
    CHECK (used_days >= 0),
    CHECK (total_days >= 0)
);

-- Payslips table
CREATE TABLE payslips (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    gross_salary DECIMAL(12,2) NOT NULL,
    basic_salary DECIMAL(12,2) NOT NULL,
    allowances DECIMAL(12,2) DEFAULT 0,
    overtime_amount DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    tax_deduction DECIMAL(12,2) DEFAULT 0,
    insurance_deduction DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'acknowledged')),
    generated_by INTEGER REFERENCES users(id),
    generated_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (pay_period_end >= pay_period_start),
    CHECK (gross_salary >= 0),
    CHECK (net_salary >= 0)
);

-- Tasks table for project management
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    project_name VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
    due_date DATE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2) DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    tags TEXT[], -- PostgreSQL array for tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Audit log table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_manager_id ON users(manager_id);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_timesheets_user_id ON timesheets(user_id);
CREATE INDEX idx_timesheets_date ON timesheets(date);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_timesheets_user_date ON timesheets(user_id, date);

CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_type ON leave_requests(type);

CREATE INDEX idx_leave_balances_user_id ON leave_balances(user_id);
CREATE INDEX idx_leave_balances_year ON leave_balances(year);

CREATE INDEX idx_payslips_user_id ON payslips(user_id);
CREATE INDEX idx_payslips_period ON payslips(pay_period_start, pay_period_end);
CREATE INDEX idx_payslips_status ON payslips(status);

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payslips_updated_at BEFORE UPDATE ON payslips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category) VALUES
('company_name', 'Skyraksys Technologies', 'Company name displayed in the application', 'company'),
('company_address', '123 Tech Street, Innovation City, IC 12345', 'Company address for official documents', 'company'),
('company_phone', '+1 (555) 123-4567', 'Company contact phone number', 'company'),
('company_email', 'hr@skyraksys.com', 'Company HR email address', 'company'),
('working_hours_per_day', '8', 'Standard working hours per day', 'policy'),
('working_days_per_week', '5', 'Standard working days per week', 'policy'),
('overtime_threshold', '8', 'Hours threshold for overtime calculation', 'policy'),
('annual_leave_days', '25', 'Default annual leave days for employees', 'policy'),
('sick_leave_days', '10', 'Default sick leave days per year', 'policy'),
('probation_period_months', '6', 'Probation period in months', 'policy'),
('password_min_length', '8', 'Minimum password length requirement', 'security'),
('password_require_special', 'true', 'Require special characters in passwords', 'security'),
('session_timeout_minutes', '480', 'Session timeout in minutes', 'security'),
('backup_retention_days', '90', 'Database backup retention period in days', 'system'),
('email_notifications', 'true', 'Enable email notifications', 'notifications'),
('sms_notifications', 'false', 'Enable SMS notifications', 'notifications');

-- Create a view for employee dashboard
CREATE VIEW employee_dashboard AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.department,
    u.job_title,
    COALESCE(SUM(CASE WHEN t.status = 'approved' AND t.date >= DATE_TRUNC('month', NOW()) THEN t.total_hours ELSE 0 END), 0) as current_month_hours,
    COALESCE(COUNT(CASE WHEN lr.status = 'pending' THEN 1 END), 0) as pending_leave_requests,
    COALESCE(SUM(lb.remaining_days), 0) as total_leave_balance
FROM users u
LEFT JOIN timesheets t ON u.id = t.user_id
LEFT JOIN leave_requests lr ON u.id = lr.user_id
LEFT JOIN leave_balances lb ON u.id = lb.user_id AND lb.year = EXTRACT(YEAR FROM NOW())
WHERE u.is_active = true
GROUP BY u.id, u.first_name, u.last_name, u.email, u.department, u.job_title;

-- Create a view for manager dashboard
CREATE VIEW manager_dashboard AS
SELECT 
    m.id as manager_id,
    m.first_name as manager_first_name,
    m.last_name as manager_last_name,
    COUNT(DISTINCT e.id) as total_team_members,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_timesheets,
    COUNT(CASE WHEN lr.status = 'pending' THEN 1 END) as pending_leave_requests,
    COALESCE(AVG(ts.total_hours), 0) as avg_weekly_hours
FROM users m
LEFT JOIN users e ON m.id = e.manager_id AND e.is_active = true
LEFT JOIN timesheets t ON e.id = t.user_id AND t.date >= NOW() - INTERVAL '30 days'
LEFT JOIN leave_requests lr ON e.id = lr.user_id AND lr.status = 'pending'
LEFT JOIN timesheets ts ON e.id = ts.user_id AND ts.date >= NOW() - INTERVAL '7 days' AND ts.status = 'approved'
WHERE m.role IN ('manager', 'admin') AND m.is_active = true
GROUP BY m.id, m.first_name, m.last_name;

-- Grant permissions to the application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hrm_admin;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO hrm_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO hrm_admin;

-- Insert sample admin user (password: Admin123!)
INSERT INTO users (email, password_hash, first_name, last_name, role, department, job_title, hire_date, is_active, email_verified)
VALUES (
    'admin@skyraksys.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBRf.SD9xMqWru', -- Admin123!
    'System',
    'Administrator',
    'admin',
    'IT',
    'System Administrator',
    NOW()::date,
    true,
    true
);

-- Initialize leave balances for the admin user
INSERT INTO leave_balances (user_id, leave_type, total_days, used_days, year)
SELECT 
    id,
    unnest(ARRAY['vacation', 'sick', 'personal']) as leave_type,
    CASE 
        WHEN unnest(ARRAY['vacation', 'sick', 'personal']) = 'vacation' THEN 25
        WHEN unnest(ARRAY['vacation', 'sick', 'personal']) = 'sick' THEN 10
        WHEN unnest(ARRAY['vacation', 'sick', 'personal']) = 'personal' THEN 5
    END as total_days,
    0 as used_days,
    EXTRACT(YEAR FROM NOW()) as year
FROM users 
WHERE email = 'admin@skyraksys.com';

-- Log the successful setup
INSERT INTO audit_logs (action, table_name, new_values, created_at)
VALUES ('DATABASE_SETUP', 'system', '{"message": "Database schema created successfully", "version": "1.0"}', NOW());

-- Display setup completion message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PostgreSQL Database Setup Complete! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database: skyraksys_hrm';
    RAISE NOTICE '👤 Admin User: admin@skyraksys.com';
    RAISE NOTICE '🔑 Password: Admin123!';
    RAISE NOTICE '';
    RAISE NOTICE '📈 Tables Created: % tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE');
    RAISE NOTICE '🔍 Indexes Created: % indexes', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public');
    RAISE NOTICE '⚡ Views Created: % views', (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public');
    RAISE NOTICE '';
    RAISE NOTICE '✅ Ready for production deployment!';
END$$;
