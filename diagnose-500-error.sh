#!/bin/bash

# =============================================================================
# 🔍 Quick Diagnosis Script for 500 Error on Login API
# =============================================================================

set -euo pipefail

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

print_header() {
    echo -e "${BLUE}=============================================================================="
    echo "  🔍 $1"
    echo "==============================================================================${NC}"
}

print_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check if backend is running
check_backend_status() {
    print_header "Backend Status Check"
    
    # Check if process is running on port 8080
    print_info "Checking if backend is running on port 8080..."
    if netstat -an | findstr "8080" > /dev/null 2>&1; then
        print_success "Backend process found on port 8080"
    else
        print_error "No process found on port 8080"
        print_info "You may need to start the backend: cd backend && npm start"
    fi
    
    # Test health endpoint
    print_info "Testing backend health endpoint..."
    curl -s http://localhost:8080/api/health > temp_health.json 2>/dev/null || echo '{"error": "no_response"}' > temp_health.json
    
    if grep -q '"status".*"OK"' temp_health.json; then
        print_success "Backend health endpoint responding"
    else
        print_error "Backend health endpoint not responding"
        cat temp_health.json
    fi
    
    rm -f temp_health.json
}

# Test login API specifically
test_login_api() {
    print_header "Login API Diagnosis"
    
    print_info "Testing login API with empty payload..."
    curl -s -X POST http://localhost:8080/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{}' > temp_login.json 2>/dev/null || echo '{"error": "connection_failed"}' > temp_login.json
    
    if grep -q '"message".*"required"' temp_login.json; then
        print_success "Login API responding with validation errors (expected)"
    elif grep -q 'lockedAt.*does not exist' temp_login.json; then
        print_error "Database schema issue: lockedAt column missing"
    elif grep -q 'loginAttempts.*does not exist' temp_login.json; then
        print_error "Database schema issue: loginAttempts column missing"
    elif grep -q 'connection_failed' temp_login.json; then
        print_error "Cannot connect to login API"
    else
        print_warning "Unknown response from login API:"
        cat temp_login.json | head -5
    fi
    
    rm -f temp_login.json
}

# Check database connection
check_database_connection() {
    print_header "Database Connection Check"
    
    # Check if PostgreSQL is running
    print_info "Checking PostgreSQL service..."
    if sc query postgresql | findstr "RUNNING" > /dev/null 2>&1; then
        print_success "PostgreSQL service is running"
    else
        print_warning "PostgreSQL service status unclear"
    fi
    
    # Check database connectivity (if credentials available)
    if [[ ! -z "${DB_PASSWORD:-}" ]]; then
        print_info "Testing database connection..."
        PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "${DB_USER:-postgres}" -d "${DB_NAME:-skyraksys_hrm}" -c "SELECT version();" > /dev/null 2>&1
        if [[ $? -eq 0 ]]; then
            print_success "Database connection successful"
        else
            print_error "Database connection failed"
        fi
    else
        print_info "DB_PASSWORD not set, skipping database connection test"
    fi
}

# Check environment configuration
check_environment() {
    print_header "Environment Configuration Check"
    
    cd "d:/skyraksys_hrm1/skyraksys_hrm_app/backend" || { print_error "Backend directory not found"; exit 1; }
    
    print_info "Current directory: $(pwd)"
    print_info "NODE_ENV: ${NODE_ENV:-not_set}"
    print_info "DB_NAME: ${DB_NAME:-not_set}"
    print_info "DB_USER: ${DB_USER:-not_set}"
    print_info "JWT_SECRET: ${JWT_SECRET:+set}" # Only show if set
    
    if [[ -f ".env" ]]; then
        print_success ".env file found"
        print_info "Environment variables from .env:"
        grep -E "^(NODE_ENV|DB_NAME|DB_USER|JWT_SECRET)=" .env 2>/dev/null || print_info "No key variables found in .env"
    else
        print_warning "No .env file found in backend directory"
        print_info "You may need to create .env file from .env.example"
    fi
}

# Check User model columns
check_user_model() {
    print_header "User Model Schema Check"
    
    if [[ ! -z "${DB_PASSWORD:-}" ]]; then
        print_info "Checking User table columns..."
        PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "${DB_USER:-postgres}" -d "${DB_NAME:-skyraksys_hrm}" -c "
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position;" 2>/dev/null || print_error "Could not query User table schema"
    else
        print_info "Cannot check User table schema without DB_PASSWORD"
    fi
}

# Main execution
main() {
    print_header "🔍 SkyrakSys HRM - 500 Error Diagnosis"
    echo ""
    
    check_backend_status
    echo ""
    
    test_login_api
    echo ""
    
    check_database_connection
    echo ""
    
    check_environment
    echo ""
    
    check_user_model
    echo ""
    
    print_header "Diagnosis Complete"
    print_info "Check the output above for specific issues to address"
    print_info "Common fixes:"
    print_info "  1. Start backend: cd backend && npm install && npm start"
    print_info "  2. Create .env file: cp .env.example .env (and configure)"
    print_info "  3. Run database migration: npm run migrate"
    print_info "  4. Check PostgreSQL service is running"
}

# Export environment variables if provided
if [[ -f "d:/skyraksys_hrm1/skyraksys_hrm_app/backend/.env" ]]; then
    source "d:/skyraksys_hrm1/skyraksys_hrm_app/backend/.env" 2>/dev/null || true
fi

main "$@"