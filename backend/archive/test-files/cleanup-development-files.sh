#!/bin/bash

# ================================================================
# SkyRakSys HRM - Development Files Cleanup Script
# ================================================================
# This script moves development, testing, and temporary files
# to the archive directory to clean up the root folder
# ================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Create archive subdirectories
log $BLUE "Creating archive directory structure..."
mkdir -p archive/development-scripts
mkdir -p archive/test-files
mkdir -p archive/documentation-reports
mkdir -p archive/performance-tests
mkdir -p archive/debug-scripts
mkdir -p archive/integration-tests
mkdir -p archive/api-tests
mkdir -p archive/validation-tests
mkdir -p archive/completion-reports
mkdir -p archive/temp-scripts

log $GREEN "✅ Archive directories created"

# Move development and debug scripts
log $BLUE "Moving development and debug scripts..."
files_to_move=(
    "browser-performance-test.js"
    "check-metadata.js"
    "check-users-actual.js"
    "check-users.js"
    "cleanup-for-production.js"
    "create-performance-indexes.js"
    "create-project-data.js"
    "create-test-project-data.js"
    "debug-auth-step-by-step.js"
    "debug-backend-validation.js"
    "debug-employee-validation.js"
    "debug-validation-errors.js"
    "PRODUCTION_CLEANUP_COMPLETE.js"
    "PORT_FIX_APPLIED.js"
    "setup-test-data-complete.js"
    "quick-user-check.js"
    "validation-test-utils.js"
)

for file in "${files_to_move[@]}"; do
    if [[ -f "$file" ]]; then
        mv "$file" archive/development-scripts/
        log $GREEN "✅ Moved $file"
    fi
done

# Move test files
log $BLUE "Moving test files..."
test_files=(
    "complete-integration-test.js"
    "comprehensive-api-test-suite.js"
    "comprehensive-business-review.js"
    "comprehensive-field-coverage-test.js"
    "comprehensive-integration-test.js"
    "comprehensive-system-validation.js"
    "field-consistency-test.js"
    "final-business-assessment.js"
    "FINAL-INTEGRATION-REPORT.js"
    "fixed-api-test-suite.js"
    "frontend-performance-test.js"
    "frontend-ui-comprehensive-test.js"
    "integration-review.js"
    "lazy-loading-test.js"
    "phase3-security-test.js"
    "quick-api-test.js"
    "simple-api-test.js"
    "simple-fresh-auth-test.js"
    "simple-validation-test.js"
    "test-correct-endpoints.js"
    "test-frontend-backend-validation.js"
    "test-runner.js"
    "test-salary-integration.js"
    "workflow-test-suite.js"
    "USER_TESTING_GUIDE.js"
)

for file in "${test_files[@]}"; do
    if [[ -f "$file" ]]; then
        mv "$file" archive/test-files/
        log $GREEN "✅ Moved $file"
    fi
done

# Move API test files
log $BLUE "Moving API test related files..."
api_test_files=(
    "run-api-test-manager.bat"
    "run-api-tests.bat"
    "run-tests.bat"
    "test-config.json"
    "test-results.json"
    "test_output.txt"
)

for file in "${api_test_files[@]}"; do
    if [[ -f "$file" ]]; then
        mv "$file" archive/api-tests/
        log $GREEN "✅ Moved $file"
    fi
done

# Move documentation and reports
log $BLUE "Moving documentation and completion reports..."
doc_files=(
    "API_TEST_RESULTS_SUMMARY.md"
    "API_TEST_SUITE_DOCUMENTATION.md"
    "COMPREHENSIVE_CODE_REVIEW_REPORT.md"
    "FIELD_CONSISTENCY_ANALYSIS.md"
    "FIELD_CONSISTENCY_FIXES_COMPLETE.md"
    "FINAL_BUSINESS_REVIEW_SUMMARY.json"
    "FRONTEND_OPTIMIZATION_TESTING_GUIDE.md"
    "FRONTEND_VALIDATION_COMPLETION_REPORT.md"
    "IMMEDIATE_FIXES_IMPLEMENTATION_GUIDE.md"
    "MANUAL_UI_TESTING_GUIDE.md"
    "MISSION_COMPLETE.md"
    "PHASE_2_COMPLETION_REPORT.md"
    "PHASE_3_COMPLETION_REPORT.md"
    "PHASE_4_COMPLETION_REPORT.md"
    "PHASE_4_FRONTEND_OPTIMIZATION_COMPLETE.md"
    "PHASE_4_PERFORMANCE_PLAN.md"
    "TEST_ORGANIZATION_COMPLETE.md"
)

for file in "${doc_files[@]}"; do
    if [[ -f "$file" ]]; then
        mv "$file" archive/documentation-reports/
        log $GREEN "✅ Moved $file"
    fi
done

# Move directories that are development-related
log $BLUE "Moving development directories..."
if [[ -d "test-results" ]]; then
    mv test-results archive/
    log $GREEN "✅ Moved test-results directory"
fi

if [[ -d "test-screenshots" ]]; then
    mv test-screenshots archive/
    log $GREEN "✅ Moved test-screenshots directory"
fi

# Move temporary development scripts
log $BLUE "Moving temporary scripts..."
temp_scripts=(
    "setup-postgresql.bat"
)

for file in "${temp_scripts[@]}"; do
    if [[ -f "$file" ]]; then
        mv "$file" archive/temp-scripts/
        log $GREEN "✅ Moved $file"
    fi
done

# Create a summary of what was archived
log $BLUE "Creating archive summary..."
cat > archive/CLEANUP_SUMMARY.md << EOF
# Development Files Cleanup Summary

## Cleanup Date: $(date)

## Files Moved to Archive:

### Development Scripts (archive/development-scripts/):
- browser-performance-test.js
- check-metadata.js
- check-users-actual.js
- check-users.js
- cleanup-for-production.js
- create-performance-indexes.js
- create-project-data.js
- create-test-project-data.js
- debug-auth-step-by-step.js
- debug-backend-validation.js
- debug-employee-validation.js
- debug-validation-errors.js
- PRODUCTION_CLEANUP_COMPLETE.js
- PORT_FIX_APPLIED.js
- setup-test-data-complete.js
- quick-user-check.js
- validation-test-utils.js

### Test Files (archive/test-files/):
- complete-integration-test.js
- comprehensive-api-test-suite.js
- comprehensive-business-review.js
- comprehensive-field-coverage-test.js
- comprehensive-integration-test.js
- comprehensive-system-validation.js
- field-consistency-test.js
- final-business-assessment.js
- FINAL-INTEGRATION-REPORT.js
- fixed-api-test-suite.js
- frontend-performance-test.js
- frontend-ui-comprehensive-test.js
- integration-review.js
- lazy-loading-test.js
- phase3-security-test.js
- quick-api-test.js
- simple-api-test.js
- simple-fresh-auth-test.js
- simple-validation-test.js
- test-correct-endpoints.js
- test-frontend-backend-validation.js
- test-runner.js
- test-salary-integration.js
- workflow-test-suite.js
- USER_TESTING_GUIDE.js

### API Test Files (archive/api-tests/):
- run-api-test-manager.bat
- run-api-tests.bat
- run-tests.bat
- test-config.json
- test-results.json
- test_output.txt

### Documentation Reports (archive/documentation-reports/):
- API_TEST_RESULTS_SUMMARY.md
- API_TEST_SUITE_DOCUMENTATION.md
- COMPREHENSIVE_CODE_REVIEW_REPORT.md
- FIELD_CONSISTENCY_ANALYSIS.md
- FIELD_CONSISTENCY_FIXES_COMPLETE.md
- FINAL_BUSINESS_REVIEW_SUMMARY.json
- FRONTEND_OPTIMIZATION_TESTING_GUIDE.md
- FRONTEND_VALIDATION_COMPLETION_REPORT.md
- IMMEDIATE_FIXES_IMPLEMENTATION_GUIDE.md
- MANUAL_UI_TESTING_GUIDE.md
- MISSION_COMPLETE.md
- PHASE_2_COMPLETION_REPORT.md
- PHASE_3_COMPLETION_REPORT.md
- PHASE_4_COMPLETION_REPORT.md
- PHASE_4_FRONTEND_OPTIMIZATION_COMPLETE.md
- PHASE_4_PERFORMANCE_PLAN.md
- TEST_ORGANIZATION_COMPLETE.md

### Directories Moved:
- test-results/
- test-screenshots/

### Temporary Scripts (archive/temp-scripts/):
- setup-postgresql.bat

## Files Remaining in Root (Production Ready):
- backend/              (Core application backend)
- frontend/             (Core application frontend)
- PROD/                 (Windows production setup)
- PRODUnix/             (Unix/Linux production setup)
- docs/                 (Production documentation)
- database/             (Database configurations)
- scripts/              (Production scripts)
- uploads/              (File upload directory)
- tests/                (Core test suite)
- .env.production.template
- docker-compose.yml
- ecosystem.config.js
- package.json
- package-lock.json
- README.md
- NOVICE_SETUP_GUIDE.md
- skyraksys_hrm.code-workspace
- .gitignore
- .vscode/
- node_modules/

## Purpose:
This cleanup was performed to:
1. Remove development and testing clutter from root directory
2. Keep only production-ready files in root
3. Preserve development history in organized archive
4. Make the project structure cleaner for production deployment

## Archive Organization:
- development-scripts/   - Scripts used during development
- test-files/           - All test and validation scripts
- api-tests/            - API testing utilities and results
- documentation-reports/ - Development reports and documentation
- temp-scripts/         - Temporary development scripts
EOF

log $GREEN "✅ Archive summary created: archive/CLEANUP_SUMMARY.md"

echo ""
log $BLUE "=========================================="
log $GREEN "✅ Development Files Cleanup Complete!"
log $BLUE "=========================================="
echo ""

log $YELLOW "Summary:"
log $YELLOW "- Moved $(ls archive/development-scripts/ 2>/dev/null | wc -l) development scripts"
log $YELLOW "- Moved $(ls archive/test-files/ 2>/dev/null | wc -l) test files"
log $YELLOW "- Moved $(ls archive/api-tests/ 2>/dev/null | wc -l) API test files"
log $YELLOW "- Moved $(ls archive/documentation-reports/ 2>/dev/null | wc -l) documentation files"
log $YELLOW "- Organized all files into categorized archive directories"

echo ""
log $YELLOW "Root directory is now clean and production-ready!"
log $YELLOW "All development files preserved in archive/ with organized structure"

echo ""
log $BLUE "Next steps:"
log $YELLOW "1. Review archive/CLEANUP_SUMMARY.md for complete details"
log $YELLOW "2. Test that production setup still works correctly"
log $YELLOW "3. Commit the cleaned up structure to version control"
