#!/bin/bash

# Cron Job Setup Script for Skyraksys HRM
# Sets up automated maintenance tasks via cron

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAINTENANCE_DIR="/opt/skyraksys-hrm/maintenance"
CRON_USER="root"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if script exists and is executable
check_script() {
    local script_path="$1"
    local script_name="$2"
    
    if [ -f "$script_path" ]; then
        if [ -x "$script_path" ]; then
            print_status "$script_name script found and is executable"
            return 0
        else
            print_warning "$script_name script found but is not executable, fixing..."
            chmod +x "$script_path"
            return 0
        fi
    else
        print_error "$script_name script not found at $script_path"
        return 1
    fi
}

# Create log rotation configuration
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    local logrotate_config="/etc/logrotate.d/skyraksys-hrm"
    
    cat > "$logrotate_config" << 'EOF'
/var/log/skyraksys-hrm/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    create 644 root root
    postrotate
        # Send HUP signal to rsyslog if it's running
        /bin/kill -HUP `cat /var/run/rsyslogd.pid 2> /dev/null` 2> /dev/null || true
    endscript
}

/opt/skyraksys-hrm/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    create 644 hrm_app hrm_app
    postrotate
        # Restart HRM services to release log handles
        /bin/systemctl reload hrm-backend hrm-frontend 2> /dev/null || true
    endscript
}
EOF
    
    print_status "Log rotation configuration created"
}

# Setup cron jobs
setup_cron_jobs() {
    print_status "Setting up cron jobs..."
    
    # Create temporary cron file
    local temp_cron="/tmp/hrm_cron_setup"
    
    # Get existing cron jobs (excluding HRM ones)
    crontab -l 2>/dev/null | grep -v "# HRM:" | grep -v "skyraksys-hrm" > "$temp_cron" || true
    
    # Add HRM cron jobs
    cat >> "$temp_cron" << EOF

# HRM: Performance monitoring every 15 minutes
*/15 * * * * $MAINTENANCE_DIR/performance_monitor.sh >/dev/null 2>&1

# HRM: Health check every 5 minutes
*/5 * * * * $MAINTENANCE_DIR/health_check.sh >/dev/null 2>&1

# HRM: Database backup daily at 2:00 AM
0 2 * * * $MAINTENANCE_DIR/../scripts/backup_database.sh >/dev/null 2>&1

# HRM: Backup verification daily at 3:00 AM
0 3 * * * $MAINTENANCE_DIR/backup_verification.sh >/dev/null 2>&1

# HRM: Database maintenance weekly on Sunday at 1:00 AM
0 1 * * 0 $MAINTENANCE_DIR/database_maintenance.sh >/dev/null 2>&1

# HRM: System optimization monthly on 1st at 12:00 AM
0 0 1 * * $MAINTENANCE_DIR/system_optimization.sh >/dev/null 2>&1

# HRM: Log cleanup daily at 11:30 PM
30 23 * * * find /var/log/skyraksys-hrm -name "*.log" -size +100M -exec truncate -s 50M {} \; >/dev/null 2>&1

# HRM: Temp file cleanup daily at 11:45 PM
45 23 * * * find /tmp -name "*hrm*" -mtime +1 -delete >/dev/null 2>&1

# HRM: Application log rotation weekly
0 4 * * 1 /usr/sbin/logrotate -f /etc/logrotate.d/skyraksys-hrm >/dev/null 2>&1

EOF
    
    # Install the new cron jobs
    crontab "$temp_cron"
    
    # Remove temporary file
    rm -f "$temp_cron"
    
    print_status "Cron jobs installed successfully"
}

# Create backup database script
create_backup_script() {
    local backup_script="$MAINTENANCE_DIR/../scripts/backup_database.sh"
    
    if [ ! -f "$backup_script" ]; then
        print_status "Creating database backup script..."
        
        cat > "$backup_script" << 'EOF'
#!/bin/bash

# Database Backup Script for Skyraksys HRM
# Creates compressed database backups

set -e

# Configuration
DB_NAME="skyraksys_hrm_prod"
BACKUP_DIR="/opt/skyraksys-hrm/backups"
LOG_FILE="/var/log/skyraksys-hrm/backup.log"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Generate backup filename
BACKUP_FILE="$BACKUP_DIR/hrm_backup_$(date +%Y%m%d_%H%M%S).sql"

# Log start
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting database backup" >> "$LOG_FILE"

# Create backup
if sudo -u postgres pg_dump -d "$DB_NAME" --no-owner --no-privileges > "$BACKUP_FILE"; then
    # Compress backup
    gzip "$BACKUP_FILE"
    
    # Log success
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup created: $BACKUP_FILE.gz" >> "$LOG_FILE"
    
    # Clean up old backups
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Old backups cleaned up" >> "$LOG_FILE"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: Backup failed" >> "$LOG_FILE"
    exit 1
fi

# Log completion
echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup completed successfully" >> "$LOG_FILE"
EOF
        
        chmod +x "$backup_script"
        print_status "Database backup script created"
    else
        print_status "Database backup script already exists"
    fi
}

# Create system optimization script
create_optimization_script() {
    local optimization_script="$MAINTENANCE_DIR/system_optimization.sh"
    
    if [ ! -f "$optimization_script" ]; then
        print_status "Creating system optimization script..."
        
        cat > "$optimization_script" << 'EOF'
#!/bin/bash

# System Optimization Script for Skyraksys HRM
# Performs monthly system optimization tasks

set -e

LOG_FILE="/var/log/skyraksys-hrm/optimization.log"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

log_message "Starting system optimization"

# Clear system caches
echo 3 > /proc/sys/vm/drop_caches
log_message "System caches cleared"

# Update package cache
yum clean all >/dev/null 2>&1 || dnf clean all >/dev/null 2>&1
log_message "Package cache cleaned"

# Remove old kernels (keep last 2)
if command -v package-cleanup >/dev/null 2>&1; then
    package-cleanup --oldkernels --count=2 -y >/dev/null 2>&1
fi

# Clean temporary files
find /tmp -type f -mtime +7 -delete 2>/dev/null || true
find /var/tmp -type f -mtime +7 -delete 2>/dev/null || true
log_message "Temporary files cleaned"

# Optimize PostgreSQL
if systemctl is-active --quiet postgresql-15; then
    sudo -u postgres psql -d skyraksys_hrm_prod -c "VACUUM ANALYZE;" >/dev/null 2>&1
    log_message "Database optimized"
fi

# Update system file database
updatedb >/dev/null 2>&1 || true

log_message "System optimization completed"
EOF
        
        chmod +x "$optimization_script"
        print_status "System optimization script created"
    else
        print_status "System optimization script already exists"
    fi
}

# Setup rsyslog configuration for HRM
setup_rsyslog() {
    print_status "Setting up rsyslog configuration..."
    
    local rsyslog_config="/etc/rsyslog.d/49-skyraksys-hrm.conf"
    
    cat > "$rsyslog_config" << 'EOF'
# Skyraksys HRM logging configuration

# HRM application logs
:programname, isequal, "hrm-backend" /var/log/skyraksys-hrm/backend.log
:programname, isequal, "hrm-frontend" /var/log/skyraksys-hrm/frontend.log

# HRM maintenance scripts
:programname, isequal, "hrm-maintenance" /var/log/skyraksys-hrm/maintenance.log

# HRM alerts (local0 facility)
local0.* /var/log/skyraksys-hrm/alerts.log

# Stop processing these messages further
:programname, isequal, "hrm-backend" stop
:programname, isequal, "hrm-frontend" stop
:programname, isequal, "hrm-maintenance" stop
local0.* stop
EOF
    
    # Restart rsyslog
    systemctl restart rsyslog
    
    print_status "Rsyslog configuration updated"
}

# Create email notification setup
setup_email_notifications() {
    print_status "Setting up email notifications..."
    
    # Check if mail command is available
    if ! command -v mail >/dev/null 2>&1; then
        print_warning "Mail command not found, installing mailx..."
        
        if yum list installed mailx >/dev/null 2>&1; then
            print_status "mailx already installed"
        else
            yum install -y mailx >/dev/null 2>&1 || dnf install -y mailx >/dev/null 2>&1
        fi
    fi
    
    # Create mail configuration
    local mail_config="/etc/mail.rc"
    
    if [ ! -f "$mail_config" ]; then
        cat > "$mail_config" << 'EOF'
# Mail configuration for Skyraksys HRM
set smtp=localhost
set smtp-use-starttls=no
set from="hrm-system@$(hostname)"
EOF
        print_status "Mail configuration created"
    else
        print_status "Mail configuration already exists"
    fi
}

# Display cron job status
show_cron_status() {
    print_header "CURRENT CRON JOBS"
    
    print_status "Cron jobs for $CRON_USER:"
    crontab -l | grep -E "(HRM:|skyraksys-hrm)" || print_warning "No HRM cron jobs found"
    
    echo ""
    print_status "Cron service status:"
    if systemctl is-active --quiet crond; then
        print_status "Cron service is running"
    else
        print_error "Cron service is not running"
        print_status "Starting cron service..."
        systemctl start crond
        systemctl enable crond
    fi
}

# Main setup function
main() {
    print_header "Skyraksys HRM Cron Job Setup"
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run this script with sudo"
        exit 1
    fi
    
    # Create maintenance directory if it doesn't exist
    mkdir -p "$MAINTENANCE_DIR"
    mkdir -p "$MAINTENANCE_DIR/../scripts"
    
    # Check required scripts
    local scripts_ok=true
    
    if ! check_script "$MAINTENANCE_DIR/health_check.sh" "Health Check"; then
        scripts_ok=false
    fi
    
    if ! check_script "$MAINTENANCE_DIR/performance_monitor.sh" "Performance Monitor"; then
        scripts_ok=false
    fi
    
    if ! check_script "$MAINTENANCE_DIR/backup_verification.sh" "Backup Verification"; then
        scripts_ok=false
    fi
    
    if ! check_script "$MAINTENANCE_DIR/database_maintenance.sh" "Database Maintenance"; then
        scripts_ok=false
    fi
    
    if [ "$scripts_ok" = false ]; then
        print_error "Some required scripts are missing. Please ensure all maintenance scripts are present."
        exit 1
    fi
    
    # Create additional scripts
    create_backup_script
    create_optimization_script
    
    # Setup system configurations
    setup_log_rotation
    setup_rsyslog
    setup_email_notifications
    
    # Setup cron jobs
    setup_cron_jobs
    
    # Show status
    show_cron_status
    
    print_header "SETUP COMPLETE"
    
    print_status "Automated maintenance has been configured successfully!"
    print_status "The following tasks will run automatically:"
    echo ""
    echo "  • Health checks every 5 minutes"
    echo "  • Performance monitoring every 15 minutes"
    echo "  • Database backups daily at 2:00 AM"
    echo "  • Backup verification daily at 3:00 AM"
    echo "  • Database maintenance weekly on Sundays at 1:00 AM"
    echo "  • System optimization monthly on the 1st at midnight"
    echo "  • Log cleanup and rotation daily"
    echo ""
    print_status "Logs will be available in: /var/log/skyraksys-hrm/"
    print_status "Backups will be stored in: /opt/skyraksys-hrm/backups/"
    print_status "Email alerts will be sent to: admin@skyraksys.com"
    echo ""
    print_warning "Remember to configure email settings if you want email notifications"
    print_warning "Update the ALERT_EMAIL variable in the monitoring scripts if needed"
}

# Run setup
main

exit 0
EOF

chmod +x "$optimization_script"