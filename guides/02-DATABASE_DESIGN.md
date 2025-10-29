# 🗄️ Database Design Guide

**Version**: 2.0.0  
**Last Updated**: October 27, 2025  
**Database**: PostgreSQL 15+

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Core Tables](#core-tables)
4. [Relationships](#relationships)
5. [Indexes & Performance](#indexes--performance)
6. [Constraints & Validation](#constraints--validation)
7. [Data Types & Standards](#data-types--standards)
8. [Sample Queries](#sample-queries)
9. [Backup & Maintenance](#backup--maintenance)

---

## 🎯 Overview

### Database Information

| Property | Value |
|----------|-------|
| **Database Type** | PostgreSQL 15+ |
| **ORM** | Sequelize 6.35.0 |
| **Character Set** | UTF-8 |
| **Collation** | en_US.UTF-8 |
| **Time Zone** | UTC (recommended) |
| **Connection Pool** | Min: 0, Max: 5 |

### Schema Statistics

| Metric | Count |
|--------|-------|
| **Total Tables** | 15+ |
| **Foreign Keys** | 25+ |
| **Indexes** | 40+ |
| **Triggers** | 5+ |
| **Stored Procedures** | 3+ |

---

## 📊 Database Schema

### Entity-Relationship Diagram

```
┌─────────────┐         ┌─────────────┐
│    Users    │────1:1──│  Employees  │
└─────────────┘         └──────┬──────┘
                               │
                               │ 1:N
                    ┌──────────┼──────────┬─────────────┐
                    │          │          │             │
              ┌─────▼────┐ ┌──▼─────┐ ┌─▼──────┐ ┌───▼─────┐
              │Timesheets│ │ Leaves │ │Payrolls│ │Attendance│
              └─────┬────┘ └────────┘ └────────┘ └─────────┘
                    │
         ┌──────────┴─────────┐
         │                    │
    ┌────▼─────┐         ┌───▼────┐
    │ Projects │         │ Tasks  │
    └──────────┘         └────────┘

┌──────────────┐
│ Departments  │────1:N────▶ Employees
└──────────────┘

┌──────────────┐
│  Positions   │────1:N────▶ Employees
└──────────────┘

┌──────────────┐
│  LeaveTypes  │────1:N────▶ Leaves
└──────────────┘
```

---

## 📋 Core Tables

### 1. Users Table

**Purpose**: Authentication and authorization

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| password | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | VARCHAR(50) | NOT NULL | admin, hr, manager, employee |
| is_active | BOOLEAN | DEFAULT true | Account status |
| last_login_at | TIMESTAMP | - | Last login timestamp |

**Indexes**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

---

### 2. Employees Table

**Purpose**: Complete employee master data

```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pin_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'India',
    
    -- Employment Details
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    manager_id UUID REFERENCES employees(id),
    hire_date DATE NOT NULL,
    joining_date DATE,
    confirmation_date DATE,
    employment_type VARCHAR(50) DEFAULT 'Full-time',
    work_location VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    
    -- Financial Information
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    bank_branch VARCHAR(100),
    pan_number VARCHAR(20),
    uan_number VARCHAR(20),
    esi_number VARCHAR(20),
    
    -- Salary
    basic_salary DECIMAL(12,2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_gender CHECK (gender IN ('Male', 'Female', 'Other')),
    CONSTRAINT chk_status CHECK (status IN ('Active', 'Inactive', 'On Leave', 'Terminated'))
);
```

**Key Fields**:
- **employee_id**: Unique identifier (e.g., SKYT001)
- **user_id**: Links to authentication
- **manager_id**: Self-referencing for hierarchy
- **department_id, position_id**: Organizational structure

**Indexes**:
```sql
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_position ON employees(position_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_email ON employees(email);
```

---

### 3. Departments Table

**Purpose**: Organizational structure

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    head_id UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 4. Positions Table

**Purpose**: Job positions and salary structures

```sql
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES departments(id),
    min_salary DECIMAL(12,2),
    max_salary DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 5. Projects Table

**Purpose**: Project management

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Active',
    manager_id UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_project_status CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'))
);
```

---

### 6. Tasks Table

**Purpose**: Task management and allocation

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'Not Started',
    priority VARCHAR(50) DEFAULT 'Medium',
    available_to_all BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_task_status CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'On Hold')),
    CONSTRAINT chk_task_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'))
);
```

**Indexes**:
```sql
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
```

---

### 7. Timesheets Table

**Purpose**: Weekly time tracking

```sql
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id),
    task_id UUID REFERENCES tasks(id),
    week_start_date DATE NOT NULL,
    
    -- Daily hours
    monday_hours DECIMAL(4,2) DEFAULT 0,
    tuesday_hours DECIMAL(4,2) DEFAULT 0,
    wednesday_hours DECIMAL(4,2) DEFAULT 0,
    thursday_hours DECIMAL(4,2) DEFAULT 0,
    friday_hours DECIMAL(4,2) DEFAULT 0,
    saturday_hours DECIMAL(4,2) DEFAULT 0,
    sunday_hours DECIMAL(4,2) DEFAULT 0,
    
    total_hours DECIMAL(5,2),
    description TEXT,
    status VARCHAR(50) DEFAULT 'Draft',
    
    -- Approval workflow
    submitted_at TIMESTAMP,
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP,
    approver_comments TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_timesheet_status CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected')),
    CONSTRAINT chk_daily_hours CHECK (
        monday_hours >= 0 AND monday_hours <= 24 AND
        tuesday_hours >= 0 AND tuesday_hours <= 24 AND
        wednesday_hours >= 0 AND wednesday_hours <= 24 AND
        thursday_hours >= 0 AND thursday_hours <= 24 AND
        friday_hours >= 0 AND friday_hours <= 24 AND
        saturday_hours >= 0 AND saturday_hours <= 24 AND
        sunday_hours >= 0 AND sunday_hours <= 24
    ),
    CONSTRAINT uk_employee_week_project_task UNIQUE (employee_id, week_start_date, project_id, task_id)
);
```

**Indexes**:
```sql
CREATE INDEX idx_timesheets_employee ON timesheets(employee_id);
CREATE INDEX idx_timesheets_project ON timesheets(project_id);
CREATE INDEX idx_timesheets_task ON timesheets(task_id);
CREATE INDEX idx_timesheets_week ON timesheets(week_start_date);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_timesheets_employee_week ON timesheets(employee_id, week_start_date);
```

---

### 8. Leave Types Table

**Purpose**: Leave type definitions

```sql
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    max_days_per_year INTEGER,
    carry_forward BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT true,
    is_paid BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Default Leave Types**:
- Casual Leave (CL)
- Sick Leave (SL)
- Earned Leave (EL)
- Privilege Leave (PL)
- Maternity Leave (ML)
- Paternity Leave (PTL)
- Compensatory Off (CO)

---

### 9. Leave Requests Table

**Purpose**: Leave applications and approvals

```sql
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    
    -- Leave details
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(3,1) NOT NULL,
    is_half_day BOOLEAN DEFAULT false,
    half_day_period VARCHAR(20),
    reason TEXT NOT NULL,
    
    -- Approval workflow
    status VARCHAR(50) DEFAULT 'Pending',
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP,
    approver_comments TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_leave_status CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    CONSTRAINT chk_half_day_period CHECK (half_day_period IN ('First Half', 'Second Half')),
    CONSTRAINT chk_date_range CHECK (end_date >= start_date)
);
```

**Indexes**:
```sql
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_type ON leave_requests(leave_type_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
```

---

### 10. Leave Balances Table

**Purpose**: Track leave balance for each employee

```sql
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    year INTEGER NOT NULL,
    
    -- Balance tracking
    total_allocated DECIMAL(5,2) NOT NULL DEFAULT 0,
    used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    pending_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    available_days DECIMAL(5,2) GENERATED ALWAYS AS (total_allocated - used_days - pending_days) STORED,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_employee_leave_year UNIQUE (employee_id, leave_type_id, year)
);
```

**Indexes**:
```sql
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX idx_leave_balances_year ON leave_balances(year);
```

---

### 11. Payrolls Table

**Purpose**: Monthly payroll processing

```sql
CREATE TABLE payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Pay period
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE,
    
    -- Salary components
    basic_salary DECIMAL(12,2) NOT NULL,
    hra DECIMAL(12,2) DEFAULT 0,
    conveyance DECIMAL(12,2) DEFAULT 0,
    special_allowance DECIMAL(12,2) DEFAULT 0,
    other_allowances DECIMAL(12,2) DEFAULT 0,
    
    -- Deductions
    pf_employee DECIMAL(12,2) DEFAULT 0,
    pf_employer DECIMAL(12,2) DEFAULT 0,
    esi_employee DECIMAL(12,2) DEFAULT 0,
    esi_employer DECIMAL(12,2) DEFAULT 0,
    professional_tax DECIMAL(12,2) DEFAULT 0,
    tds DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    
    -- Calculations
    gross_salary DECIMAL(12,2),
    total_deductions DECIMAL(12,2),
    net_salary DECIMAL(12,2),
    
    -- Attendance
    working_days INTEGER,
    present_days INTEGER,
    absent_days INTEGER,
    paid_leaves INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'Draft',
    processed_by UUID REFERENCES employees(id),
    processed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_payroll_status CHECK (status IN ('Draft', 'Processed', 'Approved', 'Paid'))
);
```

**Indexes**:
```sql
CREATE INDEX idx_payrolls_employee ON payrolls(employee_id);
CREATE INDEX idx_payrolls_period ON payrolls(pay_period_start, pay_period_end);
CREATE INDEX idx_payrolls_status ON payrolls(status);
```

---

### 12. Payslip Templates Table

**Purpose**: Configurable payslip structure

```sql
CREATE TABLE payslip_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuration (JSON)
    earnings_config JSONB,
    deductions_config JSONB,
    company_info JSONB,
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Sample earnings_config**:
```json
{
  "components": [
    {"name": "Basic Salary", "type": "fixed", "formula": "basic_salary"},
    {"name": "HRA", "type": "percentage", "formula": "basic_salary * 0.50"},
    {"name": "Conveyance", "type": "fixed", "formula": "1600"},
    {"name": "Special Allowance", "type": "calculated", "formula": "gross - (basic + hra + conveyance)"}
  ]
}
```

---

### 13. Salary Structures Table

**Purpose**: Position-wise salary structure

```sql
CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID REFERENCES positions(id),
    grade VARCHAR(50),
    
    -- Salary components
    basic_salary DECIMAL(12,2) NOT NULL,
    hra_percentage DECIMAL(5,2) DEFAULT 50.00,
    conveyance DECIMAL(12,2) DEFAULT 1600,
    special_allowance DECIMAL(12,2),
    
    -- Statutory
    pf_applicable BOOLEAN DEFAULT true,
    esi_applicable BOOLEAN DEFAULT false,
    pt_applicable BOOLEAN DEFAULT true,
    
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 14. Audit Logs Table

**Purpose**: Track all data modifications

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_audit_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'))
);
```

**Indexes**:
```sql
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

### 15. Refresh Tokens Table

**Purpose**: JWT refresh token management

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    user_agent TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
```sql
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

---

## 🔗 Relationships

### Foreign Key Relationships

```sql
-- User ← Employee (One-to-One)
ALTER TABLE employees 
ADD CONSTRAINT fk_employee_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Department → Employee (One-to-Many)
ALTER TABLE employees 
ADD CONSTRAINT fk_employee_department 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Position → Employee (One-to-Many)
ALTER TABLE employees 
ADD CONSTRAINT fk_employee_position 
FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL;

-- Employee → Employee (Self-referencing for manager)
ALTER TABLE employees 
ADD CONSTRAINT fk_employee_manager 
FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Employee → Timesheet (One-to-Many)
ALTER TABLE timesheets 
ADD CONSTRAINT fk_timesheet_employee 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- Project → Timesheet (One-to-Many)
ALTER TABLE timesheets 
ADD CONSTRAINT fk_timesheet_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Task → Timesheet (One-to-Many)
ALTER TABLE timesheets 
ADD CONSTRAINT fk_timesheet_task 
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- Employee → Leave Request (One-to-Many)
ALTER TABLE leave_requests 
ADD CONSTRAINT fk_leave_request_employee 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- Leave Type → Leave Request (One-to-Many)
ALTER TABLE leave_requests 
ADD CONSTRAINT fk_leave_request_type 
FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT;

-- Employee → Payroll (One-to-Many)
ALTER TABLE payrolls 
ADD CONSTRAINT fk_payroll_employee 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
```

### CASCADE Rules

| Relationship | On Delete | On Update | Reason |
|--------------|-----------|-----------|---------|
| User → Employee | CASCADE | CASCADE | Delete employee when user deleted |
| Employee → Timesheet | CASCADE | CASCADE | Delete timesheets when employee deleted |
| Employee → Leave | CASCADE | CASCADE | Delete leaves when employee deleted |
| Project → Task | SET NULL | CASCADE | Keep task even if project deleted |
| Task → Timesheet | SET NULL | CASCADE | Keep timesheet even if task deleted |

---

## ⚡ Indexes & Performance

### Primary Indexes (Auto-created)

All tables have UUID primary keys with automatic indexes.

### Secondary Indexes

**High-traffic Query Optimization**:

```sql
-- Employee lookups
CREATE INDEX idx_employees_composite ON employees(status, department_id, position_id);

-- Timesheet queries (most common)
CREATE INDEX idx_timesheets_approval ON timesheets(status, approved_by) 
WHERE status IN ('Submitted', 'Approved');

-- Leave management
CREATE INDEX idx_leave_requests_pending ON leave_requests(status, employee_id) 
WHERE status = 'Pending';

-- Payroll processing
CREATE INDEX idx_payrolls_pending ON payrolls(status, pay_period_start) 
WHERE status IN ('Draft', 'Processed');

-- Full-text search on employees
CREATE INDEX idx_employees_fulltext ON employees 
USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || email));
```

### Partial Indexes

Used for common filtered queries:

```sql
-- Active employees only
CREATE INDEX idx_employees_active ON employees(id) 
WHERE status = 'Active';

-- Active projects
CREATE INDEX idx_projects_active ON projects(id) 
WHERE is_active = true;

-- Pending leave requests
CREATE INDEX idx_leaves_pending ON leave_requests(employee_id, start_date) 
WHERE status = 'Pending';
```

### Index Maintenance

```sql
-- Analyze tables to update statistics
ANALYZE employees;
ANALYZE timesheets;
ANALYZE leave_requests;
ANALYZE payrolls;

-- Reindex if necessary
REINDEX TABLE employees;

-- Check index usage
SELECT 
    schemaname, tablename, indexname, 
    idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## ✅ Constraints & Validation

### Check Constraints

```sql
-- Employee status
ALTER TABLE employees ADD CONSTRAINT chk_emp_status 
CHECK (status IN ('Active', 'Inactive', 'On Leave', 'Terminated'));

-- Salary must be positive
ALTER TABLE employees ADD CONSTRAINT chk_basic_salary 
CHECK (basic_salary >= 0);

-- Date validations
ALTER TABLE leave_requests ADD CONSTRAINT chk_leave_dates 
CHECK (end_date >= start_date);

-- Hours validation
ALTER TABLE timesheets ADD CONSTRAINT chk_total_hours 
CHECK (total_hours >= 0 AND total_hours <= 168);
```

### Unique Constraints

```sql
-- Employee ID must be unique
ALTER TABLE employees ADD CONSTRAINT uk_employee_id 
UNIQUE (employee_id);

-- Email must be unique
ALTER TABLE employees ADD CONSTRAINT uk_employee_email 
UNIQUE (email);

-- One timesheet per employee per week per project/task
ALTER TABLE timesheets ADD CONSTRAINT uk_timesheet_entry 
UNIQUE (employee_id, week_start_date, project_id, task_id);

-- One leave balance per employee per type per year
ALTER TABLE leave_balances ADD CONSTRAINT uk_leave_balance 
UNIQUE (employee_id, leave_type_id, year);
```

### Not Null Constraints

Critical fields that must always have values:

```sql
-- Users
- email NOT NULL
- password NOT NULL
- role NOT NULL

-- Employees
- employee_id NOT NULL
- first_name NOT NULL
- last_name NOT NULL
- email NOT NULL
- hire_date NOT NULL

-- Timesheets
- employee_id NOT NULL
- week_start_date NOT NULL

-- Leave Requests
- employee_id NOT NULL
- start_date NOT NULL
- end_date NOT NULL
- reason NOT NULL
```

---

## 📐 Data Types & Standards

### UUID Standards

All primary keys use UUID v4:
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### Date/Time Standards

- **Dates**: Use DATE type for calendar dates
- **Timestamps**: Use TIMESTAMP for date + time
- **Storage**: All timestamps in UTC
- **Display**: Convert to user timezone in application layer

### Decimal Precision

| Field Type | Precision | Example |
|------------|-----------|---------|
| **Salary** | DECIMAL(12,2) | 999,999,999.99 |
| **Hours** | DECIMAL(5,2) | 999.99 |
| **Percentages** | DECIMAL(5,2) | 100.00 |
| **Days** | DECIMAL(5,2) | 365.50 |

### JSONB Usage

Use JSONB for flexible schema fields:
- Payslip configurations
- Dynamic form fields
- Audit log old/new values
- Custom employee attributes

---

## 🔍 Sample Queries

### Employee Management

```sql
-- Get all active employees with department info
SELECT 
    e.employee_id,
    e.first_name || ' ' || e.last_name AS full_name,
    e.email,
    d.name AS department,
    p.title AS position,
    m.first_name || ' ' || m.last_name AS manager_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN employees m ON e.manager_id = m.id
WHERE e.status = 'Active'
ORDER BY e.first_name, e.last_name;

-- Get employee hierarchy (manager and reports)
WITH RECURSIVE org_tree AS (
    -- Anchor: Top-level managers
    SELECT id, employee_id, first_name, last_name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive: Direct reports
    SELECT e.id, e.employee_id, e.first_name, e.last_name, e.manager_id, ot.level + 1
    FROM employees e
    INNER JOIN org_tree ot ON e.manager_id = ot.id
)
SELECT * FROM org_tree ORDER BY level, first_name;
```

### Timesheet Analytics

```sql
-- Weekly hours summary by employee
SELECT 
    e.employee_id,
    e.first_name || ' ' || e.last_name AS employee_name,
    t.week_start_date,
    SUM(t.total_hours) AS total_hours,
    COUNT(*) AS timesheet_count,
    t.status
FROM timesheets t
JOIN employees e ON t.employee_id = e.id
WHERE t.week_start_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY e.employee_id, e.first_name, e.last_name, t.week_start_date, t.status
ORDER BY t.week_start_date DESC, total_hours DESC;

-- Project utilization
SELECT 
    p.name AS project_name,
    COUNT(DISTINCT t.employee_id) AS employees_count,
    SUM(t.total_hours) AS total_hours,
    AVG(t.total_hours) AS avg_hours_per_timesheet
FROM timesheets t
JOIN projects p ON t.project_id = p.id
WHERE t.status = 'Approved'
  AND t.week_start_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY p.id, p.name
ORDER BY total_hours DESC;
```

### Leave Management

```sql
-- Leave balance summary
SELECT 
    e.employee_id,
    e.first_name || ' ' || e.last_name AS employee_name,
    lt.name AS leave_type,
    lb.total_allocated,
    lb.used_days,
    lb.pending_days,
    lb.available_days,
    lb.year
FROM leave_balances lb
JOIN employees e ON lb.employee_id = e.id
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
  AND e.status = 'Active'
ORDER BY e.first_name, lt.name;

-- Pending leave requests with manager info
SELECT 
    lr.id,
    e.employee_id,
    e.first_name || ' ' || e.last_name AS employee_name,
    lt.name AS leave_type,
    lr.start_date,
    lr.end_date,
    lr.total_days,
    lr.reason,
    m.first_name || ' ' || m.last_name AS manager_name,
    lr.created_at
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
JOIN leave_types lt ON lr.leave_type_id = lt.id
LEFT JOIN employees m ON e.manager_id = m.id
WHERE lr.status = 'Pending'
ORDER BY lr.created_at ASC;
```

### Payroll Reporting

```sql
-- Monthly payroll summary
SELECT 
    DATE_TRUNC('month', pay_period_start) AS pay_month,
    COUNT(*) AS employee_count,
    SUM(gross_salary) AS total_gross,
    SUM(total_deductions) AS total_deductions,
    SUM(net_salary) AS total_net,
    AVG(net_salary) AS avg_net_salary
FROM payrolls
WHERE status = 'Paid'
  AND pay_period_start >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', pay_period_start)
ORDER BY pay_month DESC;

-- Employee payroll history
SELECT 
    p.pay_period_start,
    p.pay_period_end,
    p.gross_salary,
    p.total_deductions,
    p.net_salary,
    p.working_days,
    p.present_days,
    p.status
FROM payrolls p
WHERE p.employee_id = :employee_id
ORDER BY p.pay_period_start DESC
LIMIT 12;
```

---

## 💾 Backup & Maintenance

### Backup Strategy

**Daily Backups**:
```bash
# Full database backup
pg_dump -h localhost -U hrm_app -d skyraksys_hrm_prod \
  -F c -b -v -f /backups/hrm_$(date +%Y%m%d).backup

# Compressed SQL dump
pg_dump -h localhost -U hrm_app -d skyraksys_hrm_prod \
  | gzip > /backups/hrm_$(date +%Y%m%d).sql.gz
```

**Table-specific Backups**:
```bash
# Backup critical tables only
pg_dump -h localhost -U hrm_app -d skyraksys_hrm_prod \
  -t employees -t users -t payrolls \
  -F c -f /backups/critical_tables_$(date +%Y%m%d).backup
```

### Restore Procedures

```bash
# Restore from custom format backup
pg_restore -h localhost -U hrm_app -d skyraksys_hrm_prod \
  -v /backups/hrm_20251027.backup

# Restore from SQL dump
gunzip -c /backups/hrm_20251027.sql.gz | \
  psql -h localhost -U hrm_app -d skyraksys_hrm_prod
```

### Database Maintenance

**Routine Maintenance** (Run weekly):
```sql
-- Vacuum and analyze
VACUUM ANALYZE employees;
VACUUM ANALYZE timesheets;
VACUUM ANALYZE leave_requests;
VACUUM ANALYZE payrolls;

-- Or vacuum entire database
VACUUM ANALYZE;

-- Update statistics
ANALYZE;
```

**Performance Monitoring**:
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index bloat
SELECT 
    schemaname, tablename, indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Active queries
SELECT 
    pid, 
    age(clock_timestamp(), query_start) AS duration,
    usename,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

---

## 🔄 Data Migration

### Version Control

Use Sequelize migrations for schema changes:

```javascript
// migrations/20251027-add-employee-esi-number.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('employees', 'esi_number', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('employees', 'esi_number');
  }
};
```

### Data Seeding

```javascript
// seeders/20251027-demo-employees.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('employees', [
      {
        id: uuid(),
        employee_id: 'SKYT001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@skyraksys.com',
        hire_date: new Date(),
        status: 'Active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('employees', null, {});
  }
};
```

---

## 📚 References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Sequelize ORM Documentation](https://sequelize.org/docs/v6/)
- [Database Normalization](https://en.wikipedia.org/wiki/Database_normalization)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Next**: [API Reference Guide](./03-API_REFERENCE.md)
