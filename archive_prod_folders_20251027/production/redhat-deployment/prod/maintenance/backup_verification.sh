#!/bin/bash

# Backup Verification Script for Skyraksys HRM
# Verifies backup integrity and performs test restores
# Should be run daily after backups are created

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/skyraksys-hrm/backup-verification.log"
BACKUP_DIR="/opt/skyraksys-hrm/backups"
TEST_DB_NAME="hrm_backup_test"
PROD_DB_NAME="skyraksys_hrm_prod"
DB_USER="hrm_app"
ALERT_EMAIL="admin@skyraksys.com"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "${BLUE}=========================================="
    echo -e "$1"
    echo -e "==========================================${NC}"
}

# Send alert email
send_alert() {
    local subject="$1"
    local message="$2"
    
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || true
    fi
    
    # Also log to system log
    logger -p local0.err "HRM Backup Alert: $subject - $message"
}

# Get latest backup file
get_latest_backup() {
    local latest_backup=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
        echo "$latest_backup"
        return 0
    else
        return 1
    fi
}

# Check backup file integrity
check_backup_integrity() {
    local backup_file="$1"
    
    print_status "Checking backup file integrity: $(basename "$backup_file")"
    
    # Check if file exists and is readable
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file does not exist: $backup_file"
        return 1
    fi
    
    if [ ! -r "$backup_file" ]; then
        print_error "Backup file is not readable: $backup_file"
        return 1
    fi
    
    # Check file size (should be > 1MB for a real database)
    local file_size=$(stat -c%s "$backup_file" 2>/dev/null || echo "0")
    local size_mb=$((file_size / 1024 / 1024))
    
    if [ "$size_mb" -lt 1 ]; then
        print_warning "Backup file seems too small: ${size_mb}MB"
        return 1
    fi
    
    print_status "Backup file size: ${size_mb}MB"
    
    # Test gzip integrity
    if echo "$backup_file" | grep -q "\.gz$"; then
        if gzip -t "$backup_file" 2>/dev/null; then
            print_status "Gzip integrity check passed"
        else
            print_error "Gzip integrity check failed"
            return 1
        fi
    fi
    
    # Test if it's a valid SQL dump by checking first few lines
    local first_lines
    if echo "$backup_file" | grep -q "\.gz$"; then
        first_lines=$(zcat "$backup_file" 2>/dev/null | head -10)
    else
        first_lines=$(head -10 "$backup_file" 2>/dev/null)
    fi
    
    if echo "$first_lines" | grep -q "PostgreSQL database dump"; then
        print_status "Valid PostgreSQL dump format detected"
        return 0
    else
        print_error "Invalid PostgreSQL dump format"
        return 1
    fi
}

# Create test database
create_test_database() {
    print_status "Creating test database: $TEST_DB_NAME"
    
    # Drop test database if it exists
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" 2>/dev/null || true
    
    # Create test database
    if sudo -u postgres psql -c "CREATE DATABASE $TEST_DB_NAME;"; then
        print_status "Test database created successfully"
        return 0
    else
        print_error "Failed to create test database"
        return 1
    fi
}

# Restore backup to test database
restore_backup_to_test() {
    local backup_file="$1"
    
    print_status "Restoring backup to test database..."
    
    # Restore the backup
    local restore_start=$(date +%s)
    
    if echo "$backup_file" | grep -q "\.gz$"; then
        if zcat "$backup_file" | sudo -u postgres psql -d "$TEST_DB_NAME" > /dev/null 2>&1; then
            local restore_end=$(date +%s)
            local restore_time=$((restore_end - restore_start))
            print_status "Backup restored successfully in ${restore_time} seconds"
            return 0
        else
            print_error "Failed to restore backup"
            return 1
        fi
    else
        if sudo -u postgres psql -d "$TEST_DB_NAME" < "$backup_file" > /dev/null 2>&1; then
            local restore_end=$(date +%s)
            local restore_time=$((restore_end - restore_start))
            print_status "Backup restored successfully in ${restore_time} seconds"
            return 0
        else
            print_error "Failed to restore backup"
            return 1
        fi
    fi
}

# Verify database structure
verify_database_structure() {
    print_status "Verifying database structure..."
    
    # Check if main tables exist
    local expected_tables=(
        "users"
        "employees"
        "departments"
        "positions"
        "payslip_templates"
        "payslips"
        "payslip_items"
        "attendance"
        "leaves"
        "projects"
        "tasks"
        "timesheets"
        "timesheet_entries"
        "audit_logs"
    )
    
    local missing_tables=()
    
    for table in "${expected_tables[@]}"; do
        local table_exists=$(sudo -u postgres psql -d "$TEST_DB_NAME" -t -c "
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '$table'
            );
        " 2>/dev/null | xargs)
        
        if [ "$table_exists" != "t" ]; then
            missing_tables+=("$table")
        fi
    done
    
    if [ ${#missing_tables[@]} -eq 0 ]; then
        print_status "All expected tables found"
    else
        print_error "Missing tables: ${missing_tables[*]}"
        return 1
    fi
    
    # Check table counts
    print_status "Table row counts:"
    sudo -u postgres psql -d "$TEST_DB_NAME" -c "
        SELECT 
            schemaname,
            tablename,
            n_live_tup as row_count
        FROM pg_stat_user_tables
        WHERE n_live_tup > 0
        ORDER BY n_live_tup DESC;
    " 2>&1 | tee -a "$LOG_FILE"
    
    return 0
}

# Verify data integrity
verify_data_integrity() {
    print_status "Verifying data integrity..."
    
    # Check for basic referential integrity
    local integrity_checks=(
        "SELECT COUNT(*) FROM employees WHERE department_id NOT IN (SELECT id FROM departments)"
        "SELECT COUNT(*) FROM payslips WHERE employee_id NOT IN (SELECT id FROM employees)"
        "SELECT COUNT(*) FROM timesheet_entries WHERE timesheet_id NOT IN (SELECT id FROM timesheets)"
        "SELECT COUNT(*) FROM audit_logs WHERE table_name IS NULL OR action IS NULL"
    )
    
    local integrity_names=(
        "Orphaned employees (no department)"
        "Orphaned payslips (no employee)"
        "Orphaned timesheet entries (no timesheet)"
        "Invalid audit logs"
    )
    
    local integrity_issues=0
    
    for i in "${!integrity_checks[@]}"; do
        local check="${integrity_checks[$i]}"
        local name="${integrity_names[$i]}"
        
        local count=$(sudo -u postgres psql -d "$TEST_DB_NAME" -t -c "$check" 2>/dev/null | xargs)
        
        if [ "$count" -gt 0 ]; then
            print_warning "$name: $count records"
            integrity_issues=$((integrity_issues + count))
        else
            print_status "$name: OK"
        fi
    done
    
    if [ "$integrity_issues" -eq 0 ]; then
        print_status "Data integrity verification passed"
        return 0
    else
        print_warning "Found $integrity_issues data integrity issues"
        return 1
    fi
}

# Verify critical functions work
verify_database_functions() {
    print_status "Verifying database functions..."
    
    # Test basic queries that the application would use
    local test_queries=(
        "SELECT COUNT(*) FROM users WHERE active = true"
        "SELECT COUNT(*) FROM employees WHERE status = 'active'"
        "SELECT COUNT(*) FROM payslip_templates WHERE is_active = true"
        "SELECT VERSION()"
    )
    
    for query in "${test_queries[@]}"; do
        if sudo -u postgres psql -d "$TEST_DB_NAME" -t -c "$query" > /dev/null 2>&1; then
            print_status "Query test passed: $query"
        else
            print_error "Query test failed: $query"
            return 1
        fi
    done
    
    # Test if triggers are working
    print_status "Testing database triggers..."
    
    # Test audit trigger by inserting a test record
    local trigger_test=$(sudo -u postgres psql -d "$TEST_DB_NAME" -t -c "
        INSERT INTO departments (name, code, created_at, updated_at) 
        VALUES ('Test Dept', 'TESTD', NOW(), NOW()) 
        RETURNING id;
    " 2>/dev/null | xargs)
    
    if [ -n "$trigger_test" ]; then
        # Check if audit log was created
        local audit_count=$(sudo -u postgres psql -d "$TEST_DB_NAME" -t -c "
            SELECT COUNT(*) FROM audit_logs 
            WHERE table_name = 'departments' 
            AND record_id = '$trigger_test' 
            AND action = 'INSERT';
        " 2>/dev/null | xargs)
        
        if [ "$audit_count" -gt 0 ]; then
            print_status "Audit trigger test passed"
        else
            print_warning "Audit trigger test failed"
        fi
        
        # Clean up test record
        sudo -u postgres psql -d "$TEST_DB_NAME" -c "
            DELETE FROM departments WHERE id = '$trigger_test';
        " > /dev/null 2>&1
    else
        print_warning "Could not test triggers"
    fi
    
    return 0
}

# Compare with production database
compare_with_production() {
    print_status "Comparing with production database..."
    
    # Get table counts from both databases
    local prod_counts=$(sudo -u postgres psql -d "$PROD_DB_NAME" -t -c "
        SELECT tablename||':'||n_live_tup 
        FROM pg_stat_user_tables 
        WHERE n_live_tup > 0
        ORDER BY tablename;
    " 2>/dev/null)
    
    local test_counts=$(sudo -u postgres psql -d "$TEST_DB_NAME" -t -c "
        SELECT tablename||':'||n_live_tup 
        FROM pg_stat_user_tables 
        WHERE n_live_tup > 0
        ORDER BY tablename;
    " 2>/dev/null)
    
    if [ "$prod_counts" = "$test_counts" ]; then
        print_status "Table counts match production database"
    else
        print_warning "Table counts differ from production database"
        print_status "Production counts:"
        echo "$prod_counts" | tee -a "$LOG_FILE"
        print_status "Backup counts:"
        echo "$test_counts" | tee -a "$LOG_FILE"
    fi
    
    return 0
}

# Clean up test database
cleanup_test_database() {
    print_status "Cleaning up test database..."
    
    if sudo -u postgres psql -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" 2>/dev/null; then
        print_status "Test database cleaned up"
    else
        print_warning "Failed to clean up test database"
    fi
}

# Generate verification report
generate_verification_report() {
    local backup_file="$1"
    local verification_result="$2"
    
    local report_file="/var/log/skyraksys-hrm/backup-verification-$(date +%Y%m%d).txt"
    
    {
        echo "=== Skyraksys HRM Backup Verification Report ==="
        echo "Date: $(date)"
        echo "Backup File: $backup_file"
        echo "Verification Result: $verification_result"
        echo ""
        
        echo "=== Backup File Details ==="
        if [ -f "$backup_file" ]; then
            echo "File Size: $(du -h "$backup_file" | cut -f1)"
            echo "File Date: $(stat -c %y "$backup_file")"
            echo "File Permissions: $(stat -c %A "$backup_file")"
        fi
        
        echo ""
        echo "=== Verification Tests ==="
        echo "- File integrity: $([ -f "$backup_file" ] && echo "PASSED" || echo "FAILED")"
        echo "- SQL format: $([ "$verification_result" = "SUCCESS" ] && echo "PASSED" || echo "FAILED")"
        echo "- Database restore: $([ "$verification_result" = "SUCCESS" ] && echo "PASSED" || echo "FAILED")"
        echo "- Structure verification: $([ "$verification_result" = "SUCCESS" ] && echo "PASSED" || echo "FAILED")"
        echo "- Data integrity: $([ "$verification_result" = "SUCCESS" ] && echo "PASSED" || echo "FAILED")"
        
        echo ""
        echo "Report generated at: $(date)"
        
    } > "$report_file"
    
    print_status "Verification report saved: $report_file"
}

# Main verification function
main() {
    print_header "Skyraksys HRM Backup Verification - $(date)"
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    log_message "Starting backup verification"
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Backup directory does not exist: $BACKUP_DIR"
        send_alert "HRM Backup Verification Failed" "Backup directory does not exist: $BACKUP_DIR"
        exit 1
    fi
    
    # Get latest backup
    local latest_backup
    if ! latest_backup=$(get_latest_backup); then
        print_error "No backup files found in $BACKUP_DIR"
        send_alert "HRM Backup Verification Failed" "No backup files found"
        exit 1
    fi
    
    print_status "Latest backup: $(basename "$latest_backup")"
    
    # Verification steps
    local verification_result="SUCCESS"
    
    # Step 1: Check backup integrity
    if ! check_backup_integrity "$latest_backup"; then
        verification_result="FAILED"
        send_alert "HRM Backup Verification Failed" "Backup integrity check failed for $(basename "$latest_backup")"
    fi
    
    # Step 2: Create test database
    if [ "$verification_result" = "SUCCESS" ]; then
        if ! create_test_database; then
            verification_result="FAILED"
            send_alert "HRM Backup Verification Failed" "Could not create test database"
        fi
    fi
    
    # Step 3: Restore backup to test database
    if [ "$verification_result" = "SUCCESS" ]; then
        if ! restore_backup_to_test "$latest_backup"; then
            verification_result="FAILED"
            send_alert "HRM Backup Verification Failed" "Could not restore backup to test database"
        fi
    fi
    
    # Step 4: Verify database structure
    if [ "$verification_result" = "SUCCESS" ]; then
        if ! verify_database_structure; then
            verification_result="FAILED"
            send_alert "HRM Backup Verification Failed" "Database structure verification failed"
        fi
    fi
    
    # Step 5: Verify data integrity
    if [ "$verification_result" = "SUCCESS" ]; then
        if ! verify_data_integrity; then
            print_warning "Data integrity issues found, but backup is still usable"
        fi
    fi
    
    # Step 6: Verify database functions
    if [ "$verification_result" = "SUCCESS" ]; then
        if ! verify_database_functions; then
            verification_result="FAILED"
            send_alert "HRM Backup Verification Failed" "Database functions verification failed"
        fi
    fi
    
    # Step 7: Compare with production
    if [ "$verification_result" = "SUCCESS" ]; then
        compare_with_production
    fi
    
    # Cleanup
    cleanup_test_database
    
    # Generate report
    generate_verification_report "$latest_backup" "$verification_result"
    
    # Final result
    if [ "$verification_result" = "SUCCESS" ]; then
        print_header "VERIFICATION SUCCESSFUL"
        print_status "Backup verification completed successfully"
        log_message "Backup verification completed successfully"
    else
        print_header "VERIFICATION FAILED"
        print_error "Backup verification failed"
        log_message "Backup verification failed"
        exit 1
    fi
    
    echo "Verification completed at: $(date)"
    echo "=============================================="
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script with sudo"
    exit 1
fi

# Run verification
main

exit 0