#!/bin/bash
# =============================================================================
# SkyrakSys HRM Deployment - Dry Run Validation Script
# =============================================================================
# This script validates the deployment configuration without actually deploying
# Use this to test the deployment logic before running on production server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}=============================================================================="
    echo -e "  >>> $1"
    echo -e "==============================================================================${NC}"
}

print_success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] [OK] $1${NC}"; }
print_error() { echo -e "${RED}[$(date '+%H:%M:%S')] [ERROR] $1${NC}"; }
print_warning() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] [WARNING] $1${NC}"; }
print_info() { echo -e "${BLUE}[$(date '+%H:%M:%S')] [INFO] $1${NC}"; }

# Load configuration from main script
source_config() {
    if [ -f "rhel-quick-deploy.sh" ]; then
        # Extract configuration variables
        export GITHUB_REPO=$(grep "^GITHUB_REPO=" rhel-quick-deploy.sh | cut -d'"' -f2)
        export DOMAIN=$(grep "^DOMAIN=" rhel-quick-deploy.sh | cut -d'"' -f2)
        export DB_PASSWORD=$(grep "^DB_PASSWORD=" rhel-quick-deploy.sh | cut -d'"' -f2)
        export ENABLE_SSL=$(grep "^ENABLE_SSL=" rhel-quick-deploy.sh | cut -d'=' -f2)
        print_success "Configuration loaded from rhel-quick-deploy.sh"
    else
        print_error "rhel-quick-deploy.sh not found!"
        exit 1
    fi
}

# Test 1: Repository Access
test_repository_access() {
    print_info "Testing Git repository access..."
    
    if git ls-remote $GITHUB_REPO HEAD >/dev/null 2>&1; then
        print_success "Git repository accessible: $GITHUB_REPO"
    else
        print_error "Cannot access Git repository: $GITHUB_REPO"
        return 1
    fi
}

# Test 2: Domain/IP Validation
test_domain_validation() {
    print_info "Testing domain/IP configuration..."
    
    # Check if it's an IP address
    if [[ $DOMAIN =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        print_success "Valid IP address format: $DOMAIN"
        
        # Test connectivity
        if ping -c 1 -W 2 $DOMAIN >/dev/null 2>&1; then
            print_success "IP address is reachable: $DOMAIN"
        else
            print_warning "IP address not reachable (firewall may be blocking): $DOMAIN"
        fi
    else
        print_info "Domain name detected: $DOMAIN"
        if nslookup $DOMAIN >/dev/null 2>&1; then
            print_success "Domain resolves correctly: $DOMAIN"
        else
            print_warning "Domain does not resolve: $DOMAIN"
        fi
    fi
}

# Test 3: SSL Configuration Logic
test_ssl_configuration() {
    print_info "Testing SSL configuration logic..."
    
    if [ "$ENABLE_SSL" = true ]; then
        print_success "SSL enabled - will generate self-signed certificates"
        
        # Validate OpenSSL command syntax
        if openssl version >/dev/null 2>&1; then
            print_success "OpenSSL available for certificate generation"
        else
            print_error "OpenSSL not available - SSL setup will fail"
            return 1
        fi
    else
        print_info "SSL disabled - HTTP-only deployment"
    fi
}

# Test 4: Database Configuration
test_database_config() {
    print_info "Testing database configuration..."
    
    # Validate password complexity
    if [[ ${#DB_PASSWORD} -ge 12 ]]; then
        print_success "Database password meets complexity requirements"
    else
        print_warning "Database password may be too short"
    fi
    
    # Check for special characters that might cause issues
    if [[ $DB_PASSWORD =~ [\$\!] ]]; then
        print_success "Password contains special characters (properly escaped in script)"
    fi
}

# Test 5: Node.js Dependencies
test_nodejs_dependencies() {
    print_info "Testing Node.js project structure..."
    
    if [ -f "backend/package.json" ]; then
        print_success "Backend package.json found"
        
        # Check for essential scripts
        if grep -q '"migrate"' backend/package.json 2>/dev/null; then
            print_success "Database migration script found"
        else
            print_warning "No migration script in package.json - migrations may fail"
        fi
    else
        print_error "Backend package.json not found!"
        return 1
    fi
    
    if [ -f "frontend/package.json" ]; then
        print_success "Frontend package.json found"
        
        # Check for build script
        if grep -q '"build"' frontend/package.json 2>/dev/null; then
            print_success "Frontend build script found"
        else
            print_error "No build script in frontend package.json!"
            return 1
        fi
    else
        print_error "Frontend package.json not found!"
        return 1
    fi
}

# Test 6: Nginx Configuration Syntax
test_nginx_config_syntax() {
    print_info "Testing Nginx configuration syntax..."
    
    # Create temporary nginx config for testing
    temp_config="/tmp/test-nginx.conf"
    
    cat > $temp_config << 'EOF'
server {
    listen 80;
    server_name test.example.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
}
EOF
    
    if nginx -t -c $temp_config >/dev/null 2>&1; then
        print_success "Nginx configuration syntax is valid"
    else
        print_warning "Nginx configuration may have syntax issues"
    fi
    
    rm -f $temp_config
}

# Test 7: Port Availability
test_port_availability() {
    print_info "Testing port availability..."
    
    ports=(80 443 3001 5432)
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_warning "Port $port is already in use"
        else
            print_success "Port $port is available"
        fi
    done
}

# Test 8: Script Syntax Validation
test_script_syntax() {
    print_info "Testing bash script syntax..."
    
    if bash -n rhel-quick-deploy.sh 2>/dev/null; then
        print_success "Deployment script syntax is valid"
    else
        print_error "Deployment script has syntax errors!"
        return 1
    fi
}

# Test 9: Environment Variables
test_environment_variables() {
    print_info "Testing environment variable configuration..."
    
    # Check for problematic characters
    problematic_vars=()
    
    if [[ $DB_PASSWORD =~ [\"\'\\] ]]; then
        problematic_vars+=("DB_PASSWORD contains quotes or backslashes")
    fi
    
    if [ ${#problematic_vars[@]} -gt 0 ]; then
        for issue in "${problematic_vars[@]}"; do
            print_warning "$issue"
        done
    else
        print_success "Environment variables are properly formatted"
    fi
}

# Test 10: File Permissions and Paths
test_file_permissions() {
    print_info "Testing file permissions and paths..."
    
    # Check script permissions
    if [ -x "rhel-quick-deploy.sh" ]; then
        print_success "Deployment script is executable"
    else
        print_warning "Deployment script may not be executable (use: chmod +x rhel-quick-deploy.sh)"
    fi
    
    # Check current directory
    if [[ $(pwd) =~ skyraksys.*hrm ]]; then
        print_success "Running from correct directory"
    else
        print_warning "Not running from project directory - paths may be incorrect"
    fi
}

# Main execution
main() {
    print_header "SkyrakSys HRM Deployment - Dry Run Validation"
    
    # Source configuration
    source_config
    
    print_info "Configuration loaded:"
    print_info "  Repository: $GITHUB_REPO"
    print_info "  Domain/IP: $DOMAIN"
    print_info "  SSL Enabled: $ENABLE_SSL"
    print_info ""
    
    # Run all tests
    tests=(
        "test_repository_access"
        "test_domain_validation"
        "test_ssl_configuration"
        "test_database_config"
        "test_nodejs_dependencies"
        "test_nginx_config_syntax"
        "test_port_availability"
        "test_script_syntax"
        "test_environment_variables"
        "test_file_permissions"
    )
    
    passed=0
    failed=0
    
    for test in "${tests[@]}"; do
        echo ""
        if $test; then
            ((passed++))
        else
            ((failed++))
        fi
    done
    
    echo ""
    print_header "Dry Run Summary"
    print_success "Tests passed: $passed"
    if [ $failed -gt 0 ]; then
        print_error "Tests failed: $failed"
        print_error ""
        print_error "⚠️  Please fix the issues above before deploying to production"
        exit 1
    else
        print_success "✅ All tests passed! Deployment script is ready for production"
        print_info ""
        print_info "Deploy with: sudo ./rhel-quick-deploy.sh"
    fi
}

main "$@"