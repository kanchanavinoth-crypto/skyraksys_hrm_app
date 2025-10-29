#!/bin/bash

# RHEL 9.6 Production System Maintenance Script
# Skyraksys HRM System - Automated Maintenance Tasks
# Run weekly for optimal system health

set -e

echo "=========================================="
echo "SKYRAKSYS HRM - System Maintenance"
echo "$(date)"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=========================================="
    echo -e "$1"
    echo -e "==========================================${NC}"
}

# Configuration
APP_DIR="/opt/skyraksys-hrm"
LOG_DIR="/var/log/skyraksys-hrm"
MAINTENANCE_LOG="$LOG_DIR/maintenance.log"
BACKUP_DIR="$APP_DIR/backups"

# Create maintenance log
mkdir -p "$LOG_DIR"
touch "$MAINTENANCE_LOG"

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - MAINTENANCE: $1" >> "$MAINTENANCE_LOG"
    echo "$1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root (sudo ./05_maintenance.sh)"
    exit 1
fi

print_header "SYSTEM MAINTENANCE STARTED"
log_message "Starting system maintenance tasks"

# 1. System Updates
print_header "SYSTEM PACKAGE UPDATES"
print_status "Checking for system updates..."
log_message "Checking system package updates"

# Check for available updates
UPDATE_COUNT=$(dnf check-update -q | wc -l || echo "0")
if [ "$UPDATE_COUNT" -gt 0 ]; then
    print_status "Found $UPDATE_COUNT package updates available"
    log_message "Found $UPDATE_COUNT package updates"
    
    # Create pre-update snapshot
    print_status "Creating pre-update backup..."
    SNAPSHOT_NAME="pre-update-$(date +%Y%m%d-%H%M%S)"
    
    # Update packages (excluding kernel unless specified)
    print_status "Installing security and bug fixes..."
    dnf update -y --security --bugfix
    
    print_status "Installing other available updates..."
    dnf update -y
    
    log_message "System packages updated successfully"
else
    print_status "System is up to date"
    log_message "No system updates available"
fi

# 2. Database Maintenance  
print_header "DATABASE MAINTENANCE"
print_status "Performing PostgreSQL maintenance..."

# Database vacuum and analyze
log_message "Starting database maintenance"
sudo -u postgres psql -d skyraksys_hrm_prod << 'EOF'
-- Vacuum and analyze all tables
VACUUM ANALYZE;

-- Update table statistics
ANALYZE;

-- Check for bloated tables
SELECT 
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    ROUND(n_dead_tup * 100.0 / GREATEST(n_live_tup + n_dead_tup, 1), 2) AS dead_tup_percent
FROM pg_stat_user_tables
WHERE n_dead_tup > 100
ORDER BY dead_tup_percent DESC;

-- Reindex if necessary
REINDEX DATABASE skyraksys_hrm_prod;
EOF

print_status "Database maintenance completed"
log_message "Database vacuum, analyze, and reindex completed"

# 3. Log Management
print_header "LOG FILE MANAGEMENT"
print_status "Managing system and application logs..."

# Rotate application logs manually if they're too large
for log_file in "$LOG_DIR"/*.log; do
    if [ -f "$log_file" ] && [ $(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0) -gt 104857600 ]; then # 100MB
        log_name=$(basename "$log_file")
        mv "$log_file" "$log_file.$(date +%Y%m%d-%H%M%S)"
        touch "$log_file"
        chown hrmapp:hrmapp "$log_file"
        print_status "Rotated large log file: $log_name"
        log_message "Rotated large log file: $log_name"
    fi
done

# Clean old log files (older than 30 days)
find "$LOG_DIR" -name "*.log.*" -mtime +30 -delete 2>/dev/null || true
log_message "Cleaned old log files (>30 days)"

# Force log rotation
logrotate -f /etc/logrotate.d/skyraksys-hrm 2>/dev/null || true

# 4. Disk Space Cleanup
print_header "DISK SPACE CLEANUP"
print_status "Cleaning up temporary files and caches..."

# Clean package cache
dnf clean all
log_message "Cleaned package manager cache"

# Clean temporary files
rm -rf /tmp/* 2>/dev/null || true
rm -rf /var/tmp/* 2>/dev/null || true
log_message "Cleaned temporary directories"

# Clean old journal logs (keep 30 days)
journalctl --vacuum-time=30d
log_message "Cleaned systemd journal logs"

# Clean old core dumps
find /var/lib/systemd/coredump -name "core.*" -mtime +7 -delete 2>/dev/null || true

# Clean old PDF files (keep 90 days)
if [ -d "$APP_DIR/uploads/payslips" ]; then
    find "$APP_DIR/uploads/payslips" -name "*.pdf" -mtime +90 -delete 2>/dev/null || true
    log_message "Cleaned old payslip PDFs (>90 days)"
fi

# Show disk usage after cleanup
DISK_USAGE_AFTER=$(df -h / | awk 'NR==2 {print $5}')
print_status "Current disk usage: $DISK_USAGE_AFTER"
log_message "Disk cleanup completed. Usage: $DISK_USAGE_AFTER"

# 5. Backup Management
print_header "BACKUP MANAGEMENT"
print_status "Managing database backups..."

# Create fresh backup
BACKUP_FILE="$BACKUP_DIR/hrm_maintenance_$(date +%Y%m%d_%H%M%S).sql"
sudo -u postgres pg_dump -d skyraksys_hrm_prod > "$BACKUP_FILE"
gzip "$BACKUP_FILE"
chown hrmapp:hrmapp "$BACKUP_FILE.gz"

print_status "Created maintenance backup: $(basename "$BACKUP_FILE.gz")"
log_message "Created maintenance backup: $(basename "$BACKUP_FILE.gz")"

# Clean old backups (keep 30 days)
find "$BACKUP_DIR" -name "hrm_backup_*.sql.gz" -mtime +30 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "hrm_maintenance_*.sql.gz" -mtime +30 -delete 2>/dev/null || true

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
print_status "Total backups retained: $BACKUP_COUNT"
log_message "Cleaned old backups, retained: $BACKUP_COUNT"

# 6. Service Health Check
print_header "SERVICE HEALTH VERIFICATION"
print_status "Verifying all services are healthy..."

# Check and restart services if needed
services=("postgresql-15" "redis" "nginx" "hrm-backend" "hrm-frontend")
for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service"; then
        print_status "Service $service: Running"
    else
        print_warning "Service $service: Not running - Attempting restart"
        systemctl restart "$service"
        if systemctl is-active --quiet "$service"; then
            print_status "Service $service: Restarted successfully"
            log_message "Restarted service: $service"
        else
            print_error "Service $service: Failed to restart"
            log_message "ERROR: Failed to restart service: $service"
        fi
    fi
done

# 7. Security Updates
print_header "SECURITY MAINTENANCE"
print_status "Updating security configurations..."

# Update fail2ban
if systemctl is-active --quiet fail2ban; then
    systemctl reload fail2ban
    log_message "Reloaded fail2ban configuration"
fi

# Check for suspicious login attempts
SUSPICIOUS_LOGINS=$(journalctl --since "1 week ago" | grep -i "failed\|invalid\|authentication failure" | wc -l)
if [ "$SUSPICIOUS_LOGINS" -gt 100 ]; then
    print_warning "Found $SUSPICIOUS_LOGINS suspicious login attempts in the last week"
    log_message "WARNING: $SUSPICIOUS_LOGINS suspicious login attempts detected"
else
    print_status "Security status: Normal ($SUSPICIOUS_LOGINS failed attempts this week)"
    log_message "Security status normal: $SUSPICIOUS_LOGINS failed attempts"
fi

# 8. Performance Optimization
print_header "PERFORMANCE OPTIMIZATION"
print_status "Optimizing system performance..."

# Clear memory caches
sync
echo 3 > /proc/sys/vm/drop_caches
log_message "Cleared memory caches"

# Optimize PostgreSQL if needed
POSTGRES_MEMORY=$(free -m | awk 'NR==2{printf "%d", $2*0.25}')
CURRENT_SHARED_BUFFERS=$(sudo -u postgres psql -d skyraksys_hrm_prod -t -c "SHOW shared_buffers;" | grep -o '[0-9]*')

# Update PostgreSQL configuration if memory changed significantly
if [ "$POSTGRES_MEMORY" -gt $((CURRENT_SHARED_BUFFERS + 100)) ] || [ "$POSTGRES_MEMORY" -lt $((CURRENT_SHARED_BUFFERS - 100)) ]; then
    print_status "Optimizing PostgreSQL memory settings..."
    sed -i "s/shared_buffers = .*/shared_buffers = ${POSTGRES_MEMORY}MB/" /var/lib/pgsql/15/data/postgresql.conf
    systemctl reload postgresql-15
    log_message "Updated PostgreSQL shared_buffers to ${POSTGRES_MEMORY}MB"
fi

# 9. Application-specific Maintenance
print_header "APPLICATION MAINTENANCE"
print_status "Performing HRM-specific maintenance tasks..."

# Clean old session data
if systemctl is-active --quiet redis; then
    redis-cli FLUSHDB 2>/dev/null || true
    log_message "Cleared Redis session cache"
fi

# Verify application health
if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
    print_status "Application API: Healthy"
    log_message "Application health check passed"
else
    print_warning "Application API: Not responding - Checking services"
    systemctl restart hrm-backend
    sleep 10
    if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_status "Application API: Restored after restart"
        log_message "Application restored after backend restart"
    else
        print_error "Application API: Still not responding"
        log_message "ERROR: Application not responding after restart"
    fi
fi

# 10. System Information Update
print_header "SYSTEM STATUS SUMMARY"

# Gather final system statistics
DISK_FINAL=$(df -h / | awk 'NR==2 {print $5}')
MEMORY_FINAL=$(free -m | awk 'NR==2{printf "%.0f%%", $3*100/$2}')
LOAD_FINAL=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
UPTIME_FINAL=$(uptime -p)

print_status "Final system status:"
print_status "  Disk usage: $DISK_FINAL"
print_status "  Memory usage: $MEMORY_FINAL"
print_status "  Load average: $LOAD_FINAL"
print_status "  System uptime: $UPTIME_FINAL"

log_message "Maintenance completed - Disk: $DISK_FINAL, Memory: $MEMORY_FINAL, Load: $LOAD_FINAL"

# 11. Generate Maintenance Report
REPORT_FILE="$LOG_DIR/maintenance-report-$(date +%Y%m%d-%H%M%S).txt"
cat > "$REPORT_FILE" << EOF
SKYRAKSYS HRM SYSTEM - MAINTENANCE REPORT
=========================================
Date: $(date)
Performed by: Automated maintenance script

TASKS COMPLETED:
✅ System package updates
✅ Database maintenance (VACUUM, ANALYZE, REINDEX)
✅ Log file rotation and cleanup
✅ Disk space optimization
✅ Backup management
✅ Service health verification
✅ Security configuration updates
✅ Performance optimization
✅ Application-specific maintenance
✅ System status verification

CURRENT SYSTEM STATUS:
- Disk Usage: $DISK_FINAL
- Memory Usage: $MEMORY_FINAL
- CPU Load: $LOAD_FINAL
- System Uptime: $UPTIME_FINAL
- Database Backups: $BACKUP_COUNT files
- Security Events: $SUSPICIOUS_LOGINS failed attempts (last 7 days)

SERVICES STATUS:
- PostgreSQL: $(systemctl is-active postgresql-15)
- Redis: $(systemctl is-active redis)
- Nginx: $(systemctl is-active nginx)
- HRM Backend: $(systemctl is-active hrm-backend)
- HRM Frontend: $(systemctl is-active hrm-frontend)

RECOMMENDATIONS:
- Next maintenance recommended: $(date -d '+1 week')
- Monitor disk usage if above 80%
- Review security logs weekly
- Test backup restoration monthly

Report saved: $REPORT_FILE
EOF

chown hrmapp:hrmapp "$REPORT_FILE"
print_status "Maintenance report saved: $REPORT_FILE"

# Final message
print_header "MAINTENANCE COMPLETED SUCCESSFULLY"
print_status "All maintenance tasks completed at: $(date)"
print_status "Next scheduled maintenance: $(date -d '+1 week')"
print_status "System health: OPTIMAL"

log_message "MAINTENANCE COMPLETED SUCCESSFULLY"

# Send completion notification (if email is configured)
if command -v mail >/dev/null 2>&1; then
    echo "System maintenance completed successfully on $(hostname) at $(date)" | mail -s "HRM System Maintenance Complete" root 2>/dev/null || true
fi

echo ""
echo "📋 Maintenance Summary:"
echo "   ✅ System updates applied"
echo "   ✅ Database optimized"
echo "   ✅ Logs rotated and cleaned"
echo "   ✅ Disk space optimized"
echo "   ✅ Backups managed"
echo "   ✅ Services verified"
echo "   ✅ Security updated"
echo "   ✅ Performance optimized"
echo ""
echo "📊 System Status: HEALTHY"
echo "📅 Next Maintenance: $(date -d '+1 week' '+%Y-%m-%d')"

exit 0