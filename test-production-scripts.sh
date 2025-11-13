#!/bin/bash
# ==============================================
# Script Validation and Testing Tool
# ==============================================
# Purpose: Test production deployment scripts for syntax and logic errors
# Usage: ./test-production-scripts.sh
# ==============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
test_start() {
    ((TESTS_TOTAL++))
    echo -e "${BLUE}[TEST $TESTS_TOTAL]${NC} $1..."
}

test_pass() {
    ((TESTS_PASSED++))
    echo -e "${GREEN}✓ PASS:${NC} $1"
}

test_fail() {
    ((TESTS_FAILED++))
    echo -e "${RED}✗ FAIL:${NC} $1"
}

test_skip() {
    echo -e "${YELLOW}⚠ SKIP:${NC} $1"
}

# Test 1: Check script syntax
test_script_syntax() {
    test_start "Script syntax validation"
    
    local scripts_to_test=(
        "deploy-production-migrations.sh"
        "deploy-production-migrations-linux.sh"
        "scripts/verify-field-mappings.js"
        "scripts/production/production-migration-runner.js"
    )
    
    local syntax_errors=0
    
    for script in "${scripts_to_test[@]}"; do
        if [[ -f "$script" ]]; then
            if [[ "$script" == *.sh ]]; then
                if bash -n "$script" 2>/dev/null; then
                    echo "  ✓ $script syntax OK"
                else
                    echo "  ✗ $script syntax ERROR"
                    ((syntax_errors++))
                fi
            elif [[ "$script" == *.js ]]; then
                if node --check "$script" 2>/dev/null; then
                    echo "  ✓ $script syntax OK"
                else
                    echo "  ✗ $script syntax ERROR"
                    ((syntax_errors++))
                fi
            fi
        else
            echo "  ⚠ $script not found"
            ((syntax_errors++))
        fi
    done
    
    if [[ $syntax_errors -eq 0 ]]; then
        test_pass "All scripts have valid syntax"
    else
        test_fail "$syntax_errors scripts have syntax errors"
    fi
}

# Test 2: Check required files exist
test_required_files() {
    test_start "Required files existence"
    
    local required_files=(
        "package.json"
        "backend/package.json"
        "backend/config/config.js"
        "scripts/verify-field-mappings.js"
        "scripts/production/production-migration-runner.js"
        "deploy-production-migrations-linux.sh"
    )
    
    local missing_files=0
    
    for file in "${required_files[@]}"; do
        if [[ -f "$file" ]]; then
            echo "  ✓ $file exists"
        else
            echo "  ✗ $file missing"
            ((missing_files++))
        fi
    done
    
    if [[ $missing_files -eq 0 ]]; then
        test_pass "All required files exist"
    else
        test_fail "$missing_files required files are missing"
    fi
}

# Test 3: Check Node.js and dependencies
test_nodejs_environment() {
    test_start "Node.js environment validation"
    
    if ! command -v node &> /dev/null; then
        test_fail "Node.js not installed"
        return
    fi
    
    local node_version
    node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    
    if [[ $node_version -ge 16 ]]; then
        echo "  ✓ Node.js version: $(node --version)"
        test_pass "Node.js version requirement met"
    else
        test_fail "Node.js version too old: $(node --version). Required: 16+"
    fi
}

# Test 4: Check backend dependencies
test_backend_dependencies() {
    test_start "Backend dependencies validation"
    
    if [[ ! -d "backend/node_modules" ]]; then
        test_skip "Backend dependencies not installed (run 'cd backend && npm install')"
        return
    fi
    
    local required_packages=(
        "sequelize"
        "sequelize-cli"
        "pg"
        "dotenv"
    )
    
    local missing_packages=0
    
    cd backend
    for package in "${required_packages[@]}"; do
        if npm list "$package" &> /dev/null; then
            echo "  ✓ $package installed"
        else
            echo "  ✗ $package missing"
            ((missing_packages++))
        fi
    done
    cd ..
    
    if [[ $missing_packages -eq 0 ]]; then
        test_pass "All required packages are installed"
    else
        test_fail "$missing_packages required packages are missing"
    fi
}

# Test 5: Test script help functions
test_script_help() {
    test_start "Script help function validation"
    
    local scripts_with_help=(
        "deploy-production-migrations-linux.sh"
        "scripts/production/production-migration-runner.js"
    )
    
    local help_errors=0
    
    for script in "${scripts_with_help[@]}"; do
        if [[ -f "$script" ]]; then
            if [[ "$script" == *.sh ]]; then
                if bash "$script" --help &> /dev/null; then
                    echo "  ✓ $script --help works"
                else
                    echo "  ✗ $script --help failed"
                    ((help_errors++))
                fi
            elif [[ "$script" == *.js ]]; then
                if node "$script" --help &> /dev/null; then
                    echo "  ✓ $script --help works"
                else
                    echo "  ✗ $script --help failed"
                    ((help_errors++))
                fi
            fi
        else
            echo "  ⚠ $script not found"
            ((help_errors++))
        fi
    done
    
    if [[ $help_errors -eq 0 ]]; then
        test_pass "All script help functions work"
    else
        test_fail "$help_errors scripts have broken help functions"
    fi
}

# Test 6: Check script permissions
test_script_permissions() {
    test_start "Script permissions validation"
    
    local shell_scripts=(
        "deploy-production-migrations.sh"
        "deploy-production-migrations-linux.sh"
    )
    
    local permission_errors=0
    
    for script in "${shell_scripts[@]}"; do
        if [[ -f "$script" ]]; then
            if [[ -x "$script" ]]; then
                echo "  ✓ $script is executable"
            else
                echo "  ⚠ $script not executable (will fix)"
                chmod +x "$script"
                echo "  ✓ $script made executable"
            fi
        else
            echo "  ⚠ $script not found"
            ((permission_errors++))
        fi
    done
    
    if [[ $permission_errors -eq 0 ]]; then
        test_pass "Script permissions are correct"
    else
        test_fail "$permission_errors scripts have permission issues"
    fi
}

# Test 7: Test dry-run functionality
test_dry_run() {
    test_start "Dry-run functionality validation"
    
    # Test Node.js migration runner
    if [[ -f "scripts/production/production-migration-runner.js" ]]; then
        echo "  Testing Node.js migration runner dry-run..."
        if timeout 30 node scripts/production/production-migration-runner.js --dry-run 2>&1 | grep -q "DRY RUN MODE"; then
            echo "  ✓ Node.js runner dry-run works"
        else
            echo "  ✗ Node.js runner dry-run failed"
            test_fail "Dry-run functionality has issues"
            return
        fi
    fi
    
    test_pass "Dry-run functionality works"
}

# Test 8: Check field verification script
test_field_verification() {
    test_start "Field verification script validation"
    
    if [[ -f "scripts/verify-field-mappings.js" ]]; then
        echo "  Testing field verification script..."
        # Run with timeout to prevent hanging
        if timeout 60 node scripts/verify-field-mappings.js 2>&1 | grep -q "Field Mapping Verification"; then
            echo "  ✓ Field verification script executes"
            test_pass "Field verification script works"
        else
            echo "  ✗ Field verification script failed or timed out"
            test_fail "Field verification script has issues"
        fi
    else
        test_fail "Field verification script not found"
    fi
}

# Test 9: Check RedHat production scripts compatibility
test_redhat_compatibility() {
    test_start "RedHat production scripts compatibility"
    
    local redhat_scripts=(
        "redhatprod/scripts/deploy.sh"
        "redhatprod/scripts/03_migrate_and_seed_production.sh"
    )
    
    local compatibility_issues=0
    
    for script in "${redhat_scripts[@]}"; do
        if [[ -f "$script" ]]; then
            if bash -n "$script" 2>/dev/null; then
                echo "  ✓ $script syntax compatible"
            else
                echo "  ✗ $script syntax issues"
                ((compatibility_issues++))
            fi
        else
            echo "  ⚠ $script not found"
        fi
    done
    
    if [[ $compatibility_issues -eq 0 ]]; then
        test_pass "RedHat scripts are compatible"
    else
        test_fail "$compatibility_issues RedHat scripts have issues"
    fi
}

# Test 10: Check environment template
test_environment_template() {
    test_start "Environment configuration validation"
    
    local env_files=(
        ".env.example"
        ".env.production.example"
        "backend/.env.example"
    )
    
    local env_issues=0
    
    for env_file in "${env_files[@]}"; do
        if [[ -f "$env_file" ]]; then
            if grep -q "DB_HOST\|DB_NAME\|DB_USER\|DB_PASSWORD" "$env_file"; then
                echo "  ✓ $env_file has required DB variables"
            else
                echo "  ✗ $env_file missing required DB variables"
                ((env_issues++))
            fi
        else
            echo "  ⚠ $env_file not found (optional)"
        fi
    done
    
    if [[ $env_issues -eq 0 ]]; then
        test_pass "Environment templates are valid"
    else
        test_fail "$env_issues environment templates have issues"
    fi
}

# Main execution
main() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}Production Scripts Validation Test Suite${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo
    
    # Run all tests
    test_script_syntax
    test_required_files
    test_nodejs_environment
    test_backend_dependencies
    test_script_help
    test_script_permissions
    test_dry_run
    test_field_verification
    test_redhat_compatibility
    test_environment_template
    
    # Summary
    echo
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}Test Results Summary${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo -e "Total Tests: ${TESTS_TOTAL}"
    echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
    echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
    echo
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! Scripts are ready for production.${NC}"
        exit 0
    else
        echo -e "${RED}❌ $TESTS_FAILED TESTS FAILED! Please fix issues before production deployment.${NC}"
        exit 1
    fi
}

# Execute main with all arguments
main "$@"