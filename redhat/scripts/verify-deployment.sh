#!/bin/bash

# SkyrakSys HRM - Deployment Verification Script
# Version: 2.0.0
# For Red Hat Enterprise Linux

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="skyraksys_hrm"
APP_USER="hrm"
APP_DIR="/opt/${APP_NAME}"
LOG_DIR="/var/log/${APP_NAME}"

print_header() {
    echo -e "${BLUE}
╔══════════════════════════════════════════════════════════════╗
║           SkyrakSys HRM Deployment Verification             ║
║                Red Hat Linux Edition                        ║
╚══════════════════════════════════════════════════════════════╝
${NC}"
}

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Verification tests
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# System requirements verification
verify_system_requirements() {
    print_info "Verifying system requirements..."
    
    run_test "Operating System (RHEL/CentOS)" "grep -E '(Red Hat|CentOS)' /etc/redhat-release"
    run_test "Minimum RAM (4GB)" "[[ \$(free -m | awk '/^Mem:/{print \$2}') -ge 4000 ]]"
    run_test "Minimum Disk Space (20GB)" "[[ \$(df / | awk 'NR==2{print \$4}') -ge 20000000 ]]"
    run_test "Internet Connectivity" "ping -c 1 google.com"
}

# Service installation verification
verify_services() {
    print_info "Verifying service installations..."
    
    run_test "Node.js Installation" "command -v node"
    run_test "npm Installation" "command -v npm"
    run_test "PM2 Installation" "command -v pm2"
    run_test "PostgreSQL Installation" "systemctl is-enabled postgresql-15"
    run_test "Nginx Installation" "systemctl is-enabled nginx"
    
    # Version checks
    if command -v node > /dev/null; then
        NODE_VERSION=$(node --version)
        print_info "Node.js version: $NODE_VERSION"
    fi
    
    if command -v psql > /dev/null; then
        POSTGRES_VERSION=$(sudo -u postgres psql --version | cut -d' ' -f3)
        print_info "PostgreSQL version: $POSTGRES_VERSION"
    fi
    
    if command -v nginx > /dev/null; then
        NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
        print_info "Nginx version: $NGINX_VERSION"
    fi
}

# Service status verification
verify_service_status() {
    print_info "Verifying service status..."
    
    run_test "PostgreSQL Service" "systemctl is-active postgresql-15"
    run_test "Nginx Service" "systemctl is-active nginx"
    run_test "SkyrakSys HRM Service" "systemctl is-active skyraksys-hrm"
    
    # Port checks
    run_test "PostgreSQL Port (5432)" "ss -tulpn | grep ':5432'"
    run_test "Nginx HTTP Port (80)" "ss -tulpn | grep ':80'"
    run_test "Nginx HTTPS Port (443)" "ss -tulpn | grep ':443'"
    run_test "Application Port (8080)" "ss -tulpn | grep ':8080'"
}

# Database verification
verify_database() {
    print_info "Verifying database setup..."
    
    run_test "Database Connection" "sudo -u postgres psql -c 'SELECT 1;'"
    run_test "Application Database" "sudo -u postgres psql -l | grep skyraksys_hrm"
    run_test "Database User" "sudo -u postgres psql -c \"SELECT usename FROM pg_user WHERE usename = 'hrm_admin';\""
    run_test "Database Tables" "sudo -u postgres psql -d skyraksys_hrm -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';\""
}

# Application verification
verify_application() {
    print_info "Verifying application deployment..."
    
    run_test "Application Directory" "[[ -d '$APP_DIR' ]]"
    run_test "Backend Files" "[[ -f '$APP_DIR/backend/server.js' ]]"
    run_test "Frontend Build" "[[ -d '$APP_DIR/frontend/build' ]]"
    run_test "Node Modules" "[[ -d '$APP_DIR/backend/node_modules' ]]"
    run_test "Environment File" "[[ -f '$APP_DIR/backend/.env' ]]"
    run_test "Package.json" "[[ -f '$APP_DIR/backend/package.json' ]]"
    
    # File permissions
    run_test "Application Ownership" "[[ \$(stat -c '%U' '$APP_DIR') == '$APP_USER' ]]"
    run_test "Log Directory" "[[ -d '$LOG_DIR' ]]"
}

# Network and connectivity verification
verify_network() {
    print_info "Verifying network connectivity..."
    
    run_test "Backend API Health" "curl -s http://localhost:8080/api/health"
    run_test "Nginx Response" "curl -s http://localhost/"
    run_test "Internal Communication" "curl -s http://localhost:8080/api/health | grep -q 'healthy\\|ok\\|success'"
    
    # SSL verification (if configured)
    if [[ -f "/etc/letsencrypt/live/$(hostname)/fullchain.pem" ]]; then
        run_test "SSL Certificate" "openssl x509 -checkend 86400 -noout -in /etc/letsencrypt/live/$(hostname)/fullchain.pem"
    else
        print_warning "SSL certificate not configured"
    fi
}

# Configuration verification
verify_configuration() {
    print_info "Verifying configuration files..."
    
    run_test "Nginx Configuration" "nginx -t"
    run_test "PM2 Configuration" "[[ -f '$APP_DIR/ecosystem.config.js' ]]"
    run_test "SystemD Service" "[[ -f '/etc/systemd/system/skyraksys-hrm.service' ]]"
    
    # Check if PM2 is running
    if sudo -u "$APP_USER" pm2 list > /dev/null 2>&1; then
        PM2_STATUS=$(sudo -u "$APP_USER" pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null || echo "unknown")
        if [[ "$PM2_STATUS" == "online" ]]; then
            print_status "PM2 process is online"
        else
            print_warning "PM2 process status: $PM2_STATUS"
        fi
    else
        print_warning "PM2 not accessible or not running"
    fi
}

# Security verification
verify_security() {
    print_info "Verifying security configuration..."
    
    run_test "Firewall Active" "systemctl is-active firewalld"
    run_test "HTTP Port Open" "firewall-cmd --query-port=80/tcp"
    run_test "HTTPS Port Open" "firewall-cmd --query-port=443/tcp"
    run_test "Application User Exists" "id '$APP_USER'"
    run_test "Environment File Permissions" "[[ \$(stat -c '%a' '$APP_DIR/backend/.env') == '600' ]]"
    
    # SELinux check
    if command -v getenforce > /dev/null; then
        SELINUX_STATUS=$(getenforce)
        print_info "SELinux status: $SELINUX_STATUS"
        if [[ "$SELINUX_STATUS" == "Enforcing" ]]; then
            run_test "SELinux HTTP Connect" "getsebool httpd_can_network_connect | grep -q on"
        fi
    fi
}

# Performance verification
verify_performance() {
    print_info "Verifying performance metrics..."
    
    # Memory usage
    MEMORY_USAGE=$(free | awk '/^Mem:/ {printf "%.1f", $3/$2 * 100}')
    if (( $(echo "$MEMORY_USAGE < 80" | bc -l) )); then
        print_status "Memory usage: ${MEMORY_USAGE}% (Good)"
    else
        print_warning "Memory usage: ${MEMORY_USAGE}% (High)"
    fi
    
    # Disk usage
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $DISK_USAGE -lt 80 ]]; then
        print_status "Disk usage: ${DISK_USAGE}% (Good)"
    else
        print_warning "Disk usage: ${DISK_USAGE}% (High)"
    fi
    
    # Load average
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    print_info "Load average: $LOAD_AVG"
}

# API endpoints verification
verify_api_endpoints() {
    print_info "Verifying API endpoints..."
    
    run_test "Health Endpoint" "curl -s http://localhost:8080/api/health"
    run_test "Auth Endpoint" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/auth/login | grep -q '200\\|400\\|401'"
    run_test "Users Endpoint" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/users | grep -q '200\\|401'"
    
    # Test API response time
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:8080/api/health)
    if (( $(echo "$RESPONSE_TIME < 2" | bc -l) )); then
        print_status "API response time: ${RESPONSE_TIME}s (Good)"
    else
        print_warning "API response time: ${RESPONSE_TIME}s (Slow)"
    fi
}

# Generate verification report
generate_report() {
    print_header
    echo -e "${BLUE}Deployment Verification Summary${NC}"
    echo "========================================"
    echo "• Total Tests: $TOTAL_TESTS"
    echo "• Passed: $PASSED_TESTS"
    echo "• Failed: $FAILED_TESTS"
    
    SUCCESS_RATE=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    echo "• Success Rate: ${SUCCESS_RATE}%"
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo -e "\n${GREEN}🎉 All tests passed! Deployment is successful.${NC}"
        echo -e "${GREEN}SkyrakSys HRM is ready for production use.${NC}"
        
        echo -e "\n${BLUE}Next Steps:${NC}"
        echo "1. Configure domain name and SSL certificate"
        echo "2. Set up monitoring and alerting"
        echo "3. Configure backup procedures"
        echo "4. Review security settings"
        echo "5. Test application functionality"
        
    elif [[ $SUCCESS_RATE -ge 80 ]]; then
        echo -e "\n${YELLOW}⚠️  Deployment mostly successful with minor issues.${NC}"
        echo -e "${YELLOW}Please review and fix the failed tests above.${NC}"
        
    else
        echo -e "\n${RED}❌ Deployment has significant issues.${NC}"
        echo -e "${RED}Please review and fix the failed tests before proceeding.${NC}"
    fi
    
    echo -e "\n${BLUE}Application URLs:${NC}"
    echo "• Frontend: http://$(hostname)/"
    echo "• API: http://$(hostname)/api/"
    echo "• Health Check: http://$(hostname)/api/health"
    
    echo -e "\n${BLUE}Log Locations:${NC}"
    echo "• Application: $LOG_DIR/"
    echo "• Nginx: /var/log/nginx/"
    echo "• PostgreSQL: /var/lib/pgsql/15/data/log/"
    echo "• System: journalctl -u skyraksys-hrm"
}

# Main execution
main() {
    print_header
    echo "Starting deployment verification..."
    echo "This may take a few minutes..."
    echo
    
    verify_system_requirements
    echo
    
    verify_services
    echo
    
    verify_service_status
    echo
    
    verify_database
    echo
    
    verify_application
    echo
    
    verify_network
    echo
    
    verify_configuration
    echo
    
    verify_security
    echo
    
    verify_performance
    echo
    
    verify_api_endpoints
    echo
    
    generate_report
}

# Check if jq is available (for JSON parsing)
if ! command -v jq > /dev/null; then
    print_warning "jq not found, installing for JSON parsing..."
    dnf install -y jq > /dev/null 2>&1 || print_warning "Could not install jq"
fi

# Check if bc is available (for calculations)
if ! command -v bc > /dev/null; then
    print_warning "bc not found, installing for calculations..."
    dnf install -y bc > /dev/null 2>&1 || print_warning "Could not install bc"
fi

# Run main verification
main "$@"
