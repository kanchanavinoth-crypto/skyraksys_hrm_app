#!/bin/bash

# RHEL 9.6 Production Health Check Script
# Skyraksys HRM System - Complete System Health Monitoring
# Run this script regularly to monitor system health

set -e

echo "=========================================="
echo "SKYRAKSYS HRM - System Health Check"
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
    echo -e "${GREEN}[✅ PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️ WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌ FAIL]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ️ INFO]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=========================================="
    echo -e "$1"
    echo -e "==========================================${NC}"
}

# Configuration
APP_DIR="/opt/skyraksys-hrm"
LOG_DIR="/var/log/skyraksys-hrm"
HEALTH_LOG="$LOG_DIR/health-check.log"

# Create health log if it doesn't exist
mkdir -p "$LOG_DIR"
touch "$HEALTH_LOG"

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$HEALTH_LOG"
}

# Health check results
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Function to record check result
record_check() {
    local status=$1
    local message=$2
    
    case $status in
        "PASS")
            print_status "$message"
            log_message "PASS: $message"
            ((CHECKS_PASSED++))
            ;;
        "FAIL")
            print_error "$message"
            log_message "FAIL: $message"
            ((CHECKS_FAILED++))
            ;;
        "WARN")
            print_warning "$message"
            log_message "WARN: $message"
            ((CHECKS_WARNING++))
            ;;
    esac
}

# System Resource Checks
print_header "SYSTEM RESOURCES"

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    record_check "PASS" "Disk usage: ${DISK_USAGE}% (Normal)"
elif [ "$DISK_USAGE" -lt 90 ]; then
    record_check "WARN" "Disk usage: ${DISK_USAGE}% (Warning - Consider cleanup)"
else
    record_check "FAIL" "Disk usage: ${DISK_USAGE}% (Critical - Immediate action required)"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -lt 80 ]; then
    record_check "PASS" "Memory usage: ${MEMORY_USAGE}% (Normal)"
elif [ "$MEMORY_USAGE" -lt 90 ]; then
    record_check "WARN" "Memory usage: ${MEMORY_USAGE}% (High - Monitor closely)"
else
    record_check "FAIL" "Memory usage: ${MEMORY_USAGE}% (Critical - Performance impact likely)"
fi

# Check CPU load
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
CPU_CORES=$(nproc)
CPU_LOAD_INT=$(echo "$CPU_LOAD * 100 / $CPU_CORES" | bc -l | cut -d. -f1)

if [ "$CPU_LOAD_INT" -lt 70 ]; then
    record_check "PASS" "CPU load: $CPU_LOAD (${CPU_LOAD_INT}% of $CPU_CORES cores - Normal)"
elif [ "$CPU_LOAD_INT" -lt 90 ]; then
    record_check "WARN" "CPU load: $CPU_LOAD (${CPU_LOAD_INT}% of $CPU_CORES cores - High)"
else
    record_check "FAIL" "CPU load: $CPU_LOAD (${CPU_LOAD_INT}% of $CPU_CORES cores - Overloaded)"
fi

# Service Status Checks
print_header "SERVICE STATUS"

# Check PostgreSQL
if systemctl is-active --quiet postgresql-15; then
    PG_VERSION=$(sudo -u postgres psql --version | head -1 | awk '{print $3}')
    record_check "PASS" "PostgreSQL service: Running (Version: $PG_VERSION)"
    
    # Test database connection
    if sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT 'Database connection successful' as status;" > /dev/null 2>&1; then
        record_check "PASS" "Database connection: Successful"
        
        # Check database size
        DB_SIZE=$(sudo -u postgres psql -d skyraksys_hrm_prod -t -c "SELECT pg_size_pretty(pg_database_size('skyraksys_hrm_prod'));" | xargs)
        record_check "PASS" "Database size: $DB_SIZE"
        
        # Check active connections
        DB_CONNECTIONS=$(sudo -u postgres psql -d skyraksys_hrm_prod -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)
        if [ "$DB_CONNECTIONS" -lt 50 ]; then
            record_check "PASS" "Database connections: $DB_CONNECTIONS (Normal)"
        elif [ "$DB_CONNECTIONS" -lt 80 ]; then
            record_check "WARN" "Database connections: $DB_CONNECTIONS (High)"
        else
            record_check "FAIL" "Database connections: $DB_CONNECTIONS (Too many - Check for connection leaks)"
        fi
    else
        record_check "FAIL" "Database connection: Failed"
    fi
else
    record_check "FAIL" "PostgreSQL service: Not running"
fi

# Check Redis
if systemctl is-active --quiet redis; then
    REDIS_VERSION=$(redis-server --version | awk '{print $3}' | cut -d'=' -f2)
    record_check "PASS" "Redis service: Running (Version: $REDIS_VERSION)"
    
    # Test Redis connection
    if redis-cli ping > /dev/null 2>&1; then
        record_check "PASS" "Redis connection: Successful"
        
        # Check Redis memory usage
        REDIS_MEMORY=$(redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        record_check "PASS" "Redis memory usage: $REDIS_MEMORY"
    else
        record_check "FAIL" "Redis connection: Failed"
    fi
else
    record_check "FAIL" "Redis service: Not running"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    NGINX_VERSION=$(nginx -v 2>&1 | awk -F/ '{print $2}')
    record_check "PASS" "Nginx service: Running (Version: $NGINX_VERSION)"
    
    # Test Nginx configuration
    if nginx -t > /dev/null 2>&1; then
        record_check "PASS" "Nginx configuration: Valid"
    else
        record_check "FAIL" "Nginx configuration: Invalid - Check syntax"
    fi
else
    record_check "FAIL" "Nginx service: Not running"
fi

# Check HRM Backend
if systemctl is-active --quiet hrm-backend; then
    record_check "PASS" "HRM Backend service: Running"
    
    # Test API health check
    if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
        record_check "PASS" "HRM Backend API: Responding"
        
        # Get API version
        API_INFO=$(curl -s http://localhost:5000/api/health 2>/dev/null | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "Unknown")
        record_check "PASS" "API Version: $API_INFO"
    else
        record_check "FAIL" "HRM Backend API: Not responding"
    fi
else
    record_check "FAIL" "HRM Backend service: Not running"
fi

# Check HRM Frontend
if systemctl is-active --quiet hrm-frontend; then
    record_check "PASS" "HRM Frontend service: Running"
    
    # Test frontend availability
    if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
        record_check "PASS" "HRM Frontend: Responding"
    else
        record_check "FAIL" "HRM Frontend: Not responding"
    fi
else
    record_check "FAIL" "HRM Frontend service: Not running"
fi

# Application Health Checks
print_header "APPLICATION HEALTH"

# Check application directories
if [ -d "$APP_DIR" ]; then
    record_check "PASS" "Application directory exists: $APP_DIR"
    
    # Check environment file
    if [ -f "$APP_DIR/.env" ]; then
        record_check "PASS" "Environment file exists"
        
        # Check if environment file has secure passwords
        if grep -q "your_secure_password_here" "$APP_DIR/.env" 2>/dev/null; then
            record_check "WARN" "Environment file contains default passwords - Update for security"
        else
            record_check "PASS" "Environment file appears to have custom passwords"
        fi
    else
        record_check "FAIL" "Environment file missing: $APP_DIR/.env"
    fi
    
    # Check uploads directory
    if [ -d "$APP_DIR/uploads" ]; then
        UPLOADS_SIZE=$(du -sh "$APP_DIR/uploads" 2>/dev/null | cut -f1 || echo "0")
        record_check "PASS" "Uploads directory exists: $UPLOADS_SIZE"
    else
        record_check "WARN" "Uploads directory missing: $APP_DIR/uploads"
    fi
else
    record_check "FAIL" "Application directory missing: $APP_DIR"
fi

# Check log files
if [ -d "$LOG_DIR" ]; then
    record_check "PASS" "Log directory exists: $LOG_DIR"
    
    # Check log file sizes
    for log_file in application.log error.log access.log; do
        if [ -f "$LOG_DIR/$log_file" ]; then
            LOG_SIZE=$(du -sh "$LOG_DIR/$log_file" 2>/dev/null | cut -f1 || echo "0")
            record_check "PASS" "Log file $log_file: $LOG_SIZE"
        else
            record_check "WARN" "Log file missing: $log_file"
        fi
    done
else
    record_check "FAIL" "Log directory missing: $LOG_DIR"
fi

# Security Checks
print_header "SECURITY STATUS"

# Check firewall status
if systemctl is-active --quiet firewalld; then
    record_check "PASS" "Firewall service: Running"
    
    # Check open ports
    OPEN_PORTS=$(firewall-cmd --list-ports 2>/dev/null | wc -w)
    record_check "PASS" "Firewall ports configured: $OPEN_PORTS"
else
    record_check "WARN" "Firewall service: Not running"
fi

# Check fail2ban status
if systemctl is-active --quiet fail2ban; then
    record_check "PASS" "Fail2ban service: Running"
    
    # Check active jails
    ACTIVE_JAILS=$(fail2ban-client status 2>/dev/null | grep "Jail list:" | cut -d: -f2 | wc -w || echo "0")
    record_check "PASS" "Fail2ban active jails: $ACTIVE_JAILS"
else
    record_check "WARN" "Fail2ban service: Not running"
fi

# Check SSL certificates (if configured)
if [ -f "/etc/ssl/certs/skyraksys-hrm/fullchain.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/ssl/certs/skyraksys-hrm/fullchain.pem 2>/dev/null | cut -d= -f2 || echo "Unknown")
    CERT_DAYS=$(openssl x509 -checkend 2592000 -noout -in /etc/ssl/certs/skyraksys-hrm/fullchain.pem 2>/dev/null && echo "OK" || echo "EXPIRING")
    
    if [ "$CERT_DAYS" = "OK" ]; then
        record_check "PASS" "SSL certificate valid until: $CERT_EXPIRY"
    else
        record_check "WARN" "SSL certificate expiring soon: $CERT_EXPIRY"
    fi
else
    record_check "WARN" "SSL certificate not found - Consider implementing HTTPS"
fi

# Backup Health
print_header "BACKUP STATUS"

# Check backup directory
if [ -d "$APP_DIR/backups" ]; then
    BACKUP_COUNT=$(ls -1 "$APP_DIR/backups"/*.sql.gz 2>/dev/null | wc -l || echo "0")
    record_check "PASS" "Backup directory exists with $BACKUP_COUNT backups"
    
    # Check latest backup
    LATEST_BACKUP=$(ls -t "$APP_DIR/backups"/*.sql.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        BACKUP_AGE=$(stat -c %Y "$LATEST_BACKUP" 2>/dev/null || echo "0")
        CURRENT_TIME=$(date +%s)
        AGE_HOURS=$(( (CURRENT_TIME - BACKUP_AGE) / 3600 ))
        
        if [ "$AGE_HOURS" -lt 25 ]; then
            record_check "PASS" "Latest backup: $AGE_HOURS hours ago"
        elif [ "$AGE_HOURS" -lt 48 ]; then
            record_check "WARN" "Latest backup: $AGE_HOURS hours ago (Should be daily)"
        else
            record_check "FAIL" "Latest backup: $AGE_HOURS hours ago (Too old - Check backup schedule)"
        fi
    else
        record_check "FAIL" "No backup files found"
    fi
else
    record_check "FAIL" "Backup directory missing: $APP_DIR/backups"
fi

# Performance Metrics
print_header "PERFORMANCE METRICS"

# Check system uptime
UPTIME=$(uptime -p)
record_check "PASS" "System uptime: $UPTIME"

# Check load averages
LOAD_1M=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
LOAD_5M=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $2}' | sed 's/,//')
LOAD_15M=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $3}' | sed 's/,//')
record_check "PASS" "Load averages: 1m=$LOAD_1M, 5m=$LOAD_5M, 15m=$LOAD_15M"

# Check network connectivity
if ping -c 1 google.com > /dev/null 2>&1; then
    record_check "PASS" "Internet connectivity: Available"
else
    record_check "WARN" "Internet connectivity: Not available or limited"
fi

# Final Summary
print_header "HEALTH CHECK SUMMARY"

TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))
HEALTH_SCORE=$((CHECKS_PASSED * 100 / TOTAL_CHECKS))

print_info "Total checks performed: $TOTAL_CHECKS"
print_status "Checks passed: $CHECKS_PASSED"
print_warning "Warnings: $CHECKS_WARNING"
print_error "Checks failed: $CHECKS_FAILED"

if [ "$HEALTH_SCORE" -ge 90 ]; then
    print_status "Overall system health: EXCELLENT ($HEALTH_SCORE%)"
    HEALTH_STATUS="EXCELLENT"
elif [ "$HEALTH_SCORE" -ge 80 ]; then
    print_warning "Overall system health: GOOD ($HEALTH_SCORE%)"
    HEALTH_STATUS="GOOD"
elif [ "$HEALTH_SCORE" -ge 70 ]; then
    print_warning "Overall system health: FAIR ($HEALTH_SCORE%)"
    HEALTH_STATUS="FAIR"
else
    print_error "Overall system health: POOR ($HEALTH_SCORE%)"
    HEALTH_STATUS="POOR"
fi

# Log summary
log_message "SUMMARY: Health Score: $HEALTH_SCORE% ($HEALTH_STATUS) - Passed: $CHECKS_PASSED, Warnings: $CHECKS_WARNING, Failed: $CHECKS_FAILED"

# Recommendations
if [ "$CHECKS_FAILED" -gt 0 ]; then
    echo ""
    print_header "RECOMMENDATIONS"
    print_error "⚠️  IMMEDIATE ACTION REQUIRED: $CHECKS_FAILED critical issues found"
    print_info "1. Review failed checks above and address immediately"
    print_info "2. Check service logs: journalctl -u <service-name>"
    print_info "3. Monitor system resources: htop, iotop, nethogs"
    print_info "4. Contact support if issues persist"
elif [ "$CHECKS_WARNING" -gt 0 ]; then
    echo ""
    print_header "RECOMMENDATIONS"
    print_warning "👀 MONITORING RECOMMENDED: $CHECKS_WARNING warnings found"
    print_info "1. Review warnings above for preventive maintenance"
    print_info "2. Schedule maintenance during low-usage periods"
    print_info "3. Monitor trends over time"
else
    echo ""
    print_status "🎉 SYSTEM HEALTHY: No critical issues or warnings found"
fi

echo ""
print_info "Health check completed at: $(date)"
print_info "Logs saved to: $HEALTH_LOG"
print_info "Next check recommended in: 24 hours"

# Exit with appropriate code
if [ "$CHECKS_FAILED" -gt 0 ]; then
    exit 1
elif [ "$CHECKS_WARNING" -gt 0 ]; then
    exit 2
else
    exit 0
fi