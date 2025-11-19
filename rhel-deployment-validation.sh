#!/bin/bash

# =============================================================================
# 🔍 RHEL Production Deployment Validation & Troubleshooting Script
# =============================================================================
# Comprehensive RHEL-specific validation for SkyrakSys HRM deployment
# Validates all components: database, frontend, backend, environment, SSL, etc.
# =============================================================================

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# Configuration
readonly PROD_SERVER_IP="95.216.14.232"
readonly PROD_DB_NAME="skyraksys_hrm_prod"
readonly PROD_DB_USER="skyraksys_admin"
readonly APP_DIR="/opt/skyraksys-hrm"
readonly LOG_DIR="/var/log/skyraksys-hrm"
readonly BACKEND_PORT="5000"

print_header() {
    echo -e "${CYAN}=============================================================================="
    echo "  🔍 $1"
    echo "==============================================================================${NC}"
}

print_check() {
    echo -e "${BLUE}[CHECK] $1${NC}"
}

print_pass() {
    echo -e "${GREEN}[PASS] ✅ $1${NC}"
}

print_fail() {
    echo -e "${RED}[FAIL] ❌ $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}[WARN] ⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}[INFO] ℹ️  $1${NC}"
}

# =============================================================================
# RHEL SYSTEM VALIDATION
# =============================================================================

check_rhel_system() {
    print_header "RHEL System Validation"
    
    print_check "Checking RHEL version and system info"
    if [[ -f /etc/redhat-release ]]; then
        local rhel_version=$(cat /etc/redhat-release)
        print_pass "RHEL detected: $rhel_version"
    else
        print_fail "This system does not appear to be RHEL"
        return 1
    fi
    
    print_check "Checking SELinux status"
    if command -v getenforce >/dev/null 2>&1; then
        local selinux_status=$(getenforce)
        print_info "SELinux status: $selinux_status"
        if [[ "$selinux_status" == "Enforcing" ]]; then
            print_check "Checking SELinux booleans for web applications"
            local httpd_network=$(getsebool httpd_can_network_connect | cut -d' ' -f3)
            if [[ "$httpd_network" == "on" ]]; then
                print_pass "SELinux httpd_can_network_connect is enabled"
            else
                print_warn "SELinux httpd_can_network_connect is disabled"
            fi
        fi
    else
        print_info "SELinux not available"
    fi
    
    print_check "Checking system resources"
    local memory_gb=$(free -g | awk 'NR==2{print $2}')
    local disk_space_gb=$(df /opt | awk 'NR==2{print int($4/1024/1024)}')
    
    if [[ $memory_gb -ge 2 ]]; then
        print_pass "Memory: ${memory_gb}GB (sufficient)"
    else
        print_warn "Memory: ${memory_gb}GB (may be insufficient for production)"
    fi
    
    if [[ $disk_space_gb -ge 5 ]]; then
        print_pass "Disk space: ${disk_space_gb}GB available (sufficient)"
    else
        print_warn "Disk space: ${disk_space_gb}GB available (may be insufficient)"
    fi
    
    print_check "Checking required RHEL packages"
    local packages=("git" "curl" "nginx" "postgresql" "postgresql-server" "nodejs" "npm")
    for pkg in "${packages[@]}"; do
        if rpm -q "$pkg" >/dev/null 2>&1; then
            print_pass "Package $pkg is installed"
        else
            print_fail "Package $pkg is NOT installed"
        fi
    done
}

# =============================================================================
# DATABASE VALIDATION
# =============================================================================

check_database() {
    print_header "PostgreSQL Database Validation"
    
    print_check "Checking PostgreSQL service"
    if systemctl is-active --quiet postgresql; then
        print_pass "PostgreSQL service is running"
    else
        print_fail "PostgreSQL service is not running"
        return 1
    fi
    
    print_check "Testing database connection"
    if sudo -u postgres psql -c "SELECT version();" >/dev/null 2>&1; then
        print_pass "PostgreSQL is accessible"
    else
        print_fail "Cannot connect to PostgreSQL"
        return 1
    fi
    
    print_check "Checking production database exists"
    local db_exists=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$PROD_DB_NAME';" 2>/dev/null || echo "0")
    if [[ "$db_exists" == "1" ]]; then
        print_pass "Production database '$PROD_DB_NAME' exists"
    else
        print_fail "Production database '$PROD_DB_NAME' does not exist"
    fi
    
    print_check "Checking production user exists"
    local user_exists=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_user WHERE usename='$PROD_DB_USER';" 2>/dev/null || echo "0")
    if [[ "$user_exists" == "1" ]]; then
        print_pass "Production user '$PROD_DB_USER' exists"
    else
        print_fail "Production user '$PROD_DB_USER' does not exist"
    fi
    
    print_check "Testing application database connection"
    if [[ -f "$APP_DIR/backend/.env" ]]; then
        local db_password=$(grep "^DB_PASSWORD=" "$APP_DIR/backend/.env" | cut -d'=' -f2- | tr -d '"')
        if PGPASSWORD="$db_password" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
            print_pass "Application can connect to database"
            
            # Check critical tables and columns
            print_check "Checking database schema"
            local tables=$(PGPASSWORD="$db_password" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")
            if [[ "$tables" -gt 5 ]]; then
                print_pass "Database schema has $tables tables"
                
                # Check for critical User table columns
                local locked_at_exists=$(PGPASSWORD="$db_password" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='Users' AND column_name='lockedAt';" 2>/dev/null || echo "0")
                if [[ "$locked_at_exists" == "1" ]]; then
                    print_pass "Critical User.lockedAt column exists"
                else
                    print_fail "Critical User.lockedAt column missing - will cause login failures"
                fi
            else
                print_warn "Database schema appears incomplete ($tables tables)"
            fi
        else
            print_fail "Application cannot connect to database with configured credentials"
        fi
    else
        print_warn "Backend .env file not found, cannot test database connection"
    fi
}

# =============================================================================
# APPLICATION VALIDATION
# =============================================================================

check_application_files() {
    print_header "Application Files Validation"
    
    print_check "Checking application directory structure"
    local required_dirs=("backend" "frontend" "frontend/dist")
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$APP_DIR/$dir" ]]; then
            print_pass "Directory $APP_DIR/$dir exists"
        else
            print_fail "Directory $APP_DIR/$dir does not exist"
        fi
    done
    
    print_check "Checking backend configuration"
    if [[ -f "$APP_DIR/backend/.env" ]]; then
        print_pass "Backend .env file exists"
        
        # Check critical environment variables
        local env_vars=("NODE_ENV" "PORT" "DB_HOST" "DB_NAME" "DB_USER" "DB_PASSWORD" "JWT_SECRET")
        for var in "${env_vars[@]}"; do
            if grep -q "^$var=" "$APP_DIR/backend/.env"; then
                print_pass "Environment variable $var is configured"
            else
                print_fail "Environment variable $var is missing"
            fi
        done
        
        # Check port configuration
        local backend_port=$(grep "^PORT=" "$APP_DIR/backend/.env" | cut -d'=' -f2)
        if [[ "$backend_port" == "$BACKEND_PORT" ]]; then
            print_pass "Backend port correctly set to $BACKEND_PORT"
        else
            print_warn "Backend port is $backend_port, expected $BACKEND_PORT"
        fi
        
    else
        print_fail "Backend .env file does not exist"
    fi
    
    print_check "Checking frontend build"
    if [[ -f "$APP_DIR/frontend/dist/index.html" ]]; then
        print_pass "Frontend build exists"
        local build_size=$(du -sh "$APP_DIR/frontend/dist" | cut -f1)
        print_info "Frontend build size: $build_size"
    else
        print_fail "Frontend build does not exist"
    fi
    
    print_check "Checking backend dependencies"
    if [[ -d "$APP_DIR/backend/node_modules" ]]; then
        print_pass "Backend dependencies installed"
    else
        print_fail "Backend dependencies not installed"
    fi
}

# =============================================================================
# SERVICES VALIDATION
# =============================================================================

check_services() {
    print_header "Services and Process Validation"
    
    print_check "Checking Node.js and npm versions"
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        print_pass "Node.js version: $node_version"
    else
        print_fail "Node.js is not installed or not in PATH"
    fi
    
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        print_pass "npm version: $npm_version"
    else
        print_fail "npm is not installed or not in PATH"
    fi
    
    print_check "Checking PM2 status"
    if command -v pm2 >/dev/null 2>&1; then
        print_pass "PM2 is installed"
        
        local pm2_processes=$(pm2 jlist 2>/dev/null | jq length 2>/dev/null || echo "0")
        if [[ "$pm2_processes" -gt 0 ]]; then
            print_pass "PM2 is managing $pm2_processes process(es)"
            
            # Check specific backend process
            local backend_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="skyraksys-hrm-backend") | .pm2_env.status' 2>/dev/null || echo "not_found")
            if [[ "$backend_status" == "online" ]]; then
                print_pass "Backend process is online"
            else
                print_fail "Backend process status: $backend_status"
            fi
        else
            print_fail "PM2 is not managing any processes"
        fi
    else
        print_fail "PM2 is not installed"
    fi
    
    print_check "Checking system services"
    local services=("nginx" "postgresql" "firewalld")
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service"; then
            print_pass "Service $service is running"
        else
            print_fail "Service $service is not running"
        fi
        
        if systemctl is-enabled --quiet "$service"; then
            print_pass "Service $service is enabled for auto-start"
        else
            print_warn "Service $service is not enabled for auto-start"
        fi
    done
}

# =============================================================================
# NETWORK AND SSL VALIDATION
# =============================================================================

check_network_ssl() {
    print_header "Network and SSL Validation"
    
    print_check "Checking firewall configuration"
    if systemctl is-active --quiet firewalld; then
        print_pass "Firewall is active"
        
        local open_services=$(firewall-cmd --list-services)
        if echo "$open_services" | grep -q "http"; then
            print_pass "HTTP is allowed through firewall"
        else
            print_fail "HTTP is not allowed through firewall"
        fi
        
        if echo "$open_services" | grep -q "https"; then
            print_pass "HTTPS is allowed through firewall"
        else
            print_fail "HTTPS is not allowed through firewall"
        fi
        
        local open_ports=$(firewall-cmd --list-ports)
        if echo "$open_ports" | grep -q "$BACKEND_PORT"; then
            print_pass "Backend port $BACKEND_PORT is open"
        else
            print_warn "Backend port $BACKEND_PORT may not be accessible externally"
        fi
    else
        print_warn "Firewall is not active"
    fi
    
    print_check "Checking SSL certificates"
    local ssl_dir="/etc/nginx/ssl"
    if [[ -f "$ssl_dir/skyraksys.crt" ]] && [[ -f "$ssl_dir/skyraksys.key" ]]; then
        print_pass "SSL certificates exist"
        
        # Check certificate validity
        local cert_expiry=$(openssl x509 -in "$ssl_dir/skyraksys.crt" -noout -enddate 2>/dev/null | cut -d'=' -f2 || echo "unknown")
        if [[ "$cert_expiry" != "unknown" ]]; then
            print_info "SSL certificate expires: $cert_expiry"
        fi
        
        # Check if certificate matches IP
        local cert_ip=$(openssl x509 -in "$ssl_dir/skyraksys.crt" -noout -text 2>/dev/null | grep -A1 "Subject Alternative Name" | grep -o "IP:[0-9.]*" | cut -d':' -f2 || echo "none")
        if [[ "$cert_ip" == "$PROD_SERVER_IP" ]]; then
            print_pass "SSL certificate matches server IP"
        else
            print_warn "SSL certificate IP ($cert_ip) doesn't match server IP ($PROD_SERVER_IP)"
        fi
    else
        print_fail "SSL certificates are missing"
    fi
    
    print_check "Checking Nginx configuration"
    if [[ -f "/etc/nginx/conf.d/skyraksys-hrm.conf" ]]; then
        print_pass "Nginx configuration file exists"
        
        # Test configuration syntax
        if nginx -t >/dev/null 2>&1; then
            print_pass "Nginx configuration syntax is valid"
        else
            print_fail "Nginx configuration has syntax errors"
        fi
    else
        print_fail "Nginx configuration file is missing"
    fi
}

# =============================================================================
# ENDPOINT TESTING
# =============================================================================

test_endpoints() {
    print_header "Endpoint Testing"
    
    print_check "Testing frontend accessibility"
    local frontend_status=$(curl -s -k -w "%{http_code}" -o /dev/null "https://$PROD_SERVER_IP/" 2>/dev/null || echo "000")
    if [[ "$frontend_status" == "200" ]]; then
        print_pass "Frontend is accessible (HTTP $frontend_status)"
    else
        print_fail "Frontend accessibility test failed (HTTP $frontend_status)"
    fi
    
    print_check "Testing API health endpoint"
    local health_status=$(curl -s -k -w "%{http_code}" -o /dev/null "https://$PROD_SERVER_IP/api/health" 2>/dev/null || echo "000")
    if [[ "$health_status" == "200" ]]; then
        print_pass "API health endpoint is accessible (HTTP $health_status)"
    else
        print_fail "API health endpoint test failed (HTTP $health_status)"
    fi
    
    print_check "Testing API base endpoint"
    local api_status=$(curl -s -k -w "%{http_code}" -o /dev/null "https://$PROD_SERVER_IP/api/" 2>/dev/null || echo "000")
    case "$api_status" in
        200|404|405) print_pass "API base endpoint is reachable (HTTP $api_status)" ;;
        *) print_fail "API base endpoint test failed (HTTP $api_status)" ;;
    esac
    
    print_check "Testing login endpoint structure"
    local login_response=$(curl -s -k -X POST "https://$PROD_SERVER_IP/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{}' 2>/dev/null || echo '{"error":"connection_failed"}')
    
    if echo "$login_response" | grep -q '"message".*"required"'; then
        print_pass "Login endpoint is responding with validation"
    elif echo "$login_response" | grep -q 'lockedAt does not exist'; then
        print_fail "Login endpoint has database schema error (missing lockedAt column)"
    elif echo "$login_response" | grep -q 'connection_failed'; then
        print_fail "Cannot connect to login endpoint"
    else
        print_info "Login endpoint response unclear, manual testing recommended"
    fi
    
    print_check "Testing HTTP to HTTPS redirect"
    local redirect_status=$(curl -s -w "%{http_code}" -o /dev/null "http://$PROD_SERVER_IP/" 2>/dev/null || echo "000")
    case "$redirect_status" in
        301|302) print_pass "HTTP to HTTPS redirect is working (HTTP $redirect_status)" ;;
        *) print_warn "HTTP to HTTPS redirect test failed (HTTP $redirect_status)" ;;
    esac
}

# =============================================================================
# LOG ANALYSIS
# =============================================================================

check_logs() {
    print_header "Log Analysis"
    
    print_check "Checking log directories and files"
    if [[ -d "$LOG_DIR" ]]; then
        print_pass "Log directory exists: $LOG_DIR"
        local log_files=$(find "$LOG_DIR" -name "*.log" -type f | wc -l)
        print_info "Found $log_files log files"
    else
        print_warn "Log directory does not exist: $LOG_DIR"
    fi
    
    print_check "Checking PM2 logs"
    if command -v pm2 >/dev/null 2>&1; then
        local pm2_log_count=$(pm2 logs --lines 0 2>/dev/null | wc -l || echo "0")
        if [[ "$pm2_log_count" -gt 0 ]]; then
            print_pass "PM2 logs are available"
        else
            print_warn "PM2 logs may be empty or unavailable"
        fi
    fi
    
    print_check "Checking Nginx logs"
    if [[ -f "/var/log/nginx/access.log" ]]; then
        print_pass "Nginx access log exists"
        local recent_requests=$(tail -n 100 /var/log/nginx/access.log | grep -c "$PROD_SERVER_IP" || echo "0")
        print_info "Recent requests to server: $recent_requests"
    else
        print_warn "Nginx access log not found"
    fi
    
    if [[ -f "/var/log/nginx/error.log" ]]; then
        print_pass "Nginx error log exists"
        local recent_errors=$(tail -n 50 /var/log/nginx/error.log | grep -c "$(date +%Y/%m/%d)" || echo "0")
        if [[ "$recent_errors" -eq 0 ]]; then
            print_pass "No recent Nginx errors"
        else
            print_warn "$recent_errors recent Nginx errors found"
        fi
    else
        print_warn "Nginx error log not found"
    fi
    
    print_check "Checking system journal for application errors"
    local app_errors=$(journalctl -u skyraksys-hrm --since "1 hour ago" --no-pager | grep -i error | wc -l || echo "0")
    if [[ "$app_errors" -eq 0 ]]; then
        print_pass "No recent application errors in systemd journal"
    else
        print_warn "$app_errors recent application errors found in journal"
    fi
}

# =============================================================================
# PERFORMANCE CHECKS
# =============================================================================

check_performance() {
    print_header "Performance and Resource Usage"
    
    print_check "Checking system load"
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    print_info "Load average: $load_avg (CPU cores: $cpu_cores)"
    
    if (( $(echo "$load_avg < $cpu_cores" | bc -l) )); then
        print_pass "System load is normal"
    else
        print_warn "System load is high"
    fi
    
    print_check "Checking memory usage"
    local memory_info=$(free -h | awk 'NR==2{printf "Used: %s/%s (%.0f%%)", $3,$2,$3*100/$2}')
    print_info "Memory $memory_info"
    
    print_check "Checking disk usage"
    local disk_usage=$(df -h "$APP_DIR" | awk 'NR==2{printf "Used: %s/%s (%s)", $3,$2,$5}')
    print_info "Disk $disk_usage"
    
    print_check "Checking process counts"
    local total_processes=$(ps aux | wc -l)
    local node_processes=$(pgrep -c node 2>/dev/null || echo "0")
    local postgres_processes=$(pgrep -c postgres 2>/dev/null || echo "0")
    
    print_info "Total processes: $total_processes"
    print_info "Node.js processes: $node_processes"
    print_info "PostgreSQL processes: $postgres_processes"
    
    print_check "Checking network connections"
    local established_connections=$(netstat -an 2>/dev/null | grep -c ESTABLISHED || echo "unknown")
    local listening_ports=$(netstat -tln 2>/dev/null | grep -c LISTEN || echo "unknown")
    
    print_info "Established connections: $established_connections"
    print_info "Listening ports: $listening_ports"
    
    # Check if backend port is listening
    if netstat -tln 2>/dev/null | grep -q ":$BACKEND_PORT "; then
        print_pass "Backend port $BACKEND_PORT is listening"
    else
        print_fail "Backend port $BACKEND_PORT is not listening"
    fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    print_header "RHEL Production Deployment Validation"
    print_info "Server: $PROD_SERVER_IP"
    print_info "Validation started: $(date)"
    echo ""
    
    local total_checks=0
    local failed_checks=0
    
    # Run all validation checks
    if ! check_rhel_system; then ((failed_checks++)); fi
    ((total_checks++))
    echo ""
    
    if ! check_database; then ((failed_checks++)); fi
    ((total_checks++))
    echo ""
    
    if ! check_application_files; then ((failed_checks++)); fi
    ((total_checks++))
    echo ""
    
    if ! check_services; then ((failed_checks++)); fi
    ((total_checks++))
    echo ""
    
    if ! check_network_ssl; then ((failed_checks++)); fi
    ((total_checks++))
    echo ""
    
    if ! test_endpoints; then ((failed_checks++)); fi
    ((total_checks++))
    echo ""
    
    check_logs
    echo ""
    
    check_performance
    echo ""
    
    # Summary
    print_header "Validation Summary"
    
    local passed_checks=$((total_checks - failed_checks))
    
    if [[ $failed_checks -eq 0 ]]; then
        print_pass "All $total_checks validation categories passed!"
        echo -e "${GREEN}🎉 Your RHEL deployment appears to be healthy and ready for production.${NC}"
    else
        print_warn "$failed_checks out of $total_checks validation categories had issues"
        echo -e "${YELLOW}⚠️  Some issues were detected. Review the failed checks above.${NC}"
    fi
    
    echo ""
    print_info "Validation completed: $(date)"
    echo ""
    
    echo -e "${CYAN}📋 Next Steps:${NC}"
    if [[ $failed_checks -eq 0 ]]; then
        echo "  • Your deployment is ready for production use"
        echo "  • Test the application at: https://$PROD_SERVER_IP"
        echo "  • Monitor logs regularly: $LOG_DIR"
    else
        echo "  • Address the failed validation checks above"
        echo "  • Re-run this validation script after fixes"
        echo "  • Check application logs for detailed error information"
    fi
    echo "  • Set up automated backups for production data"
    echo "  • Configure monitoring and alerting"
    echo "  • Update default passwords and security settings"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}This script should be run as root for complete validation.${NC}"
    echo "Some checks may fail or be incomplete."
    echo ""
fi

# Execute main validation
main "$@"