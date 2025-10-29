# Skyraksys HRM - Complete Manual Setup Guide for Novice Users
**Step-by-Step Installation Guide for RHEL 9.6 Production Environment**

*Created: November 2024*  
*Target Audience: Complete Beginners*  
*Estimated Setup Time: 2-4 hours*

---

## 📋 Table of Contents
1. [Prerequisites and Planning](#prerequisites-and-planning)
2. [Server Preparation](#server-preparation)
3. [Manual Software Installation](#manual-software-installation)
4. [Database Setup and Configuration](#database-setup-and-configuration)
5. [Application Installation](#application-installation)
6. [Web Server Configuration](#web-server-configuration)
7. [Security Configuration](#security-configuration)
8. [Testing and Verification](#testing-and-verification)
9. [Troubleshooting Common Issues](#troubleshooting-common-issues)
10. [Post-Installation Tasks](#post-installation-tasks)

---

## 🎯 Prerequisites and Planning

### What You Need Before Starting

**Hardware Requirements:**
- Server with minimum 4GB RAM (8GB+ recommended)
- At least 100GB free disk space
- 2+ CPU cores (4+ recommended)
- Network connection with stable internet

**Access Requirements:**
- Root access to RHEL 9.6 server
- Basic command line knowledge
- Domain name (optional but recommended)
- Email account for notifications

**Skills Required:**
- Basic Linux command line usage
- Text editor usage (nano, vim, or vi)
- Understanding of file permissions
- Basic networking concepts

### Planning Your Installation

**1. Choose Your Domain Setup:**
- Production: Use a real domain (e.g., hrm.yourcompany.com)
- Testing: Use server IP address or localhost
- Development: Use localhost

**2. Plan Your Passwords:**
- Database password (strong, 16+ characters)
- Application passwords (complex combinations)
- SSL certificate email (valid email address)

**🔐 Critical Security Planning:**
```bash
# Example Strong Passwords (CHANGE THESE!)
Database Password: Sk7R@k$y$_DB_2024!#
JWT Secret: 8f2e4c1a9b7d5e3f0a1b2c3d4e5f6789abcdef01234567890123456789abcdef
Session Secret: 9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b
```

**⚠️ Security Checklist:**
- [ ] Never use default passwords in production
- [ ] Use different passwords for each service
- [ ] JWT secrets must be minimum 64 characters
- [ ] Database credentials must be complex
- [ ] All passwords must include: uppercase, lowercase, numbers, symbols

**3. Backup Strategy:**
- Plan backup storage location
- Decide on backup retention period
- Test backup/restore procedures

---

## 🖥️ Server Preparation

### Step 1: Initial Server Setup

**1.1 Connect to Your Server**
```bash
# If using SSH from another machine
ssh root@your-server-ip

# Or log in directly at the server console
```

**1.2 Update the System**
```bash
# Check current system version
cat /etc/redhat-release
# Should show: Red Hat Enterprise Linux release 9.6

# Update all packages to latest version
dnf update -y

# Reboot if kernel was updated
reboot
```

**1.3 Set System Hostname**
```bash
# Set a meaningful hostname
hostnamectl set-hostname hrm-production

# Verify the change
hostnamectl status
```

**1.4 Configure Timezone**
```bash
# List available timezones
timedatectl list-timezones | grep Asia

# Set your timezone (example: India)
timedatectl set-timezone Asia/Kolkata

# Verify timezone setting
timedatectl status
```

**1.5 Create Application User**
```bash
# Create dedicated user for HRM application
useradd -r -m -s /bin/bash hrmapp

# Add user to sudo group
usermod -aG wheel hrmapp

# Set password for hrmapp user
passwd hrmapp
# Enter a strong password when prompted
```

---

## 💿 Manual Software Installation

### Step 2: Install Node.js

**2.1 Add Node.js Repository**
```bash
# Download Node.js 18.x repository
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -

# Verify repository was added
ls /etc/yum.repos.d/ | grep nodesource
```

**2.2 Install Node.js**
```bash
# Install Node.js and npm
dnf install -y nodejs

# Verify installation
node --version
# Should show: v18.x.x

npm --version
# Should show: 9.x.x or higher
```

**2.3 Install PM2 Process Manager**
```bash
# Install PM2 globally
npm install -g pm2

# Verify PM2 installation
pm2 --version

# Set up PM2 startup script
pm2 startup
# Follow the command it provides
```

### Step 3: Install PostgreSQL Database

**3.1 Install PostgreSQL 15**
```bash
# Install PostgreSQL server and contrib packages
dnf install -y postgresql15-server postgresql15-contrib postgresql15-devel

# Verify installation
postgres --version
```

**3.2 Initialize PostgreSQL Database**
```bash
# Initialize the database
/usr/pgsql-15/bin/postgresql-15-setup initdb

# Enable and start PostgreSQL service
systemctl enable postgresql-15
systemctl start postgresql-15

# Check service status
systemctl status postgresql-15
# Should show "active (running)"
```

**3.3 Configure PostgreSQL**
```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt:
# Create database and user
CREATE DATABASE skyraksys_hrm_prod;

# NOVICE USERS: Use the password from the .env template: Sk7R@k$y$_DB_2024!#
# ADVANCED USERS: Use your generated password from Step 8.2.1
CREATE USER hrm_app WITH PASSWORD 'Sk7R@k$y$_DB_2024!#';
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_app;

# Connect to the new database
\c skyraksys_hrm_prod;

# Grant additional privileges
GRANT ALL ON SCHEMA public TO hrm_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hrm_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hrm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hrm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hrm_app;

# Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

# Exit PostgreSQL
\q
```

### Step 4: Install Web Server (Nginx)

**4.1 Install Nginx**
```bash
# Install Nginx web server
dnf install -y nginx

# Enable and start Nginx
systemctl enable nginx
systemctl start nginx

# Check Nginx status
systemctl status nginx

# Verify Nginx is working
curl http://localhost
# Should return HTML content
```

### Step 5: Install Redis (for Caching)

**5.1 Install and Configure Redis**
```bash
# Install Redis server
dnf install -y redis

# Enable and start Redis
systemctl enable redis
systemctl start redis

# Test Redis connection
redis-cli ping
# Should return "PONG"
```

### Step 6: Install Development Tools

**6.1 Install Compiler and Build Tools**
```bash
# Install development tools group
dnf groupinstall -y "Development Tools"

# Install additional useful tools
dnf install -y git curl wget unzip vim nano htop tree bc

# Verify Git installation
git --version
```

---

## 🗃️ Database Setup and Configuration

### Step 7: Create Database Schema

**7.1 Create Application Directories**
```bash
# Create main application directory
mkdir -p /opt/skyraksys-hrm
mkdir -p /opt/skyraksys-hrm/backend
mkdir -p /opt/skyraksys-hrm/frontend
mkdir -p /opt/skyraksys-hrm/uploads
mkdir -p /opt/skyraksys-hrm/backups

# Create log directory
mkdir -p /var/log/skyraksys-hrm

# Set ownership to application user
chown -R hrmapp:hrmapp /opt/skyraksys-hrm
chown -R hrmapp:hrmapp /var/log/skyraksys-hrm
```

**7.2 Create Database Tables**
```bash
# Create database schema file
nano /tmp/create_hrm_schema.sql
```

Copy and paste the following complete schema:

```sql
-- Skyraksys HRM Complete Database Schema
-- RHEL 9.6 Production Version

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- USERS TABLE
-- ==============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'hr', 'manager', 'employee')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- DEPARTMENTS TABLE
-- ==============================================
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    head_id INTEGER,
    budget DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- POSITIONS TABLE
-- ==============================================
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    description TEXT,
    min_salary DECIMAL(12,2),
    max_salary DECIMAL(12,2),
    requirements TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- EMPLOYEES TABLE (UUID Primary Key)
-- ==============================================
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    hire_date DATE NOT NULL,
    joining_date DATE,
    department_id INTEGER REFERENCES departments(id),
    position_id INTEGER REFERENCES positions(id),
    salary DECIMAL(12,2),
    manager_id UUID REFERENCES employees(id),
    bank_account VARCHAR(20),
    pan_number VARCHAR(20),
    aadhar_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    termination_date DATE,
    termination_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ==============================================
-- PAYSLIP TEMPLATES TABLE (UUID Primary Key)
-- ==============================================
CREATE TABLE payslip_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) DEFAULT 'standard',
    description TEXT,
    configuration JSONB DEFAULT '{}',
    earnings_structure JSONB DEFAULT '{}',
    deductions_structure JSONB DEFAULT '{}',
    company_info JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ==============================================
-- SALARY STRUCTURES TABLE
-- ==============================================
CREATE TABLE salary_structures (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    template_id UUID REFERENCES payslip_templates(id),
    basic_salary DECIMAL(12,2) NOT NULL,
    hra DECIMAL(12,2) DEFAULT 0,
    medical_allowance DECIMAL(12,2) DEFAULT 0,
    transport_allowance DECIMAL(12,2) DEFAULT 0,
    special_allowance DECIMAL(12,2) DEFAULT 0,
    other_allowances JSONB DEFAULT '{}',
    pf_deduction DECIMAL(12,2) DEFAULT 0,
    esic_deduction DECIMAL(12,2) DEFAULT 0,
    professional_tax DECIMAL(12,2) DEFAULT 0,
    income_tax DECIMAL(12,2) DEFAULT 0,
    other_deductions JSONB DEFAULT '{}',
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- PAYROLL DATA TABLE
-- ==============================================
CREATE TABLE payroll_data (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    pay_period DATE NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    earnings_data JSONB DEFAULT '{}',
    deductions_data JSONB DEFAULT '{}',
    attendance_data JSONB DEFAULT '{}',
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    incentive_amount DECIMAL(10,2) DEFAULT 0,
    loan_deduction DECIMAL(10,2) DEFAULT 0,
    advance_deduction DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, month, year)
);

-- ==============================================
-- PAYSLIPS TABLE (UUID Primary Key)
-- ==============================================
CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    template_id UUID REFERENCES payslip_templates(id),
    payroll_data_id INTEGER REFERENCES payroll_data(id),
    pay_period VARCHAR(50) NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    earnings JSONB DEFAULT '{}',
    deductions JSONB DEFAULT '{}',
    attendance JSONB DEFAULT '{}',
    gross_salary DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2) DEFAULT 0,
    net_salary_in_words TEXT,
    payslip_number VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('draft', 'generated', 'approved', 'paid', 'cancelled')),
    is_locked BOOLEAN DEFAULT false,
    pdf_path VARCHAR(500),
    disbursement_date DATE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    paid_at TIMESTAMP,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(employee_id, month, year)
);

-- ==============================================
-- ATTENDANCE TABLE
-- ==============================================
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'leave', 'holiday')),
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    break_time DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- ==============================================
-- LEAVE TYPES TABLE
-- ==============================================
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    max_days_per_year INTEGER DEFAULT 0,
    carry_forward_allowed BOOLEAN DEFAULT false,
    max_carry_forward_days INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- LEAVE REQUESTS TABLE
-- ==============================================
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id INTEGER REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejected_by INTEGER REFERENCES users(id),
    rejection_reason TEXT,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- LEAVE BALANCES TABLE
-- ==============================================
CREATE TABLE leave_balances (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id INTEGER REFERENCES leave_types(id),
    year INTEGER NOT NULL,
    allocated_days INTEGER DEFAULT 0,
    used_days INTEGER DEFAULT 0,
    pending_days INTEGER DEFAULT 0,
    carry_forward_days INTEGER DEFAULT 0,
    remaining_days INTEGER GENERATED ALWAYS AS (allocated_days + carry_forward_days - used_days - pending_days) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, leave_type_id, year)
);

-- ==============================================
-- PROJECTS TABLE
-- ==============================================
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    client_name VARCHAR(200),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    project_manager_id UUID REFERENCES employees(id),
    budget DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- TASKS TABLE
-- ==============================================
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES employees(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    start_date DATE,
    due_date DATE,
    completed_date DATE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- TIMESHEETS TABLE
-- ==============================================
CREATE TABLE timesheets (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id),
    task_id INTEGER REFERENCES tasks(id),
    date DATE NOT NULL,
    hours_worked DECIMAL(4,2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- PAYROLL COMPONENTS TABLE
-- ==============================================
CREATE TABLE payroll_components (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    component_type VARCHAR(20) NOT NULL CHECK (component_type IN ('earning', 'deduction')),
    calculation_type VARCHAR(20) DEFAULT 'fixed' CHECK (calculation_type IN ('fixed', 'percentage', 'formula')),
    default_value DECIMAL(12,2) DEFAULT 0,
    is_taxable BOOLEAN DEFAULT false,
    is_mandatory BOOLEAN DEFAULT false,
    formula TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- PAYROLL TABLE
-- ==============================================
CREATE TABLE payrolls (
    id SERIAL PRIMARY KEY,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'cancelled')),
    total_employees INTEGER DEFAULT 0,
    total_gross DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    total_net DECIMAL(15,2) DEFAULT 0,
    processed_at TIMESTAMP,
    processed_by INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, year)
);

-- ==============================================
-- REFRESH TOKENS TABLE
-- ==============================================
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

-- ==============================================
-- AUDIT LOG TABLE
-- ==============================================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for department head
ALTER TABLE departments ADD CONSTRAINT fk_departments_head FOREIGN KEY (head_id) REFERENCES employees(id);

-- Grant all privileges to application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hrm_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hrm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hrm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hrm_app;
```

**7.3 Execute Database Schema Creation**
```bash
# Run the schema creation script
sudo -u postgres psql -d skyraksys_hrm_prod -f /tmp/create_hrm_schema.sql

# Verify tables were created
sudo -u postgres psql -d skyraksys_hrm_prod -c "\\dt"
# Should list all created tables

# Check table count
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

**7.4 Create Database Indexes**
```bash
# Create indexes for better performance
nano /tmp/create_indexes.sql
```

Copy and paste the following indexes:

```sql
-- Performance Indexes for HRM Database

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Employees table indexes
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_position ON employees(position_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_active ON employees(is_active);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);

-- Payslips table indexes
CREATE INDEX idx_payslips_employee ON payslips(employee_id);
CREATE INDEX idx_payslips_month_year ON payslips(month, year);
CREATE INDEX idx_payslips_status ON payslips(status);
CREATE INDEX idx_payslips_generated ON payslips(generated_at);
CREATE INDEX idx_payslips_number ON payslips(payslip_number);

-- Attendance table indexes
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- Leave requests indexes
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- Timesheets indexes
CREATE INDEX idx_timesheets_employee_date ON timesheets(employee_id, date);
CREATE INDEX idx_timesheets_project ON timesheets(project_id);
CREATE INDEX idx_timesheets_task ON timesheets(task_id);

-- Payroll data indexes
CREATE INDEX idx_payroll_data_employee_period ON payroll_data(employee_id, month, year);
CREATE INDEX idx_payroll_data_period ON payroll_data(pay_period);

-- Projects and tasks indexes
CREATE INDEX idx_projects_manager ON projects(project_manager_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
```

Run the indexes creation:
```bash
sudo -u postgres psql -d skyraksys_hrm_prod -f /tmp/create_indexes.sql
```

**7.5 Insert Sample Data**
```bash
# Create sample data file
nano /tmp/insert_sample_data.sql
```

Copy and paste sample data:

```sql
-- Sample Data for HRM System

-- Insert default leave types
INSERT INTO leave_types (name, description, max_days_per_year, carry_forward_allowed, max_carry_forward_days, is_paid) VALUES
('Annual Leave', 'Annual vacation leave', 21, true, 5, true),
('Sick Leave', 'Medical leave', 12, false, 0, true),
('Maternity Leave', 'Maternity leave for female employees', 180, false, 0, true),
('Paternity Leave', 'Paternity leave for male employees', 15, false, 0, true),
('Casual Leave', 'Casual/Personal leave', 12, false, 0, true),
('Emergency Leave', 'Emergency situations', 5, false, 0, true);

-- Insert default departments
INSERT INTO departments (name, description) VALUES
('Information Technology', 'Software development and IT operations'),
('Human Resources', 'Employee management and HR operations'),
('Finance & Accounting', 'Financial management and accounting'),
('Marketing', 'Marketing and sales operations'),
('Administration', 'General administration and support');

-- Insert default positions
INSERT INTO positions (title, department_id, description, min_salary, max_salary) VALUES
('Software Engineer', 1, 'Full-stack software development', 60000, 120000),
('Senior Developer', 1, 'Senior software development role', 90000, 180000),
('IT Manager', 1, 'IT department management', 120000, 200000),
('HR Manager', 2, 'Human resources management', 80000, 150000),
('HR Executive', 2, 'Human resources operations', 50000, 90000),
('Finance Manager', 3, 'Financial management and reporting', 100000, 180000),
('Accountant', 3, 'Accounting and bookkeeping', 45000, 80000),
('Marketing Executive', 4, 'Marketing and sales activities', 40000, 80000),
('Marketing Manager', 4, 'Marketing department management', 80000, 150000),
('Admin Executive', 5, 'Administrative support', 35000, 60000);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeQJaGWFD8oPG5/Ny', 'admin'),
('hr_manager', 'hr@skyraksys.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeQJaGWFD8oPG5/Ny', 'hr');

-- Insert default payroll components
INSERT INTO payroll_components (name, component_type, calculation_type, default_value, is_taxable, is_mandatory) VALUES
('Basic Salary', 'earning', 'fixed', 0, true, true),
('House Rent Allowance', 'earning', 'percentage', 40, true, false),
('Medical Allowance', 'earning', 'fixed', 1250, false, false),
('Conveyance Allowance', 'earning', 'fixed', 1600, false, false),
('Special Allowance', 'earning', 'percentage', 15, true, false),
('Provident Fund', 'deduction', 'percentage', 12, false, true),
('Professional Tax', 'deduction', 'fixed', 200, false, false),
('Income Tax (TDS)', 'deduction', 'percentage', 10, false, false),
('ESI Contribution', 'deduction', 'percentage', 0.75, false, false);

-- Insert default payslip template
INSERT INTO payslip_templates (name, template_type, description, company_info, is_default, is_active) VALUES
('SKYRAKSYS Standard Template', 'standard', 'Default payslip template for SKYRAKSYS', 
'{"company_name": "SKYRAKSYS TECHNOLOGIES LLP", "address": "Plot-No: 27E, G.S.T. Road, Guduvanchery, Chennai, Tamil Nadu, 603202 India", "phone": "+91 89398 88577", "email": "info@skyraksys.com", "website": "https://www.skyraksys.com", "gst": "33AABCS1234C1Z5"}',
true, true);
```

Run the sample data insertion:
```bash
sudo -u postgres psql -d skyraksys_hrm_prod -f /tmp/insert_sample_data.sql
```

---

## 💻 Application Installation

### Step 8: Prepare Application Environment

**8.1 Create Environment Configuration**

**🎯 NOVICE USERS - EASY SETUP OPTION:**

**Option A: Quick Setup (Recommended for Beginners)**
1. Use the **pre-configured template** with passwords from this guide
2. See: `redhatprod/QUICK_ENV_SETUP_FOR_NOVICES.md` 
3. Only need to change 3 values: domain, email, email password

**Option B: Custom Security Setup (Advanced Users)**

**⚠️ CRITICAL: Password Security Instructions**

Before creating the .env file, you MUST:
1. **Generate Strong Passwords:** Use a password manager or generator
2. **Create Unique Secrets:** Each JWT secret must be unique and 64+ characters
3. **Document Safely:** Store passwords in a secure location
4. **Never Commit:** Ensure .env files are never added to version control

```bash
# Create environment file (Option A: Copy template)
cp /path/to/redhatprod/templates/.env.production.template /opt/skyraksys-hrm/.env

# OR (Option B: Create manually)
nano /opt/skyraksys-hrm/.env
```

**For Option B, copy and paste the following configuration (**REPLACE ALL PASSWORDS AND SECRETS**):**

```bash
# Skyraksys HRM Environment Configuration - Production
NODE_ENV=production
PORT=5000
FRONTEND_PORT=3000
API_BASE_URL=http://your-domain.com/api
FRONTEND_URL=http://your-domain.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=hrm_app
DB_PASSWORD=REPLACE_WITH_YOUR_SECURE_DATABASE_PASSWORD
DB_DIALECT=postgres
DB_SSL=false

# Security Configuration - MANDATORY TO CHANGE!
JWT_SECRET=REPLACE_WITH_64_CHAR_JWT_SECRET_KEY_LIKE_8f2e4c1a9b7d5e3f0a1b2c3d4e5f6789abcdef01234567890123456789abcdef
JWT_REFRESH_SECRET=REPLACE_WITH_64_CHAR_REFRESH_SECRET_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=REPLACE_WITH_SESSION_SECRET_32_PLUS_CHARACTERS_LONG
BCRYPT_ROUNDS=12

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@skyraksys.com
FROM_NAME=SKYRAKSYS HRM System

# File Upload Configuration
UPLOAD_PATH=/opt/skyraksys-hrm/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx

# PDF Generation
PDF_OUTPUT_PATH=/opt/skyraksys-hrm/uploads/payslips
PDF_TEMP_PATH=/tmp/hrm-pdfs

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/skyraksys-hrm/application.log
ERROR_LOG_FILE=/var/log/skyraksys-hrm/error.log
ACCESS_LOG_FILE=/var/log/skyraksys-hrm/access.log

# Company Information
COMPANY_NAME=SKYRAKSYS TECHNOLOGIES LLP
COMPANY_ADDRESS=Plot-No: 27E, G.S.T. Road, Guduvanchery, Chennai, Tamil Nadu, 603202 India
COMPANY_EMAIL=info@skyraksys.com
COMPANY_PHONE=+91 89398 88577
COMPANY_WEBSITE=https://www.skyraksys.com
COMPANY_GST=33AABCS1234C1Z5
COMPANY_PAN=AABCS1234C

# Payroll Configuration
DEFAULT_WORKING_DAYS=22
PF_MAX_LIMIT=1800
PROFESSIONAL_TAX_LIMIT=15000
ESI_SALARY_LIMIT=25000
TDS_EXEMPTION_LIMIT=50000

# Security Headers and CORS
CORS_ORIGIN=http://your-domain.com
ALLOWED_ORIGINS=http://localhost:3000,http://your-domain.com
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Backup Configuration
BACKUP_RETENTION_DAYS=30
AUTO_BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
```

**8.2 🔐 Configure Passwords and Secrets (CRITICAL STEP)**

**Step-by-Step Password Configuration:**

**8.2.1 Generate Database Password**
```bash
# Generate a strong database password (20+ characters)
# Example using openssl (or use a password manager):
openssl rand -base64 32 | head -c 24 && echo

# Example result: Kd9#mP2$vX8@nQ5%wL7!fS3Z
# Use this to replace: REPLACE_WITH_YOUR_SECURE_DATABASE_PASSWORD
```

**8.2.2 Generate JWT Secrets**
```bash
# Generate 64-character JWT secret
openssl rand -hex 64

# Example result: 8f2e4c1a9b7d5e3f0a1b2c3d4e5f6789abcdef01234567890123456789abcdef01
# Use this to replace: REPLACE_WITH_64_CHAR_JWT_SECRET_KEY

# Generate different 64-character refresh secret
openssl rand -hex 64

# Example result: 9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b
# Use this to replace: REPLACE_WITH_64_CHAR_REFRESH_SECRET
```

**8.2.3 Generate Session Secret**
```bash
# Generate 32+ character session secret
openssl rand -base64 48 | head -c 48 && echo

# Example result: Nm8*pL5$wX3@rQ9%vK2!fS7ZgH4&nM1$oP6#bC8@dE1%
# Use this to replace: REPLACE_WITH_SESSION_SECRET_32_PLUS_CHARACTERS_LONG
```

**8.2.4 Update .env File with Generated Passwords**
```bash
# Edit the .env file with your generated passwords
nano /opt/skyraksys-hrm/.env

# Find and replace each placeholder:
# 1. REPLACE_WITH_YOUR_SECURE_DATABASE_PASSWORD → Your generated DB password
# 2. REPLACE_WITH_64_CHAR_JWT_SECRET_KEY → Your generated JWT secret  
# 3. REPLACE_WITH_64_CHAR_REFRESH_SECRET → Your generated refresh secret
# 4. REPLACE_WITH_SESSION_SECRET_32_PLUS_CHARACTERS_LONG → Your generated session secret
```

**8.2.5 Verify Password Configuration**
```bash
# Check that all placeholders are replaced
grep -E "(REPLACE_WITH|your_|change_this)" /opt/skyraksys-hrm/.env

# Should return NO results. If you see any "REPLACE_WITH" text, 
# you haven't finished updating the passwords!
```

**8.2.6 Set File Permissions**
```bash
# Set correct ownership and permissions
chown hrmapp:hrmapp /opt/skyraksys-hrm/.env
chmod 600 /opt/skyraksys-hrm/.env

# Create log files
touch /var/log/skyraksys-hrm/application.log
touch /var/log/skyraksys-hrm/error.log
touch /var/log/skyraksys-hrm/access.log
chown hrmapp:hrmapp /var/log/skyraksys-hrm/*.log
chmod 644 /var/log/skyraksys-hrm/*.log
```

**8.2.7 📝 Document Your Passwords**
```bash
# Create a secure password document (NEVER commit to git)
# Store this in a secure location like a password manager
cat > /opt/skyraksys-hrm/PASSWORDS_BACKUP.txt << EOF
# SKYRAKSYS HRM PRODUCTION PASSWORDS
# Generated on: $(date)
# 
# Database Password: [Your generated DB password]
# JWT Secret: [Your generated JWT secret]
# JWT Refresh Secret: [Your generated refresh secret]  
# Session Secret: [Your generated session secret]
#
# KEEP THIS FILE SECURE - DO NOT SHARE OR COMMIT TO GIT
EOF

# Secure the password file
chmod 600 /opt/skyraksys-hrm/PASSWORDS_BACKUP.txt
chown hrmapp:hrmapp /opt/skyraksys-hrm/PASSWORDS_BACKUP.txt
```

### Step 9: Deploy Application Code

**Option A: Deploy from Git Repository**
```bash
# Clone the application repository
cd /tmp
git clone https://github.com/your-org/skyraksys-hrm.git

# Copy backend code
cp -r /tmp/skyraksys-hrm/backend/* /opt/skyraksys-hrm/backend/

# Copy frontend code
cp -r /tmp/skyraksys-hrm/frontend/* /opt/skyraksys-hrm/frontend/

# Set ownership
chown -R hrmapp:hrmapp /opt/skyraksys-hrm/
```

**Option B: Upload Code Manually**
```bash
# If you have the code in a tar.gz file
cd /tmp
tar -xzf skyraksys-hrm.tar.gz

# Copy files
cp -r skyraksys-hrm/backend/* /opt/skyraksys-hrm/backend/
cp -r skyraksys-hrm/frontend/* /opt/skyraksys-hrm/frontend/

# Set ownership
chown -R hrmapp:hrmapp /opt/skyraksys-hrm/
```

### Step 10: Install Application Dependencies

**10.1 Install Backend Dependencies**
```bash
# Switch to application user
su - hrmapp

# Navigate to backend directory
cd /opt/skyraksys-hrm/backend

# Install Node.js dependencies
npm install --production

# Exit back to root
exit
```

**10.2 Install Frontend Dependencies and Build**
```bash
# Switch to application user
su - hrmapp

# Navigate to frontend directory
cd /opt/skyraksys-hrm/frontend

# Install dependencies
npm install

# Build production frontend
npm run build

# Exit back to root
exit
```

---

## 🌐 Web Server Configuration

### Step 11: Configure Nginx

**11.1 Create Nginx Configuration**
```bash
# Create nginx configuration for HRM
nano /etc/nginx/conf.d/hrm.conf
```

Copy and paste the following configuration:

```nginx
# Skyraksys HRM Nginx Configuration

upstream backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

upstream frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

server {
    listen 80;
    server_name your-domain.com;  # Change this to your actual domain
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Login endpoint rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files with caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf|zip)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend application
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Handle React Router
        try_files $uri $uri/ /index.html;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**11.2 Test Nginx Configuration**
```bash
# Test nginx configuration
nginx -t

# If configuration is valid, restart nginx
systemctl restart nginx
systemctl status nginx
```

### Step 12: Create Systemd Services

**12.1 Create Backend Service**
```bash
# Create systemd service file for backend
nano /etc/systemd/system/hrm-backend.service
```

Copy and paste:

```ini
[Unit]
Description=Skyraksys HRM Backend API Service
Documentation=https://github.com/your-org/skyraksys-hrm
After=network-online.target postgresql-15.service redis.service
Wants=network-online.target postgresql-15.service redis.service
Requires=postgresql-15.service

[Service]
Type=simple
User=hrmapp
Group=hrmapp
WorkingDirectory=/opt/skyraksys-hrm/backend
Environment=NODE_ENV=production
Environment=PORT=5000

# Load environment variables from file
EnvironmentFile=/opt/skyraksys-hrm/.env

# Start command
ExecStart=/usr/bin/node server.js

# Restart policy
Restart=always
RestartSec=10
StartLimitInterval=60
StartLimitBurst=3

# Health check
ExecReload=/bin/kill -HUP $MAINPID
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30

# Logging
StandardOutput=append:/var/log/skyraksys-hrm/backend.log
StandardError=append:/var/log/skyraksys-hrm/backend-error.log
SyslogIdentifier=hrm-backend

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
MemoryMax=1G
CPUQuota=200%

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/skyraksys-hrm /var/log/skyraksys-hrm /tmp

[Install]
WantedBy=multi-user.target
```

**12.2 Create Frontend Service**
```bash
# Create systemd service file for frontend
nano /etc/systemd/system/hrm-frontend.service
```

Copy and paste:

```ini
[Unit]
Description=Skyraksys HRM Frontend Service
Documentation=https://github.com/your-org/skyraksys-hrm
After=network-online.target hrm-backend.service
Wants=network-online.target hrm-backend.service

[Service]
Type=simple
User=hrmapp
Group=hrmapp
WorkingDirectory=/opt/skyraksys-hrm/frontend
Environment=NODE_ENV=production
Environment=PORT=3000

# Start command
ExecStart=/usr/bin/npm start

# Restart policy
Restart=always
RestartSec=10
StartLimitInterval=60
StartLimitBurst=3

# Logging
StandardOutput=append:/var/log/skyraksys-hrm/frontend.log
StandardError=append:/var/log/skyraksys-hrm/frontend-error.log
SyslogIdentifier=hrm-frontend

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
MemoryMax=512M

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/skyraksys-hrm /var/log/skyraksys-hrm

[Install]
WantedBy=multi-user.target
```

**12.3 Enable and Start Services**
```bash
# Reload systemd daemon
systemctl daemon-reload

# Enable services to start on boot
systemctl enable hrm-backend
systemctl enable hrm-frontend

# Start services
systemctl start hrm-backend
systemctl start hrm-frontend

# Check service status
systemctl status hrm-backend
systemctl status hrm-frontend
```

---

## 🔐 Security Configuration

### Step 13: Configure Firewall

**13.1 Configure Firewalld**
```bash
# Enable and start firewall
systemctl enable firewalld
systemctl start firewalld

# Add HTTP and HTTPS services
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh

# Remove unnecessary services
firewall-cmd --permanent --remove-service=dhcpv6-client

# Apply firewall rules
firewall-cmd --reload

# Verify firewall status
firewall-cmd --list-all
```

**13.2 Install and Configure Fail2ban**
```bash
# Install fail2ban
dnf install -y fail2ban

# Create fail2ban configuration
nano /etc/fail2ban/jail.d/hrm.conf
```

Copy and paste:

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/secure
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

Start fail2ban:
```bash
systemctl enable fail2ban
systemctl start fail2ban
systemctl status fail2ban
```

---

## 🧪 Testing and Verification

### Step 14: System Testing

**14.1 Database Connection Test**
```bash
# Test database connection
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT 'Database connection successful' as status;"

# Check table count
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

**14.2 Application Service Test**
```bash
# Check if backend is responding
curl http://localhost:5000/api/health

# Check if frontend is serving
curl http://localhost:3000

# Check full application through nginx
curl http://localhost/health
```

**14.3 End-to-End Application Test**
```bash
# Open your web browser and navigate to:
# http://your-server-ip or http://your-domain.com

# Try logging in with default credentials:
# Username: admin
# Password: admin123
```

### Step 15: Performance Verification

**15.1 Check System Resources**
```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check CPU usage
top

# Check running services
systemctl list-units --type=service --state=active | grep hrm
```

**15.2 Check Application Logs**
```bash
# Check backend logs
tail -f /var/log/skyraksys-hrm/backend.log

# Check frontend logs
tail -f /var/log/skyraksys-hrm/frontend.log

# Check nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Database Connection Failed
**Symptoms:** Backend service fails to start, "connection refused" errors

**Solutions:**
```bash
# Check if PostgreSQL is running
systemctl status postgresql-15

# Check if database exists
sudo -u postgres psql -l | grep skyraksys_hrm_prod

# Verify credentials in .env file
grep DB_ /opt/skyraksys-hrm/.env

# Test database connection manually
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT version();"
```

### Issue 2: Backend Service Won't Start
**Symptoms:** systemctl status shows failed state

**Solutions:**
```bash
# Check service logs
journalctl -u hrm-backend -n 50

# Check if Node.js is installed
node --version

# Verify backend directory has files
ls -la /opt/skyraksys-hrm/backend/

# Check file permissions
ls -la /opt/skyraksys-hrm/.env

# Restart service
systemctl restart hrm-backend
```

### Issue 3: Frontend Not Loading
**Symptoms:** Blank page or connection refused

**Solutions:**
```bash
# Check if frontend service is running
systemctl status hrm-frontend

# Check if frontend built successfully
ls -la /opt/skyraksys-hrm/frontend/build/

# Check nginx configuration
nginx -t

# Restart services
systemctl restart hrm-frontend
systemctl restart nginx
```

### Issue 4: Cannot Access from Browser
**Symptoms:** Connection timeout or refused

**Solutions:**
```bash
# Check firewall rules
firewall-cmd --list-all

# Check if nginx is running
systemctl status nginx

# Check if port is listening
netstat -tuln | grep :80

# Check server IP
ip addr show

# Test local access first
curl http://localhost
```

### Issue 5: Password/Authentication Issues
**Symptoms:** Database connection refused, JWT token errors, login failures

**Solutions:**
```bash
# Check if passwords were properly updated in .env
grep -E "(REPLACE_WITH|your_|change_this)" /opt/skyraksys-hrm/.env
# Should return NO results

# Test database password manually
sudo -u postgres psql -d skyraksys_hrm_prod -U hrm_app -W
# Enter the password you set in Step 3.3

# Check JWT secret length (should be 64+ characters)
grep JWT_SECRET /opt/skyraksys-hrm/.env | wc -c

# Verify database user exists
sudo -u postgres psql -c "\du hrm_app"

# Reset database password if needed
sudo -u postgres psql -c "ALTER USER hrm_app PASSWORD 'NewPassword123!';"

# Update .env with new password
nano /opt/skyraksys-hrm/.env
# Update DB_PASSWORD line

# Restart services after password change
systemctl restart hrm-backend
```

### Issue 6: SSL Certificate Issues
**Symptoms:** Browser security warnings

**Solutions:**
```bash
# For self-signed certificates - this is normal
# Users need to accept the certificate manually

# For Let's Encrypt issues:
systemctl status certbot.timer
certbot certificates

# Check certificate expiry
openssl x509 -in /etc/ssl/certs/your-cert.pem -noout -dates
```

---

## ✅ Post-Installation Tasks

### Step 16: Initial System Configuration

**16.1 Create First Admin User**
1. Open browser and go to `http://your-server/admin`
2. Log in with default credentials:
   - Username: `admin`
   - Password: `admin123`
3. **IMMEDIATELY change the password**
4. Create additional admin users as needed

**16.2 Configure Company Information**
1. Go to Settings → Company Profile
2. Update company details:
   - Company name
   - Address
   - Contact information
   - Logo upload
   - Tax registration numbers

**16.3 Set Up Departments and Positions**
1. Navigate to Organization → Departments
2. Add your company's departments
3. Go to Organization → Positions
4. Add job positions for each department

**16.4 Configure Payroll Settings**
1. Go to Payroll → Settings
2. Configure:
   - Working days per month
   - Tax settings (PF, ESI, TDS rates)
   - Allowances and deductions
   - Payslip templates

### Step 17: Set Up Backup and Monitoring

**17.1 Create Backup Script**
```bash
# Create backup script
nano /opt/skyraksys-hrm/backup.sh
```

Copy and paste:

```bash
#!/bin/bash
# HRM Database Backup Script

BACKUP_DIR="/opt/skyraksys-hrm/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hrm_backup_$DATE.sql"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create database backup
sudo -u postgres pg_dump -d skyraksys_hrm_prod > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "hrm_backup_*.sql.gz" -mtime +30 -delete

echo "Backup created: $BACKUP_FILE.gz"
```

Make it executable and schedule:
```bash
chmod +x /opt/skyraksys-hrm/backup.sh
chown hrmapp:hrmapp /opt/skyraksys-hrm/backup.sh

# Add to crontab for daily backup at 2 AM
(crontab -l; echo "0 2 * * * /opt/skyraksys-hrm/backup.sh >> /var/log/skyraksys-hrm/backup.log 2>&1") | crontab -
```

**17.2 Set Up Log Rotation**
```bash
# Create log rotation configuration
nano /etc/logrotate.d/skyraksys-hrm
```

Copy and paste:

```bash
/var/log/skyraksys-hrm/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 hrmapp hrmapp
    postrotate
        /bin/systemctl reload nginx > /dev/null 2>&1 || true
        /bin/systemctl reload hrm-backend > /dev/null 2>&1 || true
    endscript
}
```

### Step 18: Performance Optimization

**18.1 Optimize PostgreSQL**
```bash
# Edit PostgreSQL configuration
nano /var/lib/pgsql/15/data/postgresql.conf
```

Add these optimizations (adjust based on your RAM):

```bash
# Memory settings (for 8GB RAM server)
shared_buffers = 2GB          # 25% of RAM
effective_cache_size = 6GB    # 75% of RAM  
work_mem = 8MB                # For complex queries
maintenance_work_mem = 256MB   # For maintenance operations

# Connection settings
max_connections = 100
idle_in_transaction_session_timeout = 300000

# Checkpoint and WAL settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
max_wal_size = 4GB

# Logging (for monitoring)
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%a.log'
log_min_duration_statement = 1000  # Log slow queries
log_checkpoints = on
log_connections = on
log_disconnections = on
```

Restart PostgreSQL:
```bash
systemctl restart postgresql-15
```

**18.2 Optimize Nginx**
```bash
# Edit main nginx configuration
nano /etc/nginx/nginx.conf
```

Verify these settings:

```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
client_max_body_size 10M;

# Enable gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
```

### Step 19: Security Hardening

**19.1 Verify Security Configuration**
```bash
# Verify all passwords were changed from defaults
grep -E "(REPLACE_WITH|your_|change_this|password|secret)" /opt/skyraksys-hrm/.env
# Should only show your actual configured passwords, no placeholders

# Verify JWT secret length (must be 64+ characters)
JWT_LENGTH=$(grep "JWT_SECRET=" /opt/skyraksys-hrm/.env | cut -d= -f2 | wc -c)
echo "JWT Secret Length: $JWT_LENGTH characters"
# Should show 64+ characters

# Test database connection with configured password
sudo -u hrmapp psql -h localhost -d skyraksys_hrm_prod -U hrm_app -c "SELECT 'Connection successful' as status;"

# Verify file permissions are secure
ls -la /opt/skyraksys-hrm/.env
# Should show: -rw------- (600 permissions, only owner can read/write)
```

**19.2 Additional Password Security (Optional but Recommended)**
```bash
# If you want to change passwords after initial setup:

# Generate new database password
NEW_DB_PASS=$(openssl rand -base64 32 | head -c 24)
echo "New DB Password: $NEW_DB_PASS"

# Update in PostgreSQL
sudo -u postgres psql -c "ALTER USER hrm_app PASSWORD '$NEW_DB_PASS';"

# Update in .env file
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$NEW_DB_PASS/" /opt/skyraksys-hrm/.env

# Restart backend service
systemctl restart hrm-backend
```

**19.2 Set Up SSL Certificates (Optional)**

For production, it's recommended to set up SSL:

```bash
# Install certbot for Let's Encrypt
dnf install -y certbot python3-certbot-nginx

# Get SSL certificate (replace your-domain.com)
certbot --nginx -d your-domain.com

# Test automatic renewal
certbot renew --dry-run
```

### Step 20: Final Verification Checklist

**✅ System Health Check:**
- [ ] All services running (PostgreSQL, Redis, Nginx, HRM Backend, HRM Frontend)
- [ ] Database connection working
- [ ] Web application accessible from browser
- [ ] Login functionality working
- [ ] Basic navigation working

**✅ Database Verification:**
- [ ] All 20 required tables created successfully
- [ ] UUID extension installed and working
- [ ] Payroll/payslip tables present and functional
- [ ] Foreign key relationships working
- [ ] Sample data inserted correctly

**✅ Security and Password Check:**
- [ ] Firewall configured and active
- [ ] Fail2ban running and monitoring  
- [ ] All placeholder passwords replaced in .env file
- [ ] JWT secrets are 64+ characters long
- [ ] Database password changed from default
- [ ] .env file has correct permissions (600)
- [ ] SSL certificate installed (if applicable)
- [ ] Password backup document created and secured

**✅ Password Validation Commands:**
```bash
# Verify no placeholder passwords remain
grep -E "(REPLACE_WITH|your_|change_this)" /opt/skyraksys-hrm/.env
# Should return NOTHING

# Check JWT secret length
grep "JWT_SECRET=" /opt/skyraksys-hrm/.env | cut -d= -f2 | wc -c
# Should show 64+ characters

# Test database connection
sudo -u hrmapp psql -h localhost -d skyraksys_hrm_prod -U hrm_app -c "SELECT 'Password OK' as status;"
# Should connect successfully
```

**✅ Backup and Monitoring:**
- [ ] Database backup script working
- [ ] Log rotation configured
- [ ] Monitoring logs for errors
- [ ] Performance metrics baseline established
- [ ] Password backup document secured

**✅ Functional Tests:**
- [ ] User login/logout working (test with admin/admin123, then change password)
- [ ] Employee management functional
- [ ] Payroll system accessible
- [ ] Leave management working  
- [ ] Timesheet functionality operational
- [ ] Payslip generation working
- [ ] File upload functionality working

---

## 📞 Getting Help and Support

### Documentation Resources
- **Application Help:** Available in the web interface under Help menu
- **API Documentation:** `http://your-domain.com/api/docs`
- **System Logs:** `/var/log/skyraksys-hrm/`

### Common Log Locations
```bash
# Application logs
/var/log/skyraksys-hrm/application.log
/var/log/skyraksys-hrm/error.log

# Service logs  
journalctl -u hrm-backend
journalctl -u hrm-frontend
journalctl -u postgresql-15
journalctl -u nginx

# System logs
/var/log/messages
/var/log/secure
```

### Support Contacts
- **Technical Support:** support@skyraksys.com
- **Documentation:** Available in application help section
- **Emergency Support:** +91 89398 88577

---

## 🎉 Congratulations!

You have successfully installed and configured the Skyraksys HRM system on RHEL 9.6!

### What's Next?
1. **Training:** Schedule training sessions for HR staff
2. **Data Migration:** Import existing employee data (if applicable)
3. **Customization:** Configure workflows and approval processes
4. **Integration:** Set up integrations with other systems (if needed)
5. **Monitoring:** Set up regular monitoring and maintenance schedules

### Key URLs for Your Reference:
- **Web Application:** `http://your-domain.com`
- **Admin Panel:** `http://your-domain.com/admin`
- **API Documentation:** `http://your-domain.com/api/docs`
- **Health Check:** `http://your-domain.com/health`

---

*Installation Guide Complete - Your HRM system is now ready for production use!*

**Document Version:** 1.0  
**Last Updated:** November 2024  
**Created for:** RHEL 9.6 Production Environment