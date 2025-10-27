# Database Documentation

## Overview
SkyRakSys HRM uses PostgreSQL as its primary database system. This document covers the database schema, relationships, and management procedures.

## Schema Design

### Core Tables

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### employees
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    hire_date DATE,
    manager_id UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### leave_requests
```sql
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### timesheets
```sql
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    date DATE NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    project_id UUID REFERENCES projects(id),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### projects
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### payroll
```sql
CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL,
    deductions DECIMAL(10,2) DEFAULT 0,
    allowances DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes
- `users_email_idx` on users(email)
- `employees_user_id_idx` on employees(user_id)
- `leave_requests_employee_id_idx` on leave_requests(employee_id)
- `timesheets_employee_id_date_idx` on timesheets(employee_id, date)
- `payroll_employee_id_period_idx` on payroll(employee_id, period_start, period_end)

## Entity Relationships
- User (1) -> (1) Employee
- Employee (1) -> (N) Leave Requests
- Employee (1) -> (N) Timesheets
- Employee (1) -> (N) Payroll Records
- Project (1) -> (N) Timesheets

## Database Management

### Backup and Restore
```bash
# Create backup
npm run db:backup

# Restore from backup
npm run db:restore [filename]
```

### Migrations
```bash
# Run migrations
npm run migrate

# Undo last migration
npm run migrate:undo
```

### Data Seeding
```bash
# Load minimal dataset
npm run seed:minimal

# Load full dataset
npm run seed:full

# Load test dataset
npm run seed:test
```

## Performance Optimizations
1. Proper indexing on frequently queried columns
2. Connection pooling configured in database.js
3. Query optimization with EXPLAIN ANALYZE
4. Regular VACUUM and maintenance

## Security Measures
1. Password hashing using bcrypt
2. SQL injection protection through parameterized queries
3. Role-based access control
4. Connection encryption with SSL
5. Regular security audits

## References
- [Database Setup Guide](../../PRODUnix/docs/DATABASE_SETUP.md)
- [Migration Guide](../deployment/DATABASE_MIGRATION.md)
- [Production Database Guide](../../PROD/docs/DATABASE_GUIDE.md)
- [Development Setup](../../DEVELOPMENT_SETUP.md#database-setup)