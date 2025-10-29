#!/bin/bash

#################################################################################
# SkyrakSys HRM - Final Deployment Verification Script
# This script performs comprehensive testing to ensure your deployment is working
#################################################################################

set -e  # Exit on any error

echo "
🔍 SkyrakSys HRM - Deployment Verification
==========================================

This script will test all components of your deployment to ensure everything
is working correctly. Please wait while we run comprehensive tests...
"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_text="$3"
    
    ((TESTS_TOTAL++))
    
    log_info "Testing: $test_name"
    
    if eval "$test_command" > /tmp/test_output 2>&1; then
        if [[ -n "$expected_text" ]]; then
            if grep -q "$expected_text" /tmp/test_output; then
                log_success "$test_name - PASSED"
                return 0
            else
                log_error "$test_name - FAILED (Expected text not found)"
                echo "Output: $(cat /tmp/test_output)"
                return 1
            fi
        else
            log_success "$test_name - PASSED"
            return 0
        fi
    else
        log_error "$test_name - FAILED"
        echo "Error: $(cat /tmp/test_output)"
        return 1
    fi
}

echo "
📋 PHASE 1: System Requirements Check
=====================================
"

# Check if running as root (should not be)
if [[ $EUID -eq 0 ]]; then
    log_error "This script should not be run as root!"
    echo "Please run as a regular user with sudo privileges."
    exit 1
fi

# Test 1: Check if required services are installed
run_test "PostgreSQL Installation" "which psql" ""
run_test "Node.js Installation" "node --version" ""
run_test "NPM Installation" "npm --version" ""
run_test "PM2 Installation" "which pm2" ""
run_test "Nginx Installation" "nginx -v" ""

echo "
🗄️  PHASE 2: Database Verification
===================================
"

# Test database connection and setup
run_test "PostgreSQL Service Status" "sudo systemctl is-active postgresql-15" "active"
run_test "Database Connection" "sudo -u postgres psql -c 'SELECT 1;'" "1"
run_test "Application Database Exists" "sudo -u postgres psql -l | grep skyraksys_hrm" "skyraksys_hrm"
run_test "Database User Access" "sudo -u postgres psql -d skyraksys_hrm -c 'SELECT current_user;'" "postgres"

# Test if tables exist (after migration)
if sudo -u postgres psql -d skyraksys_hrm -c "\dt" | grep -q "users"; then
    log_success "Database Tables - PASSED (Tables exist)"
    ((TESTS_PASSED++))
else
    log_warning "Database Tables - WARNING (No tables found - this is normal for first install)"
fi
((TESTS_TOTAL++))

echo "
📱 PHASE 3: Application Verification
====================================
"

# Check if application directory exists
if [[ -d "/opt/skyraksys_hrm" ]]; then
    log_success "Application Directory - PASSED"
    ((TESTS_PASSED++))
else
    log_error "Application Directory - FAILED (/opt/skyraksys_hrm not found)"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

# Check if hrm user exists
if id "hrm" &>/dev/null; then
    log_success "Application User - PASSED"
    ((TESTS_PASSED++))
else
    log_error "Application User - FAILED (hrm user not found)"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

# Check backend environment file
if [[ -f "/opt/skyraksys_hrm/backend/.env" ]]; then
    log_success "Backend Environment File - PASSED"
    ((TESTS_PASSED++))
else
    log_error "Backend Environment File - FAILED (.env not found)"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

# Check if backend dependencies are installed
if [[ -d "/opt/skyraksys_hrm/backend/node_modules" ]]; then
    log_success "Backend Dependencies - PASSED"
    ((TESTS_PASSED++))
else
    log_error "Backend Dependencies - FAILED (node_modules not found)"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

# Check if frontend is built
if [[ -d "/opt/skyraksys_hrm/frontend/build" && -f "/opt/skyraksys_hrm/frontend/build/index.html" ]]; then
    log_success "Frontend Build - PASSED"
    ((TESTS_PASSED++))
else
    log_error "Frontend Build - FAILED (build directory or index.html not found)"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

echo "
🚀 PHASE 4: Process Manager Verification
========================================
"

# Check PM2 status
if sudo -u hrm pm2 status > /tmp/pm2_status 2>&1; then
    if grep -q "online" /tmp/pm2_status; then
        log_success "PM2 Application Status - PASSED (Application running)"
        ((TESTS_PASSED++))
    elif grep -q "stopped" /tmp/pm2_status; then
        log_warning "PM2 Application Status - WARNING (Application stopped)"
        ((TESTS_PASSED++))
    else
        log_error "PM2 Application Status - FAILED (No processes found)"
        ((TESTS_FAILED++))
    fi
else
    log_error "PM2 Application Status - FAILED (Cannot access PM2)"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

echo "
🌐 PHASE 5: Web Server Verification
===================================
"

# Test Nginx service
run_test "Nginx Service Status" "sudo systemctl is-active nginx" "active"
run_test "Nginx Configuration Test" "sudo nginx -t" "successful"

# Check if Nginx is listening on port 80
if sudo ss -tulpn | grep -q ":80.*nginx"; then
    log_success "Nginx Port 80 Listening - PASSED"
    ((TESTS_PASSED++))
else
    log_error "Nginx Port 80 Listening - FAILED"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

# Check Nginx configuration file
if [[ -f "/etc/nginx/conf.d/skyraksys_hrm.conf" ]]; then
    log_success "Nginx Configuration File - PASSED"
    ((TESTS_PASSED++))
else
    log_error "Nginx Configuration File - FAILED"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

echo "
🔗 PHASE 6: Connectivity Tests
==============================
"

# Test if backend port is accessible (if app is running)
if sudo ss -tulpn | grep -q ":8080"; then
    log_success "Backend Port 8080 - PASSED (Port is listening)"
    ((TESTS_PASSED++))
    
    # Test backend health endpoint
    run_test "Backend Health Endpoint" "curl -s http://localhost:8080/api/health" ""
else
    log_warning "Backend Port 8080 - WARNING (Not listening - may need to start application)"
    ((TESTS_TOTAL++))
fi
((TESTS_TOTAL++))

# Test frontend access through Nginx
run_test "Frontend Access Test" "curl -s -I http://localhost/" "200 OK"

# Test API proxy through Nginx (if backend is running)
if sudo ss -tulpn | grep -q ":8080"; then
    run_test "API Proxy Test" "curl -s -I http://localhost/api/health" ""
fi

echo "
🔒 PHASE 7: Security & Firewall Check
=====================================
"

# Check firewall status
if sudo firewall-cmd --state 2>/dev/null | grep -q "running"; then
    log_success "Firewall Service - PASSED (Running)"
    ((TESTS_PASSED++))
    
    # Check if HTTP port is open
    if sudo firewall-cmd --list-services | grep -q "http"; then
        log_success "Firewall HTTP Access - PASSED"
        ((TESTS_PASSED++))
    else
        log_error "Firewall HTTP Access - FAILED (HTTP service not allowed)"
        ((TESTS_FAILED++))
    fi
    ((TESTS_TOTAL++))
else
    log_warning "Firewall Service - WARNING (Not running or not installed)"
    ((TESTS_PASSED++))
fi
((TESTS_TOTAL++))

# Check SELinux status
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce)
    if [[ "$SELINUX_STATUS" == "Disabled" || "$SELINUX_STATUS" == "Permissive" ]]; then
        log_success "SELinux Status - PASSED ($SELINUX_STATUS)"
        ((TESTS_PASSED++))
    else
        log_warning "SELinux Status - WARNING (Enforcing - may need additional configuration)"
        ((TESTS_PASSED++))
    fi
else
    log_info "SELinux - Not installed"
fi
((TESTS_TOTAL++))

echo "
📊 PHASE 8: Performance & Resource Check
========================================
"

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [[ $DISK_USAGE -lt 80 ]]; then
    log_success "Disk Space - PASSED (${DISK_USAGE}% used)"
    ((TESTS_PASSED++))
elif [[ $DISK_USAGE -lt 90 ]]; then
    log_warning "Disk Space - WARNING (${DISK_USAGE}% used)"
    ((TESTS_PASSED++))
else
    log_error "Disk Space - FAILED (${DISK_USAGE}% used - critically low)"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [[ $MEMORY_USAGE -lt 80 ]]; then
    log_success "Memory Usage - PASSED (${MEMORY_USAGE}% used)"
    ((TESTS_PASSED++))
elif [[ $MEMORY_USAGE -lt 90 ]]; then
    log_warning "Memory Usage - WARNING (${MEMORY_USAGE}% used)"
    ((TESTS_PASSED++))
else
    log_error "Memory Usage - FAILED (${MEMORY_USAGE}% used - critically high)"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

echo "
🧪 PHASE 9: End-to-End Test (Optional)
======================================
"

# Only run if both frontend and backend are accessible
if curl -s http://localhost/ > /dev/null && curl -s http://localhost:8080/api/health > /dev/null; then
    log_info "Running end-to-end test..."
    
    # Test complete request flow
    if curl -s -H "Accept: application/json" http://localhost/api/health | grep -q "ok\|healthy\|running"; then
        log_success "End-to-End Test - PASSED (Frontend → Nginx → Backend → Response)"
        ((TESTS_PASSED++))
    else
        log_error "End-to-End Test - FAILED (Request flow broken)"
        ((TESTS_FAILED++))
    fi
    ((TESTS_TOTAL++))
else
    log_info "Skipping end-to-end test (frontend or backend not accessible)"
fi

echo "
📋 FINAL REPORT
===============
"

# Calculate success rate
SUCCESS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))

echo -e "Tests Run: ${BLUE}$TESTS_TOTAL${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Success Rate: ${BLUE}${SUCCESS_RATE}%${NC}"

if [[ $SUCCESS_RATE -ge 90 ]]; then
    echo -e "
${GREEN}🎉 EXCELLENT! Your deployment is working great!${NC}
Your SkyrakSys HRM application is ready for production use.
"
    
elif [[ $SUCCESS_RATE -ge 75 ]]; then
    echo -e "
${YELLOW}✅ GOOD! Your deployment is mostly working.${NC}
There are some minor issues that should be addressed, but the core
functionality is working. Check the failed tests above.
"
    
elif [[ $SUCCESS_RATE -ge 50 ]]; then
    echo -e "
${YELLOW}⚠️  PARTIAL! Your deployment has some issues.${NC}
Several components are not working correctly. Please review the
failed tests and follow the troubleshooting guide.
"
    
else
    echo -e "
${RED}❌ CRITICAL! Your deployment has major issues.${NC}
Multiple core components are not working. Please review the installation
process and check the troubleshooting guide.
"
fi

echo "
📚 Next Steps:
"

if [[ $TESTS_FAILED -gt 0 ]]; then
    echo "1. Review failed tests above"
    echo "2. Check the troubleshooting guide: cat redhat/TROUBLESHOOTING.md"
    echo "3. Fix issues and run this script again"
fi

if ! sudo ss -tulpn | grep -q ":8080"; then
    echo "4. Start the application: sudo systemctl start skyraksys-hrm"
fi

echo "5. Access your application at: http://$(hostname -I | awk '{print $1}')"
echo "6. Default login: admin@skyraksys.com / admin123"
echo "7. Monitor logs: sudo -u hrm pm2 logs"

# Cleanup temp files
rm -f /tmp/test_output /tmp/pm2_status

echo "
For detailed help, see:
- Installation Guide: redhat/INSTALLATION_GUIDE.md
- Beginner Guide: redhat/BEGINNER_GUIDE.md
- Troubleshooting: redhat/TROUBLESHOOTING.md
"

exit 0
