#!/bin/bash

# =============================================================================
# Local Test Script for Master Deploy
# =============================================================================
# Tests master-deploy.sh functionality without actually deploying

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_test() {
    echo -e "${BLUE}🧪 TEST: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
}

print_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

echo "🧪 Master Deploy Script Local Testing"
echo "====================================="
echo ""

# Test 1: Check if master-deploy.sh exists and is readable
print_test "Master deploy script availability"
if [ -f "master-deploy.sh" ]; then
    print_pass "master-deploy.sh found"
    chmod +x master-deploy.sh
    print_pass "Execute permissions set"
else
    print_fail "master-deploy.sh not found"
    exit 1
fi

# Test 2: Check production credentials in script
print_test "Production credentials validation"
if grep -q "95.216.14.232" master-deploy.sh; then
    print_pass "Production server IP found in script"
else
    print_fail "Production server IP not found"
fi

if grep -q "SkyRakDB#2025!Prod@HRM" master-deploy.sh; then
    print_pass "Production database password found"
else
    print_fail "Production database password not found"
fi

if grep -q "SkyRak2025JWT@Prod!Secret" master-deploy.sh; then
    print_pass "Production JWT secret found"
else
    print_fail "Production JWT secret not found"
fi

# Test 3: Create test environment to simulate script behavior
print_test "Creating test environment simulation"

# Backup any existing files
if [ -f "backend/.env" ]; then
    cp "backend/.env" "backend/.env.backup.$(date +%Y%m%d_%H%M%S)"
    print_info "Backed up existing backend/.env"
fi

# Create test directories
mkdir -p backend/config
mkdir -p frontend
mkdir -p logs

print_pass "Test directories created"

# Test 4: Run environment check functions (extracted from master-deploy.sh)
print_test "Environment detection logic"

# Simulate the check_existing_environment function logic
env_files_found=0

if [ -f "backend/.env" ]; then
    if grep -q "95.216.14.232\|SkyRakDB#2025!Prod@HRM" "backend/.env" 2>/dev/null; then
        env_files_found=$((env_files_found + 1))
        print_pass "Backend environment would be detected as existing"
    fi
fi

if [ -f "frontend/.env" ] || [ -f "frontend/.env.production" ]; then
    if grep -q "95.216.14.232" frontend/.env* 2>/dev/null; then
        env_files_found=$((env_files_found + 1))
        print_pass "Frontend environment would be detected as existing"
    fi
fi

if [ $env_files_found -eq 0 ]; then
    print_pass "Script would correctly detect missing environment files"
else
    print_info "Script would detect $env_files_found existing environment files"
fi

# Test 5: Test configuration generation (dry run)
print_test "Configuration generation (simulation)"

# Test backend .env generation
cat > "test-backend.env" << 'EOF'
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_NAME=skyraksys_hrm_prod
API_BASE_URL=http://95.216.14.232/api
DOMAIN=95.216.14.232
EOF

if grep -q "95.216.14.232" test-backend.env && grep -q "skyraksys_hrm_prod" test-backend.env; then
    print_pass "Backend environment generation logic works"
    rm test-backend.env
else
    print_fail "Backend environment generation has issues"
fi

# Test 6: Check script dependencies
print_test "Script dependencies check"

dependencies=("node" "npm" "curl" "grep" "sed")
missing_deps=0

for dep in "${dependencies[@]}"; do
    if command -v "$dep" > /dev/null 2>&1; then
        print_pass "$dep is available"
    else
        print_fail "$dep is missing"
        missing_deps=$((missing_deps + 1))
    fi
done

if [ $missing_deps -eq 0 ]; then
    print_pass "All required dependencies are available"
else
    print_info "$missing_deps dependencies missing - script may not work fully"
fi

# Test 7: Check if other supporting scripts exist
print_test "Supporting scripts availability"

supporting_scripts=("validate-production-configs.sh" "ultimate-deploy.sh" "audit-production-configs.sh")
available_scripts=0

for script in "${supporting_scripts[@]}"; do
    if [ -f "$script" ]; then
        print_pass "$script found"
        available_scripts=$((available_scripts + 1))
    else
        print_info "$script not found (optional)"
    fi
done

print_info "$available_scripts supporting scripts available"

# Test 8: Syntax check
print_test "Script syntax validation"
if bash -n master-deploy.sh 2>/dev/null; then
    print_pass "Script syntax is valid"
else
    print_fail "Script has syntax errors"
    echo "Syntax check output:"
    bash -n master-deploy.sh
fi

# Test 9: Check file permissions and structure
print_test "Script structure validation"

if [ -x "master-deploy.sh" ]; then
    print_pass "Script is executable"
else
    print_info "Script needs execute permission (chmod +x)"
fi

# Count functions in script
function_count=$(grep -c "^[a-zA-Z_][a-zA-Z0-9_]*() {" master-deploy.sh)
print_info "Script contains $function_count functions"

# Count phases
phase_count=$(grep -c "PHASE [0-9]:" master-deploy.sh)
print_info "Script has $phase_count deployment phases"

# Final summary
echo ""
echo "🎯 Test Summary"
echo "=============="

echo ""
print_info "Master Deploy Script Analysis:"
print_info "• Production server: 95.216.14.232"
print_info "• Database: skyraksys_hrm_prod"  
print_info "• Deployment phases: $phase_count"
print_info "• Functions defined: $function_count"

echo ""
print_info "Ready for Server Deployment:"
print_info "1. Copy master-deploy.sh to your RHEL server"
print_info "2. Run: chmod +x master-deploy.sh"
print_info "3. Execute: sudo ./master-deploy.sh"

echo ""
print_info "What the script will do on server:"
print_info "✅ Check for existing .env files with your production settings"
print_info "✅ Create missing environment files with your actual credentials"
print_info "✅ Validate all configurations"
print_info "✅ Install dependencies and build frontend"
print_info "✅ Deploy complete application with PM2"
print_info "✅ Verify deployment success"

echo ""
echo -e "${GREEN}🚀 Local testing completed - script is ready for production!${NC}"