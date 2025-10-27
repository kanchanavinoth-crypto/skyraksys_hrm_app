#!/bin/bash

# System Performance Monitoring Script for Skyraksys HRM
# Monitors system performance, generates alerts, and optimization recommendations
# Should be run every 15 minutes via cron

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/skyraksys-hrm/performance-monitor.log"
ALERT_LOG="/var/log/skyraksys-hrm/performance-alerts.log"
DB_NAME="skyraksys_hrm_prod"
ALERT_EMAIL="admin@skyraksys.com"

# Thresholds
CPU_THRESHOLD=80          # CPU usage percentage
MEMORY_THRESHOLD=85       # Memory usage percentage
DISK_THRESHOLD=85         # Disk usage percentage
LOAD_THRESHOLD=4.0        # Load average threshold
DB_CONNECTIONS_THRESHOLD=80  # Database connections percentage
RESPONSE_TIME_THRESHOLD=2000  # Response time in milliseconds

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

log_alert() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ALERT: $1" | tee -a "$ALERT_LOG"
}

print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[CRITICAL]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Send alert
send_alert() {
    local subject="$1"
    local message="$2"
    local severity="$3"
    
    log_alert "$subject - $message"
    
    # Send email if available
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "[HRM-$severity] $subject" "$ALERT_EMAIL" 2>/dev/null || true
    fi
    
    # Log to system log
    case "$severity" in
        "CRITICAL")
            logger -p local0.crit "HRM Performance Alert: $subject - $message"
            ;;
        "WARNING")
            logger -p local0.warning "HRM Performance Alert: $subject - $message"
            ;;
        *)
            logger -p local0.info "HRM Performance Alert: $subject - $message"
            ;;
    esac
}

# Get CPU usage
get_cpu_usage() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    echo "$cpu_usage"
}

# Get memory usage
get_memory_usage() {
    local memory_info=$(free | grep Mem)
    local total=$(echo "$memory_info" | awk '{print $2}')
    local used=$(echo "$memory_info" | awk '{print $3}')
    local usage_percent=$((used * 100 / total))
    echo "$usage_percent"
}

# Get disk usage
get_disk_usage() {
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    echo "$disk_usage"
}

# Get load average
get_load_average() {
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | xargs)
    echo "$load_avg"
}

# Check system resources
check_system_resources() {
    print_info "Checking system resources..."
    
    # CPU Usage
    local cpu_usage=$(get_cpu_usage)
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        print_error "High CPU usage: ${cpu_usage}%"
        send_alert "High CPU Usage" "CPU usage is ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)" "CRITICAL"
    elif (( $(echo "$cpu_usage > $((CPU_THRESHOLD - 10))" | bc -l) )); then
        print_warning "Elevated CPU usage: ${cpu_usage}%"
        send_alert "Elevated CPU Usage" "CPU usage is ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)" "WARNING"
    else
        print_status "CPU usage: ${cpu_usage}%"
    fi
    
    # Memory Usage
    local memory_usage=$(get_memory_usage)
    if [ "$memory_usage" -gt "$MEMORY_THRESHOLD" ]; then
        print_error "High memory usage: ${memory_usage}%"
        send_alert "High Memory Usage" "Memory usage is ${memory_usage}% (threshold: ${MEMORY_THRESHOLD}%)" "CRITICAL"
    elif [ "$memory_usage" -gt $((MEMORY_THRESHOLD - 10)) ]; then
        print_warning "Elevated memory usage: ${memory_usage}%"
        send_alert "Elevated Memory Usage" "Memory usage is ${memory_usage}% (threshold: ${MEMORY_THRESHOLD}%)" "WARNING"
    else
        print_status "Memory usage: ${memory_usage}%"
    fi
    
    # Disk Usage
    local disk_usage=$(get_disk_usage)
    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        print_error "High disk usage: ${disk_usage}%"
        send_alert "High Disk Usage" "Disk usage is ${disk_usage}% (threshold: ${DISK_THRESHOLD}%)" "CRITICAL"
    elif [ "$disk_usage" -gt $((DISK_THRESHOLD - 10)) ]; then
        print_warning "Elevated disk usage: ${disk_usage}%"
        send_alert "Elevated Disk Usage" "Disk usage is ${disk_usage}% (threshold: ${DISK_THRESHOLD}%)" "WARNING"
    else
        print_status "Disk usage: ${disk_usage}%"
    fi
    
    # Load Average
    local load_avg=$(get_load_average)
    if (( $(echo "$load_avg > $LOAD_THRESHOLD" | bc -l) )); then
        print_error "High load average: $load_avg"
        send_alert "High Load Average" "Load average is $load_avg (threshold: $LOAD_THRESHOLD)" "CRITICAL"
    elif (( $(echo "$load_avg > $((LOAD_THRESHOLD - 1))" | bc -l) )); then
        print_warning "Elevated load average: $load_avg"
        send_alert "Elevated Load Average" "Load average is $load_avg (threshold: $LOAD_THRESHOLD)" "WARNING"
    else
        print_status "Load average: $load_avg"
    fi
    
    log_message "System resources - CPU: ${cpu_usage}%, Memory: ${memory_usage}%, Disk: ${disk_usage}%, Load: $load_avg"
}

# Check service status
check_services() {
    print_info "Checking HRM services..."
    
    local services=("hrm-backend" "hrm-frontend" "postgresql-15" "nginx")
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service"; then
            print_status "$service is running"
            
            # Check if service is enabled
            if ! systemctl is-enabled --quiet "$service"; then
                print_warning "$service is not enabled for auto-start"
                send_alert "Service Not Enabled" "$service is running but not enabled for auto-start" "WARNING"
            fi
        else
            print_error "$service is not running"
            send_alert "Service Down" "$service is not running" "CRITICAL"
            
            # Try to restart the service
            print_info "Attempting to restart $service..."
            if systemctl restart "$service" 2>/dev/null; then
                print_status "$service restarted successfully"
                send_alert "Service Restarted" "$service was automatically restarted" "INFO"
            else
                print_error "Failed to restart $service"
                send_alert "Service Restart Failed" "Failed to restart $service" "CRITICAL"
            fi
        fi
    done
}

# Check database performance
check_database_performance() {
    print_info "Checking database performance..."
    
    # Check if PostgreSQL is running
    if ! systemctl is-active --quiet postgresql-15; then
        print_error "PostgreSQL is not running"
        return 1
    fi
    
    # Check database connections
    local max_connections=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SHOW max_connections;" 2>/dev/null | xargs || echo "100")
    local current_connections=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME';" 2>/dev/null | xargs || echo "0")
    local connection_percent=$((current_connections * 100 / max_connections))
    
    if [ "$connection_percent" -gt "$DB_CONNECTIONS_THRESHOLD" ]; then
        print_error "High database connections: ${current_connections}/${max_connections} (${connection_percent}%)"
        send_alert "High Database Connections" "Database connections: ${current_connections}/${max_connections} (${connection_percent}%)" "CRITICAL"
    elif [ "$connection_percent" -gt $((DB_CONNECTIONS_THRESHOLD - 20)) ]; then
        print_warning "Elevated database connections: ${current_connections}/${max_connections} (${connection_percent}%)"
    else
        print_status "Database connections: ${current_connections}/${max_connections} (${connection_percent}%)"
    fi
    
    # Check for long-running queries
    local long_queries=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
        SELECT count(*) 
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND now() - query_start > interval '5 minutes'
        AND datname = '$DB_NAME';
    " 2>/dev/null | xargs || echo "0")
    
    if [ "$long_queries" -gt 0 ]; then
        print_warning "Found $long_queries long-running queries"
        send_alert "Long-Running Queries" "Found $long_queries queries running for more than 5 minutes" "WARNING"
        
        # Log the queries
        sudo -u postgres psql -d "$DB_NAME" -c "
            SELECT 
                pid,
                now() - query_start as duration,
                state,
                left(query, 50) as query_snippet
            FROM pg_stat_activity 
            WHERE state = 'active' 
            AND now() - query_start > interval '5 minutes'
            AND datname = '$DB_NAME';
        " 2>/dev/null | tee -a "$LOG_FILE"
    else
        print_status "No long-running queries found"
    fi
    
    # Check database size growth
    local db_size=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | xargs || echo "Unknown")
    print_status "Database size: $db_size"
    
    # Check for table bloat
    local bloated_tables=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
        SELECT count(*) 
        FROM pg_stat_user_tables 
        WHERE n_dead_tup > 1000 
        AND n_dead_tup > n_live_tup * 0.1;
    " 2>/dev/null | xargs || echo "0")
    
    if [ "$bloated_tables" -gt 0 ]; then
        print_warning "Found $bloated_tables tables with significant bloat"
        send_alert "Database Bloat" "Found $bloated_tables tables that need vacuuming" "WARNING"
    else
        print_status "No significant table bloat detected"
    fi
    
    log_message "Database performance - Connections: ${current_connections}/${max_connections}, Size: $db_size, Long queries: $long_queries, Bloated tables: $bloated_tables"
}

# Check application response time
check_application_response() {
    print_info "Checking application response time..."
    
    local backend_url="http://localhost:3001/api/health"
    local frontend_url="http://localhost:3000"
    
    # Check backend response time
    if command -v curl >/dev/null 2>&1; then
        local backend_response_time=$(curl -o /dev/null -s -w '%{time_total}' --max-time 10 "$backend_url" 2>/dev/null || echo "timeout")
        
        if [ "$backend_response_time" = "timeout" ]; then
            print_error "Backend is not responding"
            send_alert "Backend Unresponsive" "Backend API is not responding at $backend_url" "CRITICAL"
        else
            local backend_ms=$(echo "$backend_response_time * 1000" | bc -l | cut -d. -f1)
            
            if [ "$backend_ms" -gt "$RESPONSE_TIME_THRESHOLD" ]; then
                print_error "Backend response time is slow: ${backend_ms}ms"
                send_alert "Slow Backend Response" "Backend response time is ${backend_ms}ms (threshold: ${RESPONSE_TIME_THRESHOLD}ms)" "CRITICAL"
            elif [ "$backend_ms" -gt $((RESPONSE_TIME_THRESHOLD / 2)) ]; then
                print_warning "Backend response time is elevated: ${backend_ms}ms"
            else
                print_status "Backend response time: ${backend_ms}ms"
            fi
        fi
        
        # Check frontend response time
        local frontend_response_time=$(curl -o /dev/null -s -w '%{time_total}' --max-time 10 "$frontend_url" 2>/dev/null || echo "timeout")
        
        if [ "$frontend_response_time" = "timeout" ]; then
            print_error "Frontend is not responding"
            send_alert "Frontend Unresponsive" "Frontend is not responding at $frontend_url" "CRITICAL"
        else
            local frontend_ms=$(echo "$frontend_response_time * 1000" | bc -l | cut -d. -f1)
            
            if [ "$frontend_ms" -gt "$RESPONSE_TIME_THRESHOLD" ]; then
                print_error "Frontend response time is slow: ${frontend_ms}ms"
                send_alert "Slow Frontend Response" "Frontend response time is ${frontend_ms}ms (threshold: ${RESPONSE_TIME_THRESHOLD}ms)" "CRITICAL"
            elif [ "$frontend_ms" -gt $((RESPONSE_TIME_THRESHOLD / 2)) ]; then
                print_warning "Frontend response time is elevated: ${frontend_ms}ms"
            else
                print_status "Frontend response time: ${frontend_ms}ms"
            fi
        fi
        
        log_message "Application response - Backend: ${backend_ms}ms, Frontend: ${frontend_ms}ms"
    else
        print_warning "curl not available, skipping response time check"
    fi
}

# Check disk space for logs and backups
check_storage_space() {
    print_info "Checking storage space..."
    
    local log_dir="/var/log/skyraksys-hrm"
    local backup_dir="/opt/skyraksys-hrm/backups"
    
    # Check log directory size
    if [ -d "$log_dir" ]; then
        local log_size=$(du -sm "$log_dir" 2>/dev/null | cut -f1)
        if [ "$log_size" -gt 1000 ]; then  # 1GB
            print_warning "Log directory is large: ${log_size}MB"
            send_alert "Large Log Directory" "Log directory size is ${log_size}MB, consider log rotation" "WARNING"
        else
            print_status "Log directory size: ${log_size}MB"
        fi
    fi
    
    # Check backup directory size
    if [ -d "$backup_dir" ]; then
        local backup_size=$(du -sm "$backup_dir" 2>/dev/null | cut -f1)
        local backup_count=$(find "$backup_dir" -name "*.sql.gz" | wc -l)
        print_status "Backup directory: ${backup_size}MB, ${backup_count} files"
        
        if [ "$backup_size" -gt 10000 ]; then  # 10GB
            print_warning "Backup directory is large: ${backup_size}MB"
            send_alert "Large Backup Directory" "Backup directory size is ${backup_size}MB, consider cleanup" "WARNING"
        fi
    fi
}

# Check network connectivity
check_network() {
    print_info "Checking network connectivity..."
    
    # Check if we can resolve DNS
    if nslookup google.com >/dev/null 2>&1; then
        print_status "DNS resolution working"
    else
        print_error "DNS resolution failed"
        send_alert "DNS Resolution Failed" "Cannot resolve external DNS" "CRITICAL"
    fi
    
    # Check internet connectivity
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        print_status "Internet connectivity working"
    else
        print_error "Internet connectivity failed"
        send_alert "Internet Connectivity Failed" "Cannot reach external networks" "CRITICAL"
    fi
}

# Generate performance report
generate_performance_report() {
    local report_file="/var/log/skyraksys-hrm/performance-report-$(date +%Y%m%d-%H%M).txt"
    
    {
        echo "=== Skyraksys HRM Performance Report ==="
        echo "Timestamp: $(date)"
        echo ""
        
        echo "=== System Resources ==="
        echo "CPU Usage: $(get_cpu_usage)%"
        echo "Memory Usage: $(get_memory_usage)%"
        echo "Disk Usage: $(get_disk_usage)%"
        echo "Load Average: $(get_load_average)"
        echo ""
        
        echo "=== Service Status ==="
        systemctl is-active hrm-backend hrm-frontend postgresql-15 nginx 2>/dev/null || true
        echo ""
        
        echo "=== Database Info ==="
        if systemctl is-active --quiet postgresql-15; then
            local max_conn=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SHOW max_connections;" 2>/dev/null | xargs || echo "N/A")
            local curr_conn=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME';" 2>/dev/null | xargs || echo "N/A")
            local db_size=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | xargs || echo "N/A")
            
            echo "Database Size: $db_size"
            echo "Connections: ${curr_conn}/${max_conn}"
        else
            echo "PostgreSQL is not running"
        fi
        echo ""
        
        echo "=== Disk Usage ==="
        df -h | grep -E '^/dev/'
        echo ""
        
        echo "=== Memory Usage ==="
        free -h
        echo ""
        
        echo "=== Top Processes ==="
        ps aux --sort=-%cpu | head -10
        
    } > "$report_file"
    
    print_info "Performance report saved: $report_file"
}

# Main monitoring function
main() {
    # Create log directories if they don't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$(dirname "$ALERT_LOG")"
    
    log_message "Starting performance monitoring"
    
    # Run all checks
    check_system_resources
    echo ""
    
    check_services
    echo ""
    
    check_database_performance
    echo ""
    
    check_application_response
    echo ""
    
    check_storage_space
    echo ""
    
    check_network
    echo ""
    
    # Generate report (only during business hours to avoid spam)
    local hour=$(date +%H)
    if [ "$hour" -ge 8 ] && [ "$hour" -le 18 ]; then
        generate_performance_report
    fi
    
    log_message "Performance monitoring completed"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script with sudo"
    exit 1
fi

# Install bc if not available (for floating point calculations)
if ! command -v bc >/dev/null 2>&1; then
    yum install -y bc >/dev/null 2>&1 || dnf install -y bc >/dev/null 2>&1 || true
fi

# Run monitoring
main

exit 0