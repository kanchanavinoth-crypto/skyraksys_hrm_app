#!/bin/bash

# =============================================================================
# 🌱 SkyrakSys HRM - Database Seeding and Validation Script
# =============================================================================
# Comprehensive seeding script with validation and reporting
# Can be run independently or as part of deployment process
# =============================================================================

set -euo pipefail

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# Configuration
readonly PROD_DB_NAME="${DB_NAME:-skyraksys_hrm_prod}"
readonly PROD_DB_USER="${DB_USER:-skyraksys_admin}"
readonly PROD_DB_PASSWORD="${DB_PASSWORD:-}"
readonly BACKEND_DIR="${BACKEND_DIR:-/opt/skyraksys-hrm/backend}"
readonly LOG_FILE="/var/log/skyraksys-hrm/seeding-$(date +%Y%m%d_%H%M%S).log"

print_header() {
    echo -e "${CYAN}=============================================================================="
    echo "  🌱 $1"
    echo "==============================================================================${NC}"
}

print_step() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

print_success() { 
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $1" >> "$LOG_FILE"
}

print_error() { 
    echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "$LOG_FILE"
}

print_warning() { 
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING] $1" >> "$LOG_FILE"
}

print_info() { 
    echo -e "${CYAN}[$(date '+%H:%M:%S')] ℹ️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "$LOG_FILE"
}

error_exit() {
    print_error "$1"
    exit 1
}

# Validate environment and prerequisites
validate_environment() {
    print_step "Validating seeding environment"
    
    # Check database password
    if [[ -z "$PROD_DB_PASSWORD" ]]; then
        error_exit "Database password not provided. Set DB_PASSWORD environment variable."
    fi
    
    # Check backend directory exists
    if [[ ! -d "$BACKEND_DIR" ]]; then
        error_exit "Backend directory not found: $BACKEND_DIR"
    fi
    
    # Test database connection
    print_info "Testing database connection..."
    if PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -c "SELECT 1;" >> "$LOG_FILE" 2>&1; then
        print_success "Database connection successful"
    else
        error_exit "Database connection failed. Check credentials and database status."
    fi
    
    # Check if sequelize-cli is available
    cd "$BACKEND_DIR"
    if ! command -v npx >/dev/null 2>&1; then
        error_exit "npx command not found. Node.js may not be properly installed."
    fi
    
    if ! npx sequelize-cli --version >/dev/null 2>&1; then
        print_info "Installing sequelize-cli..."
        npm install -g sequelize-cli >> "$LOG_FILE" 2>&1 || error_exit "Failed to install sequelize-cli"
    fi
    
    print_success "Environment validation passed"
}

# Check current database state
check_database_state() {
    print_step "Checking current database state"
    
    local users=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE \"deletedAt\" IS NULL;" 2>/dev/null | tr -d ' ' || echo "0")
    local admins=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE role='admin' AND \"isActive\"=true AND \"deletedAt\" IS NULL;" 2>/dev/null | tr -d ' ' || echo "0")
    local depts=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "SELECT COUNT(*) FROM departments WHERE \"deletedAt\" IS NULL;" 2>/dev/null | tr -d ' ' || echo "0")
    local positions=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "SELECT COUNT(*) FROM positions WHERE \"deletedAt\" IS NULL;" 2>/dev/null | tr -d ' ' || echo "0")
    local templates=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "SELECT COUNT(*) FROM payslip_templates WHERE \"deletedAt\" IS NULL;" 2>/dev/null | tr -d ' ' || echo "0")
    
    print_info "Current database state:"
    print_info "  • Users: $users"
    print_info "  • Admin users: $admins"
    print_info "  • Departments: $depts"
    print_info "  • Positions: $positions"
    print_info "  • Payslip templates: $templates"
    
    # Determine if seeding is needed
    local needs_seeding=false
    
    if [[ "$admins" -eq 0 ]]; then
        print_warning "No admin users found - seeding required"
        needs_seeding=true
    fi
    
    if [[ "$depts" -lt 3 ]]; then
        print_warning "Insufficient departments ($depts) - seeding recommended"
        needs_seeding=true
    fi
    
    if [[ "$templates" -eq 0 ]]; then
        print_warning "No payslip templates found - seeding recommended"
        needs_seeding=true
    fi
    
    if [[ "$needs_seeding" == "true" ]]; then
        print_info "Database requires seeding"
        return 0
    else
        print_success "Database appears properly seeded"
        if [[ "${FORCE_SEED:-false}" == "true" ]]; then
            print_info "Force seeding enabled - will proceed anyway"
            return 0
        else
            return 1
        fi
    fi
}

# Run sequelize seeders
run_sequelize_seeders() {
    print_step "Running Sequelize seeders"
    
    cd "$BACKEND_DIR"
    
    # Set seeding environment variables
    export SEED_DEFAULT_PASSWORD="${SEED_DEFAULT_PASSWORD:-admin123}"
    export BCRYPT_ROUNDS="${BCRYPT_ROUNDS:-12}"
    export SEED_DEMO_DATA="${SEED_DEMO_DATA:-true}"
    
    print_info "Seeding configuration:"
    print_info "  • Default password: [PROTECTED]"
    print_info "  • BCrypt rounds: $BCRYPT_ROUNDS"
    print_info "  • Demo data enabled: $SEED_DEMO_DATA"
    
    # Check if seeders exist
    if [[ ! -d "seeders" ]] || [[ -z "$(ls -A seeders 2>/dev/null)" ]]; then
        print_warning "No seeders directory or files found, using manual seeding"
        return 1
    fi
    
    print_info "Found seeders:"
    ls -1 seeders/*.js | while read -r seeder; do
        print_info "  • $(basename "$seeder")"
    done
    
    # Run seeders
    print_info "Executing sequelize seeders..."
    if npx sequelize-cli db:seed:all >> "$LOG_FILE" 2>&1; then
        print_success "Sequelize seeders completed successfully"
        return 0
    else
        print_warning "Sequelize seeders failed, will try manual approach"
        return 1
    fi
}

# Manual seeding fallback
run_manual_seeding() {
    print_step "Running manual database seeding"
    
    print_info "Creating essential departments..."
    PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" << 'EOF' >> "$LOG_FILE" 2>&1
-- Create essential departments
INSERT INTO departments (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Engineering', 'Software development and engineering', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Engineering' AND "deletedAt" IS NULL);

INSERT INTO departments (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Human Resources', 'Employee management and HR services', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Human Resources' AND "deletedAt" IS NULL);

INSERT INTO departments (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Finance', 'Financial planning and accounting', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Finance' AND "deletedAt" IS NULL);

INSERT INTO departments (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Sales', 'Sales and business development', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Sales' AND "deletedAt" IS NULL);

INSERT INTO departments (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Marketing', 'Marketing and brand management', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Marketing' AND "deletedAt" IS NULL);
EOF
    
    if [[ $? -eq 0 ]]; then
        print_success "Departments created successfully"
    else
        print_error "Failed to create departments"
        return 1
    fi
    
    print_info "Creating admin user..."
    PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" << 'EOF' >> "$LOG_FILE" 2>&1
-- Create admin user with all security fields
INSERT INTO users (
    id, email, password, "firstName", "lastName", role, "isActive", 
    "isLocked", "loginAttempts", "createdAt", "updatedAt"
) 
SELECT 
    gen_random_uuid(),
    'admin@skyraksys.com', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Admin', 
    'User', 
    'admin', 
    true,
    false,
    0,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@skyraksys.com' AND "deletedAt" IS NULL
);

-- Ensure admin user is unlocked and active
UPDATE users 
SET "isActive" = true, "isLocked" = false, "loginAttempts" = 0, "lockedAt" = NULL, "updatedAt" = NOW()
WHERE email = 'admin@skyraksys.com' AND "deletedAt" IS NULL;
EOF
    
    if [[ $? -eq 0 ]]; then
        print_success "Admin user created successfully"
    else
        print_error "Failed to create admin user"
        return 1
    fi
    
    print_info "Creating basic positions..."
    PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" << 'EOF' >> "$LOG_FILE" 2>&1
-- Create basic positions for each department
DO $$
DECLARE
    dept_rec RECORD;
BEGIN
    -- Get department IDs
    FOR dept_rec IN 
        SELECT id, name FROM departments WHERE "deletedAt" IS NULL
    LOOP
        -- Create manager position for each department
        INSERT INTO positions (id, title, description, level, "departmentId", "isActive", "createdAt", "updatedAt")
        SELECT 
            gen_random_uuid(),
            dept_rec.name || ' Manager',
            'Manager role for ' || dept_rec.name || ' department',
            'Manager',
            dept_rec.id,
            true,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM positions 
            WHERE title = dept_rec.name || ' Manager' 
            AND "departmentId" = dept_rec.id 
            AND "deletedAt" IS NULL
        );
        
        -- Create executive/specialist position for each department
        INSERT INTO positions (id, title, description, level, "departmentId", "isActive", "createdAt", "updatedAt")
        SELECT 
            gen_random_uuid(),
            CASE 
                WHEN dept_rec.name = 'Engineering' THEN 'Software Engineer'
                WHEN dept_rec.name = 'Human Resources' THEN 'HR Executive'
                WHEN dept_rec.name = 'Finance' THEN 'Accountant'
                WHEN dept_rec.name = 'Sales' THEN 'Sales Executive'
                WHEN dept_rec.name = 'Marketing' THEN 'Marketing Executive'
                ELSE dept_rec.name || ' Specialist'
            END,
            'Entry to mid-level position in ' || dept_rec.name,
            'Executive',
            dept_rec.id,
            true,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM positions 
            WHERE title = CASE 
                WHEN dept_rec.name = 'Engineering' THEN 'Software Engineer'
                WHEN dept_rec.name = 'Human Resources' THEN 'HR Executive'
                WHEN dept_rec.name = 'Finance' THEN 'Accountant'
                WHEN dept_rec.name = 'Sales' THEN 'Sales Executive'
                WHEN dept_rec.name = 'Marketing' THEN 'Marketing Executive'
                ELSE dept_rec.name || ' Specialist'
            END
            AND "departmentId" = dept_rec.id 
            AND "deletedAt" IS NULL
        );
    END LOOP;
END $$;
EOF
    
    if [[ $? -eq 0 ]]; then
        print_success "Basic positions created successfully"
    else
        print_warning "Some positions may not have been created"
    fi
    
    print_info "Creating default payslip template..."
    PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" << 'EOF' >> "$LOG_FILE" 2>&1
-- Create default payslip template
INSERT INTO payslip_templates (
    id, name, description, "isDefault", "isActive", 
    "headerFields", "earningsFields", "deductionsFields", "footerFields",
    "createdAt", "updatedAt"
) 
SELECT 
    gen_random_uuid(),
    'Standard Monthly Payslip',
    'Default template for monthly salary with standard Indian payroll components',
    true,
    true,
    '[{"id":"companyName","label":"Company Name","type":"text"},{"id":"payPeriod","label":"Pay Period","type":"text"},{"id":"employeeName","label":"Employee Name","type":"text"},{"id":"employeeId","label":"Employee ID","type":"text"},{"id":"department","label":"Department","type":"text"}]',
    '[{"id":"basicSalary","label":"Basic Salary","type":"currency"},{"id":"hra","label":"House Rent Allowance","type":"currency"},{"id":"conveyance","label":"Conveyance Allowance","type":"currency"},{"id":"grossSalary","label":"Gross Salary","type":"currency","calculated":true}]',
    '[{"id":"pfContribution","label":"PF Contribution","type":"currency"},{"id":"tds","label":"TDS","type":"currency"},{"id":"totalDeductions","label":"Total Deductions","type":"currency","calculated":true}]',
    '[{"id":"netSalary","label":"Net Salary","type":"currency","calculated":true},{"id":"workingDays","label":"Working Days","type":"number"},{"id":"generatedDate","label":"Generated Date","type":"date"}]',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM payslip_templates WHERE "isDefault" = true AND "deletedAt" IS NULL
);
EOF
    
    if [[ $? -eq 0 ]]; then
        print_success "Default payslip template created successfully"
    else
        print_warning "Payslip template creation may have had issues"
    fi
    
    return 0
}

# Validate seeding results
validate_seeding_results() {
    print_step "Validating seeding results"
    
    local users=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE \"deletedAt\" IS NULL;" 2>/dev/null | tr -d ' ' || echo "0")
    local admins=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE role='admin' AND \"isActive\"=true AND \"deletedAt\" IS NULL;" 2>/dev/null | tr -d ' ' || echo "0")
    local depts=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "SELECT COUNT(*) FROM departments WHERE \"deletedAt\" IS NULL;" 2>/dev/null | tr -d ' ' || echo "0")
    local positions=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "SELECT COUNT(*) FROM positions WHERE \"deletedAt\" IS NULL;" 2>/dev/null | tr -d ' ' || echo "0")
    local templates=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "SELECT COUNT(*) FROM payslip_templates WHERE \"deletedAt\" IS NULL;" 2>/dev/null | tr -d ' ' || echo "0")
    
    print_info "Final database state:"
    print_info "  • Total users: $users"
    print_info "  • Admin users: $admins"
    print_info "  • Departments: $depts"
    print_info "  • Positions: $positions"
    print_info "  • Payslip templates: $templates"
    
    # Validation criteria
    local validation_passed=true
    
    if [[ "$admins" -eq 0 ]]; then
        print_error "No admin users found - critical failure"
        validation_passed=false
    else
        print_success "Admin users verified ($admins)"
    fi
    
    if [[ "$depts" -lt 3 ]]; then
        print_warning "Low department count ($depts) - may impact functionality"
    else
        print_success "Departments verified ($depts)"
    fi
    
    if [[ "$positions" -eq 0 ]]; then
        print_warning "No positions found - organizational structure incomplete"
    else
        print_success "Positions verified ($positions)"
    fi
    
    if [[ "$templates" -eq 0 ]]; then
        print_warning "No payslip templates found - payroll functionality limited"
    else
        print_success "Payslip templates verified ($templates)"
    fi
    
    # Test admin login capability
    print_info "Testing admin user authentication fields..."
    local admin_check=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "
        SELECT COUNT(*) FROM users 
        WHERE email='admin@skyraksys.com' 
        AND \"isActive\"=true 
        AND \"isLocked\"=false 
        AND \"deletedAt\" IS NULL;
    " 2>/dev/null | tr -d ' ' || echo "0")
    
    if [[ "$admin_check" -eq 1 ]]; then
        print_success "Admin user authentication setup verified"
    else
        print_error "Admin user authentication setup failed"
        validation_passed=false
    fi
    
    if [[ "$validation_passed" == "true" ]]; then
        print_success "Seeding validation passed successfully"
        return 0
    else
        print_error "Seeding validation failed"
        return 1
    fi
}

# Generate seeding report
generate_seeding_report() {
    print_step "Generating seeding report"
    
    local report_file="/opt/skyraksys-hrm/seeding-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
# SkyrakSys HRM - Database Seeding Report
Generated: $(date)
Database: $PROD_DB_NAME
User: $PROD_DB_USER

## Seeding Summary
$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -c "
SELECT 'Users: ' || COUNT(*) FROM users WHERE \"deletedAt\" IS NULL
UNION ALL
SELECT 'Admin Users: ' || COUNT(*) FROM users WHERE role='admin' AND \"isActive\"=true AND \"deletedAt\" IS NULL
UNION ALL
SELECT 'Departments: ' || COUNT(*) FROM departments WHERE \"deletedAt\" IS NULL
UNION ALL
SELECT 'Positions: ' || COUNT(*) FROM positions WHERE \"deletedAt\" IS NULL
UNION ALL
SELECT 'Payslip Templates: ' || COUNT(*) FROM payslip_templates WHERE \"deletedAt\" IS NULL;
" 2>/dev/null || echo "Database query failed")

## Department List
$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -c "
SELECT name, description, \"isActive\"
FROM departments 
WHERE \"deletedAt\" IS NULL
ORDER BY name;
" 2>/dev/null || echo "Department query failed")

## Admin Users
$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -c "
SELECT email, \"firstName\", \"lastName\", \"isActive\", \"isLocked\"
FROM users 
WHERE role='admin' AND \"deletedAt\" IS NULL
ORDER BY email;
" 2>/dev/null || echo "Admin user query failed")

## Position Summary
$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -c "
SELECT d.name as department, COUNT(p.id) as positions
FROM departments d
LEFT JOIN positions p ON d.id = p.\"departmentId\" AND p.\"deletedAt\" IS NULL
WHERE d.\"deletedAt\" IS NULL
GROUP BY d.name
ORDER BY d.name;
" 2>/dev/null || echo "Position query failed")

## Default Login Credentials
Email: admin@skyraksys.com
Password: [SEED_DEFAULT_PASSWORD environment variable or 'admin123']
⚠️  CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN

## Seeding Log Location
Log File: $LOG_FILE
EOF
    
    print_success "Seeding report saved to: $report_file"
    echo "$report_file"
}

# Main seeding function
main() {
    print_header "SkyrakSys HRM Database Seeding"
    print_info "Starting comprehensive database seeding process"
    print_info "Target database: $PROD_DB_NAME"
    print_info "Seeding started: $(date)"
    echo ""
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Validate environment
    validate_environment
    
    # Check if seeding is needed
    if ! check_database_state; then
        if [[ "${FORCE_SEED:-false}" != "true" ]]; then
            print_header "Seeding Skipped"
            print_success "Database is already properly seeded"
            print_info "Use FORCE_SEED=true to re-seed anyway"
            exit 0
        fi
    fi
    
    # Run seeding
    if run_sequelize_seeders; then
        print_success "Sequelize seeding completed"
    else
        print_info "Falling back to manual seeding..."
        if ! run_manual_seeding; then
            error_exit "Both Sequelize and manual seeding failed"
        fi
    fi
    
    # Validate results
    if validate_seeding_results; then
        print_success "Seeding validation passed"
    else
        error_exit "Seeding validation failed"
    fi
    
    # Generate report
    report_file=$(generate_seeding_report)
    
    # Summary
    print_header "Seeding Completed Successfully!"
    echo ""
    print_success "✅ Database seeding completed successfully"
    print_success "✅ All validation checks passed"
    print_success "✅ Admin user ready for login"
    print_success "✅ Organizational structure established"
    echo ""
    print_info "📄 Seeding log: $LOG_FILE"
    print_info "📊 Seeding report: $report_file"
    echo ""
    print_info "🔐 Admin credentials:"
    print_info "   Email: admin@skyraksys.com"
    print_info "   Password: \${SEED_DEFAULT_PASSWORD:-admin123}"
    print_info "   ⚠️  CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN"
    echo ""
    print_success "Database is ready for production use!"
}

# Usage information
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Environment Variables:
  DB_NAME                Database name (default: skyraksys_hrm_prod)
  DB_USER                Database user (default: skyraksys_admin)
  DB_PASSWORD            Database password (required)
  SEED_DEFAULT_PASSWORD  Default password for seeded users (default: admin123)
  BCRYPT_ROUNDS         BCrypt rounds for password hashing (default: 12)
  SEED_DEMO_DATA        Enable demo data seeding (default: true)
  FORCE_SEED            Force seeding even if data exists (default: false)
  BACKEND_DIR           Backend directory path (default: /opt/skyraksys-hrm/backend)

Options:
  --help, -h            Show this help message
  --force               Force seeding even if data exists
  --check-only          Only check database state, don't seed

Examples:
  # Normal seeding
  DB_PASSWORD="your_password" bash $0
  
  # Force re-seed with custom password
  DB_PASSWORD="your_password" FORCE_SEED=true SEED_DEFAULT_PASSWORD="newpass123" bash $0
  
  # Check database state only
  DB_PASSWORD="your_password" bash $0 --check-only
EOF
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        show_usage
        exit 0
        ;;
    --force)
        export FORCE_SEED=true
        main
        ;;
    --check-only)
        validate_environment
        check_database_state
        exit $?
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac