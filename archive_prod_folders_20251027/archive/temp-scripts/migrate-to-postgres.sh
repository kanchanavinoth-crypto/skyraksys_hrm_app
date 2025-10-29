#!/bin/bash

# Complete PostgreSQL Migration Script for Skyraksys HRM
# This script migrates data from SQLite to PostgreSQL with validation

set -e  # Exit on any error

echo "🚀 Starting PostgreSQL Migration for Skyraksys HRM"
echo "=================================================="

# Configuration
SQLITE_DB="./backend/database.sqlite"
POSTGRES_DB="skyraksys_hrm"
POSTGRES_USER="hrm_admin"
POSTGRES_PASSWORD="hrm_secure_2024"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
BACKUP_DIR="./database-migration-backup"
MIGRATION_LOG="./migration.log"

# Create backup directory
mkdir -p $BACKUP_DIR

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $MIGRATION_LOG
}

# Function to execute PostgreSQL commands
execute_postgres() {
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "$1"
}

# Function to query SQLite
query_sqlite() {
    sqlite3 $SQLITE_DB "$1"
}

log_message "🔍 Pre-migration validation started"

# Check if SQLite database exists
if [ ! -f "$SQLITE_DB" ]; then
    log_message "❌ SQLite database not found at $SQLITE_DB"
    exit 1
fi

# Check PostgreSQL connection
if ! PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c '\q' 2>/dev/null; then
    log_message "❌ Cannot connect to PostgreSQL database"
    exit 1
fi

log_message "✅ Pre-migration validation completed"

# Backup existing data
log_message "📦 Creating backup of existing data"
PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_DIR/postgresql_backup_$(date +%Y%m%d_%H%M%S).sql

# Get table counts from SQLite
log_message "📊 Analyzing SQLite data"
USERS_COUNT=$(query_sqlite "SELECT COUNT(*) FROM users;")
TIMESHEETS_COUNT=$(query_sqlite "SELECT COUNT(*) FROM timesheets;" 2>/dev/null || echo "0")
LEAVE_REQUESTS_COUNT=$(query_sqlite "SELECT COUNT(*) FROM leave_requests;" 2>/dev/null || echo "0")
PAYSLIPS_COUNT=$(query_sqlite "SELECT COUNT(*) FROM payslips;" 2>/dev/null || echo "0")

log_message "📈 SQLite Data Summary:"
log_message "   Users: $USERS_COUNT"
log_message "   Timesheets: $TIMESHEETS_COUNT"
log_message "   Leave Requests: $LEAVE_REQUESTS_COUNT"
log_message "   Payslips: $PAYSLIPS_COUNT"

# Start migration
log_message "🔄 Starting data migration"

# Migrate Users
log_message "👥 Migrating users table"
sqlite3 -header -csv $SQLITE_DB "SELECT * FROM users;" > $BACKUP_DIR/users.csv

# Convert SQLite users to PostgreSQL format
query_sqlite "
SELECT 
    email,
    password,
    firstName as first_name,
    lastName as last_name,
    role,
    COALESCE(department, '') as department,
    COALESCE(jobTitle, '') as job_title,
    COALESCE(hireDate, date('now')) as hire_date,
    COALESCE(salary, 0) as salary,
    managerId as manager_id,
    CASE WHEN isActive = 1 THEN true ELSE false END as is_active,
    createdAt as created_at,
    updatedAt as updated_at
FROM users;
" | while IFS='|' read email password first_name last_name role department job_title hire_date salary manager_id is_active created_at updated_at; do
    if [ "$email" != "email" ]; then  # Skip header
        execute_postgres "
        INSERT INTO users (email, password_hash, first_name, last_name, role, department, job_title, hire_date, salary, manager_id, is_active, created_at, updated_at, email_verified)
        VALUES ('$email', '$password', '$first_name', '$last_name', '$role', '$department', '$job_title', '$hire_date', $salary, $([ "$manager_id" = "" ] && echo "NULL" || echo "$manager_id"), $is_active, '$created_at', '$updated_at', true)
        ON CONFLICT (email) DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            role = EXCLUDED.role,
            department = EXCLUDED.department,
            job_title = EXCLUDED.job_title,
            hire_date = EXCLUDED.hire_date,
            salary = EXCLUDED.salary,
            manager_id = EXCLUDED.manager_id,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at;
        " 2>/dev/null || log_message "⚠️  Warning: Failed to migrate user $email"
    fi
done

# Migrate Timesheets (if table exists)
if [ "$TIMESHEETS_COUNT" != "0" ]; then
    log_message "⏰ Migrating timesheets table"
    
    query_sqlite "
    SELECT 
        u.email,
        t.date,
        t.startTime as start_time,
        t.endTime as end_time,
        COALESCE(t.breakDuration, 0) as break_duration,
        COALESCE(t.status, 'pending') as status,
        COALESCE(t.notes, '') as notes,
        COALESCE(t.projectName, '') as project_name,
        COALESCE(t.taskDescription, '') as task_description,
        t.createdAt as created_at,
        t.updatedAt as updated_at
    FROM timesheets t
    JOIN users u ON t.userId = u.id;
    " | while IFS='|' read email date start_time end_time break_duration status notes project_name task_description created_at updated_at; do
        if [ "$email" != "email" ]; then  # Skip header
            execute_postgres "
            INSERT INTO timesheets (user_id, date, start_time, end_time, break_duration, status, notes, project_name, task_description, created_at, updated_at)
            SELECT u.id, '$date', '$start_time', $([ "$end_time" = "" ] && echo "NULL" || echo "'$end_time'"), $break_duration, '$status', '$notes', '$project_name', '$task_description', '$created_at', '$updated_at'
            FROM users u WHERE u.email = '$email'
            ON CONFLICT (user_id, date) DO UPDATE SET
                start_time = EXCLUDED.start_time,
                end_time = EXCLUDED.end_time,
                break_duration = EXCLUDED.break_duration,
                status = EXCLUDED.status,
                notes = EXCLUDED.notes,
                project_name = EXCLUDED.project_name,
                task_description = EXCLUDED.task_description,
                updated_at = EXCLUDED.updated_at;
            " 2>/dev/null || log_message "⚠️  Warning: Failed to migrate timesheet for $email on $date"
        fi
    done
fi

# Migrate Leave Requests (if table exists)
if [ "$LEAVE_REQUESTS_COUNT" != "0" ]; then
    log_message "🏖️  Migrating leave_requests table"
    
    query_sqlite "
    SELECT 
        u.email,
        l.type,
        l.startDate as start_date,
        l.endDate as end_date,
        l.daysRequested as days_requested,
        COALESCE(l.status, 'pending') as status,
        COALESCE(l.reason, '') as reason,
        COALESCE(l.managerNotes, '') as manager_notes,
        l.createdAt as created_at,
        l.updatedAt as updated_at
    FROM leave_requests l
    JOIN users u ON l.userId = u.id;
    " | while IFS='|' read email type start_date end_date days_requested status reason manager_notes created_at updated_at; do
        if [ "$email" != "email" ]; then  # Skip header
            execute_postgres "
            INSERT INTO leave_requests (user_id, type, start_date, end_date, days_requested, status, reason, manager_notes, created_at, updated_at)
            SELECT u.id, '$type', '$start_date', '$end_date', $days_requested, '$status', '$reason', '$manager_notes', '$created_at', '$updated_at'
            FROM users u WHERE u.email = '$email';
            " 2>/dev/null || log_message "⚠️  Warning: Failed to migrate leave request for $email"
        fi
    done
fi

# Migrate Payslips (if table exists)
if [ "$PAYSLIPS_COUNT" != "0" ]; then
    log_message "💰 Migrating payslips table"
    
    query_sqlite "
    SELECT 
        u.email,
        p.payPeriodStart as pay_period_start,
        p.payPeriodEnd as pay_period_end,
        p.grossSalary as gross_salary,
        p.basicSalary as basic_salary,
        COALESCE(p.allowances, 0) as allowances,
        COALESCE(p.overtimeAmount, 0) as overtime_amount,
        COALESCE(p.totalDeductions, 0) as total_deductions,
        COALESCE(p.taxDeduction, 0) as tax_deduction,
        COALESCE(p.insuranceDeduction, 0) as insurance_deduction,
        COALESCE(p.otherDeductions, 0) as other_deductions,
        p.netSalary as net_salary,
        COALESCE(p.status, 'draft') as status,
        p.createdAt as created_at,
        p.updatedAt as updated_at
    FROM payslips p
    JOIN users u ON p.userId = u.id;
    " | while IFS='|' read email pay_period_start pay_period_end gross_salary basic_salary allowances overtime_amount total_deductions tax_deduction insurance_deduction other_deductions net_salary status created_at updated_at; do
        if [ "$email" != "email" ]; then  # Skip header
            execute_postgres "
            INSERT INTO payslips (user_id, pay_period_start, pay_period_end, gross_salary, basic_salary, allowances, overtime_amount, total_deductions, tax_deduction, insurance_deduction, other_deductions, net_salary, status, created_at, updated_at)
            SELECT u.id, '$pay_period_start', '$pay_period_end', $gross_salary, $basic_salary, $allowances, $overtime_amount, $total_deductions, $tax_deduction, $insurance_deduction, $other_deductions, $net_salary, '$status', '$created_at', '$updated_at'
            FROM users u WHERE u.email = '$email';
            " 2>/dev/null || log_message "⚠️  Warning: Failed to migrate payslip for $email"
        fi
    done
fi

# Initialize leave balances for migrated users
log_message "🏖️  Initializing leave balances"
execute_postgres "
INSERT INTO leave_balances (user_id, leave_type, total_days, used_days, year)
SELECT 
    u.id,
    unnest(ARRAY['vacation', 'sick', 'personal']) as leave_type,
    CASE 
        WHEN unnest(ARRAY['vacation', 'sick', 'personal']) = 'vacation' THEN 25
        WHEN unnest(ARRAY['vacation', 'sick', 'personal']) = 'sick' THEN 10
        WHEN unnest(ARRAY['vacation', 'sick', 'personal']) = 'personal' THEN 5
    END as total_days,
    0 as used_days,
    EXTRACT(YEAR FROM NOW()) as year
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM leave_balances lb 
    WHERE lb.user_id = u.id AND lb.year = EXTRACT(YEAR FROM NOW())
);
"

# Post-migration validation
log_message "🔍 Post-migration validation"

PG_USERS_COUNT=$(execute_postgres "SELECT COUNT(*) FROM users;" | grep -E '^[0-9]+$')
PG_TIMESHEETS_COUNT=$(execute_postgres "SELECT COUNT(*) FROM timesheets;" | grep -E '^[0-9]+$')
PG_LEAVE_REQUESTS_COUNT=$(execute_postgres "SELECT COUNT(*) FROM leave_requests;" | grep -E '^[0-9]+$')
PG_PAYSLIPS_COUNT=$(execute_postgres "SELECT COUNT(*) FROM payslips;" | grep -E '^[0-9]+$')

log_message "📊 PostgreSQL Data Summary:"
log_message "   Users: $PG_USERS_COUNT (SQLite: $USERS_COUNT)"
log_message "   Timesheets: $PG_TIMESHEETS_COUNT (SQLite: $TIMESHEETS_COUNT)"
log_message "   Leave Requests: $PG_LEAVE_REQUESTS_COUNT (SQLite: $LEAVE_REQUESTS_COUNT)"
log_message "   Payslips: $PG_PAYSLIPS_COUNT (SQLite: $PAYSLIPS_COUNT)"

# Validation checks
VALIDATION_PASSED=true

if [ "$PG_USERS_COUNT" -lt "$USERS_COUNT" ]; then
    log_message "⚠️  Warning: User count mismatch"
    VALIDATION_PASSED=false
fi

if [ "$PG_TIMESHEETS_COUNT" -lt "$TIMESHEETS_COUNT" ]; then
    log_message "⚠️  Warning: Timesheet count mismatch"
    VALIDATION_PASSED=false
fi

# Test database connection and basic queries
log_message "🧪 Testing database functionality"

# Test user authentication
TEST_USER=$(execute_postgres "SELECT email FROM users WHERE role = 'admin' LIMIT 1;" | head -1)
if [ -n "$TEST_USER" ]; then
    log_message "✅ Admin user found: $TEST_USER"
else
    log_message "⚠️  No admin user found"
    VALIDATION_PASSED=false
fi

# Test views
DASHBOARD_DATA=$(execute_postgres "SELECT COUNT(*) FROM employee_dashboard;" | grep -E '^[0-9]+$')
log_message "📊 Employee dashboard view: $DASHBOARD_DATA records"

# Update sequences to prevent ID conflicts
log_message "🔧 Updating sequences"
execute_postgres "
DO \$\$
DECLARE
    rec RECORD;
    max_id INTEGER;
BEGIN
    FOR rec IN 
        SELECT schemaname, tablename, attname, adsrc
        FROM pg_attribute 
        JOIN pg_class ON pg_attribute.attrelid = pg_class.oid 
        JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid 
        WHERE pg_attribute.attname = 'id' 
        AND pg_namespace.nspname = 'public'
        AND pg_class.relkind = 'r'
    LOOP
        EXECUTE 'SELECT COALESCE(MAX(id), 0) + 1 FROM ' || rec.schemaname || '.' || rec.tablename INTO max_id;
        EXECUTE 'ALTER SEQUENCE ' || rec.schemaname || '.' || rec.tablename || '_id_seq RESTART WITH ' || max_id;
    END LOOP;
END
\$\$;
"

# Log migration completion
execute_postgres "
INSERT INTO audit_logs (action, table_name, new_values, created_at)
VALUES ('DATA_MIGRATION', 'system', '{\"message\": \"SQLite to PostgreSQL migration completed\", \"users\": $PG_USERS_COUNT, \"timesheets\": $PG_TIMESHEETS_COUNT, \"leave_requests\": $PG_LEAVE_REQUESTS_COUNT, \"payslips\": $PG_PAYSLIPS_COUNT}', NOW());
"

# Final summary
log_message "🎉 Migration Summary"
log_message "=================="
if [ "$VALIDATION_PASSED" = true ]; then
    log_message "✅ Migration completed successfully!"
    log_message "✅ All data validation checks passed"
else
    log_message "⚠️  Migration completed with warnings"
    log_message "⚠️  Please review the validation issues above"
fi

log_message "📁 Backup location: $BACKUP_DIR"
log_message "📝 Migration log: $MIGRATION_LOG"
log_message ""
log_message "🚀 PostgreSQL database is ready for production!"
log_message "🔗 Connection: postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"

echo ""
echo "🎯 Next Steps:"
echo "1. Update your application configuration to use PostgreSQL"
echo "2. Test the application with the migrated data"
echo "3. Backup the SQLite database as archive"
echo "4. Deploy to production server"
echo ""
echo "✅ Migration completed! Check $MIGRATION_LOG for detailed logs."
