#!/bin/bash

# Quick Configuration Management System Test
# Tests all scripts locally before production deployment

echo "🧪 Quick Configuration Management Test"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m' 
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_test() {
    echo -e "${BLUE}Testing: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
}

print_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}⚠️ WARN: $1${NC}"
}

TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNED=0

# Test 1: Check script files exist
print_test "Configuration management scripts"
REQUIRED_SCRIPTS=(
    "validate-production-configs.sh"
    "generate-production-configs.sh" 
    "ultimate-deploy.sh"
    "deploy-production.sh"
    "audit-production-configs.sh"
    "setup-local-testing.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        print_pass "Found $script"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_fail "Missing $script"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
done

# Test 2: Check production credentials are located
print_test "Production credentials and server details"

if grep -q "95.216.14.232" rhel-deployment-guide.sh 2>/dev/null; then
    print_pass "Production server IP (95.216.14.232) located"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_warn "Production server IP not found in deployment guides"
    TESTS_WARNED=$((TESTS_WARNED + 1))
fi

if grep -q "SkyRakDB#2025!Prod@HRM" redhatprod/scripts/00_generate_configs.sh 2>/dev/null; then
    print_pass "Production database password located"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_fail "Production database password not found"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if grep -q "SkyRak2025JWT@Prod!Secret" redhatprod/scripts/00_generate_configs.sh 2>/dev/null; then
    print_pass "Production JWT secret located"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_fail "Production JWT secret not found"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 3: Check template files
print_test "Configuration templates"

if [ -f ".env.production.template" ]; then
    ENV_VARS=$(grep -c '^[A-Z_].*=' .env.production.template 2>/dev/null || echo 0)
    if [ "$ENV_VARS" -gt 20 ]; then
        print_pass "Environment template has $ENV_VARS variables"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_warn "Environment template has only $ENV_VARS variables"
        TESTS_WARNED=$((TESTS_WARNED + 1))
    fi
else
    print_fail "Environment template not found"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

if [ -f "redhatprod/configs/nginx-hrm.conf" ]; then
    print_pass "Nginx configuration template found"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_warn "Nginx configuration template not found"
    TESTS_WARNED=$((TESTS_WARNED + 1))
fi

if [ -f "ecosystem.config.js" ]; then
    print_pass "PM2 ecosystem configuration found"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_warn "PM2 ecosystem configuration not found"
    TESTS_WARNED=$((TESTS_WARNED + 1))
fi

# Test 4: Script executability and syntax
print_test "Script executability and syntax"

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        # Make executable
        chmod +x "$script" 2>/dev/null
        
        if [ -x "$script" ]; then
            # Basic syntax check (if it's a bash script)
            if head -1 "$script" | grep -q "#!/bin/bash"; then
                if bash -n "$script" 2>/dev/null; then
                    print_pass "$script syntax valid"
                    TESTS_PASSED=$((TESTS_PASSED + 1))
                else
                    print_fail "$script has syntax errors"
                    TESTS_FAILED=$((TESTS_FAILED + 1))
                fi
            else
                print_pass "$script is executable"
                TESTS_PASSED=$((TESTS_PASSED + 1))
            fi
        else
            print_fail "$script not executable"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    fi
done

# Test 5: Integration check
print_test "Integration with ultimate-deploy.sh"

if grep -q "validate-production-configs.sh" ultimate-deploy.sh 2>/dev/null; then
    print_pass "Validation integrated into deployment script"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_fail "Validation not integrated into deployment script"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Summary
echo ""
echo "🧪 Test Summary"
echo "==============="
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${YELLOW}⚠️  Warned: $TESTS_WARNED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run './setup-local-testing.sh' to create test environment"
    echo "2. Test locally with './test-validate-configs.sh' (after setup)"
    echo "3. Deploy to production with './sync-to-production.sh'"
    echo ""
    echo "Production deployment:"
    echo "• SSH: ssh root@95.216.14.232"
    echo "• Path: cd /opt/skyraksys-hrm"
    echo "• Deploy: ./deploy-production.sh"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix issues before proceeding.${NC}"
    echo ""
    echo "Common fixes:"
    echo "• Missing scripts: Check if files were created properly"
    echo "• Syntax errors: Review script contents for typos"
    echo "• Missing templates: Verify redhatprod/configs/ directory"
    exit 1
fi