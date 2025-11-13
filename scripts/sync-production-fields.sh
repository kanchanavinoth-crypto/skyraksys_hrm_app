#!/bin/bash

# Production Database Field Synchronization Script
# For Skyraksys HRM Application
# Generated on: November 13, 2025

# ==================================================
# IMPORTANT: READ BEFORE EXECUTING
# ==================================================
# 
# This script is provided for reference purposes.
# Based on our analysis, NO FIELD SYNCHRONIZATION IS NEEDED
# because all layers already use camelCase naming convention.
#
# Only execute this if you have a production database 
# with snake_case columns that needs to be converted.
# 
# ==================================================

# Script Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="skyraksys_hrm_prod"
DB_USER="postgres"
BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/var/log/hrm_field_sync.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Prerequisite checks
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        error "PostgreSQL client (psql) not found. Please install it first."
        exit 1
    fi
    
    # Check database connectivity
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        error "Cannot connect to database. Please check credentials and connectivity."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating database backup..."
    mkdir -p "$BACKUP_DIR"
    
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_DIR/full_backup.sql"
    
    if [ $? -eq 0 ]; then
        success "Backup created at $BACKUP_DIR/full_backup.sql"
    else
        error "Backup failed. Exiting."
        exit 1
    fi
}

# Check current field naming convention
check_field_naming() {
    log "Checking current field naming convention..."
    
    # Check if tables exist and their column naming
    SNAKE_CASE_COLUMNS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name ~ '_[a-z]'
    " 2>/dev/null | tr -d ' ')
    
    CAMEL_CASE_COLUMNS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name ~ '[a-z][A-Z]'
    " 2>/dev/null | tr -d ' ')
    
    log "Found $SNAKE_CASE_COLUMNS snake_case columns"
    log "Found $CAMEL_CASE_COLUMNS camelCase columns"
    
    if [ "$SNAKE_CASE_COLUMNS" -eq 0 ]; then
        success "No snake_case columns found. Database already uses camelCase naming."
        log "No synchronization needed. Exiting."
        exit 0
    fi
}

# Field conversion mappings
# Only execute if snake_case fields are found
convert_fields() {
    log "Converting field names from snake_case to camelCase..."
    
    # Users table field conversions
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
BEGIN;

-- Users table
DO $$
BEGIN
    -- Check if old columns exist before renaming
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users RENAME COLUMN first_name TO firstName;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users RENAME COLUMN last_name TO lastName;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE users RENAME COLUMN is_active TO isActive;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
        ALTER TABLE users RENAME COLUMN last_login_at TO lastLoginAt;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_changed_at') THEN
        ALTER TABLE users RENAME COLUMN password_changed_at TO passwordChangedAt;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified_at') THEN
        ALTER TABLE users RENAME COLUMN email_verified_at TO emailVerifiedAt;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users RENAME COLUMN created_at TO createdAt;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users RENAME COLUMN updated_at TO updatedAt;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'deleted_at') THEN
        ALTER TABLE users RENAME COLUMN deleted_at TO deletedAt;
    END IF;
END
$$;

COMMIT;
EOF

    # Employees table field conversions
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
BEGIN;

-- Employees table
DO $$
BEGIN
    -- Foreign keys
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'user_id') THEN
        ALTER TABLE employees RENAME COLUMN user_id TO userId;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'department_id') THEN
        ALTER TABLE employees RENAME COLUMN department_id TO departmentId;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'position_id') THEN
        ALTER TABLE employees RENAME COLUMN position_id TO positionId;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'manager_id') THEN
        ALTER TABLE employees RENAME COLUMN manager_id TO managerId;
    END IF;
    
    -- Basic info
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'employee_id') THEN
        ALTER TABLE employees RENAME COLUMN employee_id TO employeeId;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'first_name') THEN
        ALTER TABLE employees RENAME COLUMN first_name TO firstName;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'last_name') THEN
        ALTER TABLE employees RENAME COLUMN last_name TO lastName;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'hire_date') THEN
        ALTER TABLE employees RENAME COLUMN hire_date TO hireDate;
    END IF;
    
    -- Statutory details
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'aadhaar_number') THEN
        ALTER TABLE employees RENAME COLUMN aadhaar_number TO aadhaarNumber;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'pan_number') THEN
        ALTER TABLE employees RENAME COLUMN pan_number TO panNumber;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'uan_number') THEN
        ALTER TABLE employees RENAME COLUMN uan_number TO uanNumber;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'pf_number') THEN
        ALTER TABLE employees RENAME COLUMN pf_number TO pfNumber;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'esi_number') THEN
        ALTER TABLE employees RENAME COLUMN esi_number TO esiNumber;
    END IF;
    
    -- Bank details
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'bank_name') THEN
        ALTER TABLE employees RENAME COLUMN bank_name TO bankName;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'bank_account_number') THEN
        ALTER TABLE employees RENAME COLUMN bank_account_number TO bankAccountNumber;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'ifsc_code') THEN
        ALTER TABLE employees RENAME COLUMN ifsc_code TO ifscCode;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'bank_branch') THEN
        ALTER TABLE employees RENAME COLUMN bank_branch TO bankBranch;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'account_holder_name') THEN
        ALTER TABLE employees RENAME COLUMN account_holder_name TO accountHolderName;
    END IF;
    
    -- Personal details
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'pin_code') THEN
        ALTER TABLE employees RENAME COLUMN pin_code TO pinCode;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE employees RENAME COLUMN emergency_contact_name TO emergencyContactName;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'emergency_contact_phone') THEN
        ALTER TABLE employees RENAME COLUMN emergency_contact_phone TO emergencyContactPhone;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'emergency_contact_relation') THEN
        ALTER TABLE employees RENAME COLUMN emergency_contact_relation TO emergencyContactRelation;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'date_of_birth') THEN
        ALTER TABLE employees RENAME COLUMN date_of_birth TO dateOfBirth;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'photo_url') THEN
        ALTER TABLE employees RENAME COLUMN photo_url TO photoUrl;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'marital_status') THEN
        ALTER TABLE employees RENAME COLUMN marital_status TO maritalStatus;
    END IF;
    
    -- Work details
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'work_location') THEN
        ALTER TABLE employees RENAME COLUMN work_location TO workLocation;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'employment_type') THEN
        ALTER TABLE employees RENAME COLUMN employment_type TO employmentType;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'joining_date') THEN
        ALTER TABLE employees RENAME COLUMN joining_date TO joiningDate;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'confirmation_date') THEN
        ALTER TABLE employees RENAME COLUMN confirmation_date TO confirmationDate;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'resignation_date') THEN
        ALTER TABLE employees RENAME COLUMN resignation_date TO resignationDate;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'last_working_date') THEN
        ALTER TABLE employees RENAME COLUMN last_working_date TO lastWorkingDate;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'probation_period') THEN
        ALTER TABLE employees RENAME COLUMN probation_period TO probationPeriod;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'notice_period') THEN
        ALTER TABLE employees RENAME COLUMN notice_period TO noticePeriod;
    END IF;
    
    -- Timestamps
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'created_at') THEN
        ALTER TABLE employees RENAME COLUMN created_at TO createdAt;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'updated_at') THEN
        ALTER TABLE employees RENAME COLUMN updated_at TO updatedAt;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'deleted_at') THEN
        ALTER TABLE employees RENAME COLUMN deleted_at TO deletedAt;
    END IF;
END
$$;

COMMIT;
EOF

    # Departments table
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
BEGIN;

-- Departments table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'is_active') THEN
        ALTER TABLE departments RENAME COLUMN is_active TO isActive;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'created_at') THEN
        ALTER TABLE departments RENAME COLUMN created_at TO createdAt;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'updated_at') THEN
        ALTER TABLE departments RENAME COLUMN updated_at TO updatedAt;
    END IF;
END
$$;

COMMIT;
EOF

    # Positions table
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
BEGIN;

-- Positions table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'positions' AND column_name = 'department_id') THEN
        ALTER TABLE positions RENAME COLUMN department_id TO departmentId;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'positions' AND column_name = 'is_active') THEN
        ALTER TABLE positions RENAME COLUMN is_active TO isActive;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'positions' AND column_name = 'created_at') THEN
        ALTER TABLE positions RENAME COLUMN created_at TO createdAt;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'positions' AND column_name = 'updated_at') THEN
        ALTER TABLE positions RENAME COLUMN updated_at TO updatedAt;
    END IF;
END
$$;

COMMIT;
EOF

    if [ $? -eq 0 ]; then
        success "Field conversion completed successfully"
    else
        error "Field conversion failed"
        exit 1
    fi
}

# Verify conversion
verify_conversion() {
    log "Verifying field conversion..."
    
    # Check for any remaining snake_case columns
    REMAINING_SNAKE_CASE=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name ~ '_[a-z]'
        AND table_name IN ('users', 'employees', 'departments', 'positions')
    " 2>/dev/null | tr -d ' ')
    
    if [ "$REMAINING_SNAKE_CASE" -eq 0 ]; then
        success "All fields successfully converted to camelCase"
    else
        warning "$REMAINING_SNAKE_CASE snake_case columns still remain"
    fi
}

# Main execution
main() {
    log "Starting Skyraksys HRM Production Database Field Synchronization"
    log "=================================================="
    
    # Display warning
    warning "THIS SCRIPT WILL MODIFY YOUR PRODUCTION DATABASE"
    warning "ENSURE YOU HAVE PROPER BACKUPS BEFORE PROCEEDING"
    echo ""
    read -p "Do you want to continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        log "Operation cancelled by user"
        exit 0
    fi
    
    # Set database password
    read -s -p "Enter database password for user $DB_USER: " DB_PASSWORD
    echo ""
    export DB_PASSWORD
    
    # Execute steps
    check_prerequisites
    create_backup
    check_field_naming
    convert_fields
    verify_conversion
    
    success "Field synchronization completed successfully!"
    log "Backup location: $BACKUP_DIR"
    log "Log file: $LOG_FILE"
}

# Execute main function
main "$@"