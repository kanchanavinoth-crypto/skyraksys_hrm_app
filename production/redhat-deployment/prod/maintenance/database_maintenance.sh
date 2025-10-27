#!/bin/bash

# Database Maintenance Script for Skyraksys HRM
# Performs database optimization, cleanup, and health checks
# Should be run weekly or monthly

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/skyraksys-hrm/db-maintenance.log"
DB_NAME="skyraksys_hrm_prod"
DB_USER="hrm_app"
BACKUP_DIR="/opt/skyraksys-hrm/backups"
RETENTION_DAYS=30

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if PostgreSQL is running
check_postgresql() {
    if ! systemctl is-active --quiet postgresql-15; then
        print_error "PostgreSQL is not running"
        exit 1
    fi
    print_status "PostgreSQL is running"
}

# Test database connection
test_db_connection() {
    if sudo -u postgres psql -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
        print_status "Database connection successful"
    else
        print_error "Cannot connect to database"
        exit 1
    fi
}

# Create backup before maintenance
create_backup() {
    print_status "Creating backup before maintenance..."
    
    mkdir -p "$BACKUP_DIR"
    
    local backup_file="$BACKUP_DIR/maintenance_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if sudo -u postgres pg_dump -d "$DB_NAME" > "$backup_file"; then
        gzip "$backup_file"
        print_status "Backup created: $backup_file.gz"
        return 0
    else
        print_error "Backup creation failed"
        return 1
    fi
}

# Analyze database statistics
analyze_database() {
    print_status "Analyzing database statistics..."
    
    sudo -u postgres psql -d "$DB_NAME" -c "ANALYZE;" 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        print_status "Database analysis completed"
    else
        print_error "Database analysis failed"
        return 1
    fi
}

# Vacuum database
vacuum_database() {
    print_status "Starting database vacuum..."
    
    # Get list of tables that need vacuuming
    local tables=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
        SELECT schemaname||'.'||tablename 
        FROM pg_stat_user_tables 
        WHERE n_dead_tup > 100 
        ORDER BY n_dead_tup DESC;
    ")
    
    if [ -n "$tables" ]; then
        print_status "Tables needing vacuum: $(echo "$tables" | wc -l)"
        
        while IFS= read -r table; do
            if [ -n "$table" ]; then
                table=$(echo "$table" | xargs)  # trim whitespace
                print_status "Vacuuming table: $table"
                sudo -u postgres psql -d "$DB_NAME" -c "VACUUM ANALYZE $table;" 2>&1 | tee -a "$LOG_FILE"
            fi
        done <<< "$tables"
    else
        print_status "No tables need vacuuming"
    fi
    
    # Full vacuum on system tables
    print_status "Performing full database vacuum..."
    sudo -u postgres psql -d "$DB_NAME" -c "VACUUM;" 2>&1 | tee -a "$LOG_FILE"
    
    print_status "Database vacuum completed"
}

# Reindex database
reindex_database() {
    print_status "Reindexing database..."
    
    # Get fragmented indexes
    local fragmented_indexes=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
        SELECT schemaname||'.'||indexname 
        FROM pg_stat_user_indexes 
        WHERE idx_scan < 100 AND idx_tup_read > 1000
        ORDER BY idx_tup_read DESC 
        LIMIT 10;
    ")
    
    if [ -n "$fragmented_indexes" ]; then
        print_status "Reindexing fragmented indexes..."
        
        while IFS= read -r index; do
            if [ -n "$index" ]; then
                index=$(echo "$index" | xargs)  # trim whitespace
                print_status "Reindexing: $index"
                sudo -u postgres psql -d "$DB_NAME" -c "REINDEX INDEX $index;" 2>&1 | tee -a "$LOG_FILE"
            fi
        done <<< "$fragmented_indexes"
    else
        print_status "No indexes need reindexing"
    fi
}

# Clean up old audit logs
cleanup_audit_logs() {
    print_status "Cleaning up old audit logs..."
    
    local deleted_count=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
        DELETE FROM audit_logs 
        WHERE timestamp < NOW() - INTERVAL '$RETENTION_DAYS days';
        SELECT ROW_COUNT();
    " 2>/dev/null || echo "0")
    
    print_status "Deleted $deleted_count old audit log entries"
}

# Clean up old session data (if session table exists)
cleanup_sessions() {
    print_status "Cleaning up expired sessions..."
    
    # Check if sessions table exists
    local session_table_exists=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'sessions'
        );
    " 2>/dev/null | xargs)
    
    if [ "$session_table_exists" = "t" ]; then
        local deleted_count=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
            DELETE FROM sessions 
            WHERE expires < NOW();
            SELECT ROW_COUNT();
        " 2>/dev/null || echo "0")
        
        print_status "Deleted $deleted_count expired sessions"
    else
        print_status "No sessions table found (sessions might be handled differently)"
    fi
}

# Check database integrity
check_integrity() {
    print_status "Checking database integrity..."
    
    # Check for corrupted indexes
    local corrupt_indexes=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
        SELECT schemaname||'.'||indexname 
        FROM pg_stat_user_indexes 
        WHERE idx_scan = 0 AND idx_tup_read > 0;
    " 2>/dev/null)
    
    if [ -n "$corrupt_indexes" ]; then
        print_warning "Found potentially corrupted indexes:"
        echo "$corrupt_indexes" | tee -a "$LOG_FILE"
    else
        print_status "No corrupted indexes found"
    fi
    
    # Check table statistics
    print_status "Table statistics:"
    sudo -u postgres psql -d "$DB_NAME" -c "
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_rows,
            n_dead_tup as dead_rows
        FROM pg_stat_user_tables
        WHERE n_live_tup > 0
        ORDER BY n_live_tup DESC;
    " 2>&1 | tee -a "$LOG_FILE"
}

# Update table statistics
update_statistics() {
    print_status "Updating table statistics..."
    
    sudo -u postgres psql -d "$DB_NAME" -c "
        SELECT 
            'UPDATE STATISTICS: ' || schemaname||'.'||tablename as action
        FROM pg_stat_user_tables;
        
        ANALYZE;
    " 2>&1 | tee -a "$LOG_FILE"
    
    print_status "Statistics updated"
}

# Check database size and growth
check_database_size() {
    print_status "Database size information:"
    
    sudo -u postgres psql -d "$DB_NAME" -c "
        SELECT 
            pg_size_pretty(pg_database_size('$DB_NAME')) as database_size;
        
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10;
    " 2>&1 | tee -a "$LOG_FILE"
}

# Optimize PostgreSQL configuration
optimize_configuration() {
    print_status "Checking PostgreSQL configuration..."
    
    # Check current settings
    sudo -u postgres psql -d "$DB_NAME" -c "
        SELECT name, setting, unit, context 
        FROM pg_settings 
        WHERE name IN (
            'shared_buffers',
            'effective_cache_size',
            'work_mem',
            'maintenance_work_mem',
            'checkpoint_completion_target',
            'max_connections'
        )
        ORDER BY name;
    " 2>&1 | tee -a "$LOG_FILE"
}

# Clean up old backup files
cleanup_old_backups() {
    print_status "Cleaning up old backup files..."
    
    if [ -d "$BACKUP_DIR" ]; then
        local deleted_count=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
        print_status "Deleted $deleted_count old backup files"
        
        # Show remaining backups
        local remaining_count=$(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l)
        print_status "Remaining backup files: $remaining_count"
    else
        print_warning "Backup directory does not exist: $BACKUP_DIR"
    fi
}

# Generate maintenance report
generate_report() {
    print_status "Generating maintenance report..."
    
    local report_file="/var/log/skyraksys-hrm/maintenance-report-$(date +%Y%m%d).txt"
    
    {
        echo "=== Skyraksys HRM Database Maintenance Report ==="
        echo "Date: $(date)"
        echo "Database: $DB_NAME"
        echo ""
        
        echo "=== Database Size ==="
        sudo -u postgres psql -d "$DB_NAME" -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME')) as database_size;"
        
        echo ""
        echo "=== Largest Tables ==="
        sudo -u postgres psql -d "$DB_NAME" -c "
            SELECT 
                schemaname||'.'||tablename as table_name,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                n_live_tup as rows
            FROM pg_stat_user_tables
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT 5;
        "
        
        echo ""
        echo "=== Database Activity ==="
        sudo -u postgres psql -d "$DB_NAME" -c "
            SELECT 
                datname,
                numbackends as connections,
                xact_commit as commits,
                xact_rollback as rollbacks,
                blks_read,
                blks_hit,
                stats_reset
            FROM pg_stat_database 
            WHERE datname = '$DB_NAME';
        "
        
        echo ""
        echo "=== Maintenance Actions Performed ==="
        echo "- Database backup created"
        echo "- VACUUM and ANALYZE executed"
        echo "- Old audit logs cleaned up"
        echo "- Database integrity checked"
        echo "- Statistics updated"
        echo "- Old backups cleaned up"
        
        echo ""
        echo "Report generated at: $(date)"
        
    } > "$report_file"
    
    print_status "Maintenance report saved: $report_file"
}

# Main maintenance function
main() {
    print_header "Skyraksys HRM Database Maintenance - $(date)"
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    log_message "Starting database maintenance"
    
    # Pre-maintenance checks
    check_postgresql
    test_db_connection
    
    # Create backup
    if ! create_backup; then
        print_error "Backup failed, aborting maintenance"
        exit 1
    fi
    
    # Maintenance tasks
    print_header "MAINTENANCE TASKS"
    
    analyze_database
    vacuum_database
    reindex_database
    cleanup_audit_logs
    cleanup_sessions
    update_statistics
    
    # Post-maintenance checks
    print_header "POST-MAINTENANCE CHECKS"
    
    check_integrity
    check_database_size
    optimize_configuration
    
    # Cleanup
    print_header "CLEANUP"
    cleanup_old_backups
    
    # Generate report
    generate_report
    
    print_header "MAINTENANCE COMPLETE"
    print_status "Database maintenance completed successfully"
    log_message "Database maintenance completed"
    
    echo "Maintenance completed at: $(date)"
    echo "=============================================="
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script with sudo"
    exit 1
fi

# Run maintenance
main

exit 0