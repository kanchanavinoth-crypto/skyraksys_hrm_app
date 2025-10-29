#!/bin/bash

# System Health Check Script for Skyraksys HRM
# Monitors system resources, services, and application health
# Run manually or via cron job

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/skyraksys-hrm/health-check.log"
ALERT_EMAIL="admin@yourcompany.com"  # Configure your email
APP_DIR="/opt/skyraksys-hrm"
THRESHOLD_CPU=80
THRESHOLD_MEMORY=80
THRESHOLD_DISK=85

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
    echo -e "${GREEN}[OK]${NC} $1" | tee -a "$LOG_FILE"
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

send_alert() {
    local subject="$1"
    local message="$2"
    
    # Send email alert (requires mail command to be configured)
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
    fi
    
    # Log alert
    log_message "ALERT: $subject - $message"
}

check_service() {
    local service_name="$1"
    
    if systemctl is-active --quiet "$service_name"; then
        print_status "$service_name is running"
        return 0
    else
        print_error "$service_name is not running"
        send_alert "Service Down: $service_name" "Service $service_name is not running on $(hostname)"
        return 1
    fi
}

check_port() {
    local port="$1"
    local service_name="$2"
    
    if netstat -tuln | grep -q ":$port "; then
        print_status "$service_name (port $port) is listening"
        return 0
    else
        print_error "$service_name (port $port) is not listening"
        send_alert "Port Not Listening: $service_name" "Port $port for $service_name is not listening on $(hostname)"
        return 1
    fi
}

check_disk_usage() {
    local path="$1"
    local threshold="$2"
    
    local usage=$(df "$path" | awk 'NR==2 {gsub(/%/, "", $5); print $5}')
    
    if [ "$usage" -gt "$threshold" ]; then
        print_error "Disk usage for $path is ${usage}% (threshold: ${threshold}%)"
        send_alert "High Disk Usage: $path" "Disk usage for $path is ${usage}% on $(hostname)"
        return 1
    else
        print_status "Disk usage for $path is ${usage}%"
        return 0
    fi
}

check_memory_usage() {
    local threshold="$1"
    
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$memory_usage" -gt "$threshold" ]; then
        print_error "Memory usage is ${memory_usage}% (threshold: ${threshold}%)"
        send_alert "High Memory Usage" "Memory usage is ${memory_usage}% on $(hostname)"
        return 1
    else
        print_status "Memory usage is ${memory_usage}%"
        return 0
    fi
}

check_cpu_usage() {
    local threshold="$1"
    
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    
    if (( $(echo "$cpu_usage > $threshold" | bc -l) )); then
        print_error "CPU usage is ${cpu_usage}% (threshold: ${threshold}%)"
        send_alert "High CPU Usage" "CPU usage is ${cpu_usage}% on $(hostname)"
        return 1
    else
        print_status "CPU usage is ${cpu_usage}%"
        return 0
    fi
}

check_database_connection() {
    if sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT 1;" > /dev/null 2>&1; then
        print_status "Database connection is healthy"
        return 0
    else
        print_error "Database connection failed"
        send_alert "Database Connection Failed" "Cannot connect to PostgreSQL database on $(hostname)"
        return 1
    fi
}

check_application_endpoints() {
    local backend_url="http://localhost:5000"
    local frontend_url="http://localhost:3000"
    local proxy_url="http://localhost"
    
    # Check backend health endpoint (if exists)
    if curl -s -f "$backend_url/api/health" > /dev/null 2>&1; then
        print_status "Backend API is responding"
    else
        # Try basic connection
        if curl -s -f "$backend_url" > /dev/null 2>&1; then
            print_status "Backend is responding (no health endpoint)"
        else
            print_error "Backend API is not responding"
            send_alert "Backend API Down" "Backend API is not responding on $(hostname)"
        fi
    fi
    
    # Check frontend
    if curl -s -f "$frontend_url" > /dev/null 2>&1; then
        print_status "Frontend is responding"
    else
        print_error "Frontend is not responding"
        send_alert "Frontend Down" "Frontend is not responding on $(hostname)"
    fi
    
    # Check nginx proxy
    if curl -s -f "$proxy_url/health" > /dev/null 2>&1; then
        print_status "Nginx proxy is responding"
    else
        print_warning "Nginx proxy health check failed (this might be normal)"
    fi
}

check_log_files() {
    local log_files=(
        "/var/log/skyraksys-hrm/backend.log"
        "/var/log/skyraksys-hrm/frontend.log"
        "/var/log/skyraksys-hrm/backend-error.log"
        "/var/log/skyraksys-hrm/frontend-error.log"
    )
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            # Check for recent errors (last 10 minutes)
            local recent_errors=$(find "$log_file" -newermt '10 minutes ago' -exec grep -i -E "(error|exception|fail)" {} \; 2>/dev/null | wc -l)
            
            if [ "$recent_errors" -gt 5 ]; then
                print_warning "Found $recent_errors recent errors in $log_file"
            else
                print_status "Log file $log_file is healthy"
            fi
            
            # Check log file size (alert if > 100MB)
            local file_size=$(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0)
            local size_mb=$((file_size / 1024 / 1024))
            
            if [ "$size_mb" -gt 100 ]; then
                print_warning "Log file $log_file is large (${size_mb}MB)"
            fi
        else
            print_warning "Log file $log_file does not exist"
        fi
    done
}

check_backup_status() {
    local backup_dir="/opt/skyraksys-hrm/backups"
    
    if [ -d "$backup_dir" ]; then
        # Check if there's a recent backup (within last 2 days)
        local recent_backup=$(find "$backup_dir" -name "hrm_backup_*.sql.gz" -mtime -2 | head -1)
        
        if [ -n "$recent_backup" ]; then
            print_status "Recent database backup found: $(basename "$recent_backup")"
        else
            print_warning "No recent database backup found (older than 2 days)"
            send_alert "Backup Warning" "No recent database backup found on $(hostname)"
        fi
        
        # Check backup directory size
        local backup_size=$(du -sh "$backup_dir" | awk '{print $1}')
        print_status "Backup directory size: $backup_size"
    else
        print_error "Backup directory does not exist"
    fi
}

# Main health check function
main() {
    print_header "Skyraksys HRM Health Check - $(date)"
    
    local overall_status=0
    
    # System Resource Checks
    print_header "SYSTEM RESOURCES"
    check_cpu_usage "$THRESHOLD_CPU" || overall_status=1
    check_memory_usage "$THRESHOLD_MEMORY" || overall_status=1
    check_disk_usage "/" "$THRESHOLD_DISK" || overall_status=1
    check_disk_usage "/opt/skyraksys-hrm" "$THRESHOLD_DISK" || overall_status=1
    check_disk_usage "/var/log/skyraksys-hrm" "$THRESHOLD_DISK" || overall_status=1
    
    echo ""
    
    # Service Checks
    print_header "SERVICE STATUS"
    check_service "hrm-backend" || overall_status=1
    check_service "hrm-frontend" || overall_status=1
    check_service "nginx" || overall_status=1
    check_service "postgresql-15" || overall_status=1
    check_service "redis" || overall_status=1
    
    echo ""
    
    # Port Checks
    print_header "PORT STATUS"
    check_port "80" "Nginx HTTP" || overall_status=1
    check_port "5000" "Backend API" || overall_status=1
    check_port "3000" "Frontend" || overall_status=1
    check_port "5432" "PostgreSQL" || overall_status=1
    check_port "6379" "Redis" || overall_status=1
    
    echo ""
    
    # Database Check
    print_header "DATABASE STATUS"
    check_database_connection || overall_status=1
    
    echo ""
    
    # Application Endpoint Checks
    print_header "APPLICATION ENDPOINTS"
    check_application_endpoints || overall_status=1
    
    echo ""
    
    # Log File Checks
    print_header "LOG FILE STATUS"
    check_log_files || overall_status=1
    
    echo ""
    
    # Backup Status
    print_header "BACKUP STATUS"
    check_backup_status || overall_status=1
    
    echo ""
    
    # Summary
    print_header "HEALTH CHECK SUMMARY"
    if [ "$overall_status" -eq 0 ]; then
        print_status "Overall system health: HEALTHY"
        log_message "Health check completed successfully"
    else
        print_error "Overall system health: ISSUES DETECTED"
        log_message "Health check completed with issues"
        send_alert "System Health Issues" "Health check detected issues on $(hostname). Check logs for details."
    fi
    
    # System Information
    echo ""
    print_header "SYSTEM INFORMATION"
    echo "Hostname: $(hostname)"
    echo "Uptime: $(uptime -p)"
    echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
    echo "Current Users: $(who | wc -l)"
    echo "Running Processes: $(ps aux | wc -l)"
    
    echo ""
    echo "Health check completed at: $(date)"
    echo "=============================================="
    
    return $overall_status
}

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Run health check
main

# Exit with appropriate code
exit $?