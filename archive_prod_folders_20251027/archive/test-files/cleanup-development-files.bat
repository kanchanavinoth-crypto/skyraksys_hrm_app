@echo off
setlocal enabledelayedexpansion

REM ================================================================
REM SkyRakSys HRM - Development Files Cleanup Script (Windows)
REM ================================================================
REM This script moves development, testing, and temporary files
REM to the archive directory to clean up the root folder
REM ================================================================

echo.
echo ==========================================
echo SkyRakSys HRM Development Files Cleanup
echo ==========================================
echo.

REM Create archive subdirectories
echo Creating archive directory structure...
mkdir archive\development-scripts 2>nul
mkdir archive\test-files 2>nul
mkdir archive\documentation-reports 2>nul
mkdir archive\performance-tests 2>nul
mkdir archive\debug-scripts 2>nul
mkdir archive\integration-tests 2>nul
mkdir archive\api-tests 2>nul
mkdir archive\validation-tests 2>nul
mkdir archive\completion-reports 2>nul
mkdir archive\temp-scripts 2>nul

echo ✅ Archive directories created

REM Move development and debug scripts
echo.
echo Moving development and debug scripts...

set "dev_scripts=browser-performance-test.js check-metadata.js check-users-actual.js check-users.js cleanup-for-production.js create-performance-indexes.js create-project-data.js create-test-project-data.js debug-auth-step-by-step.js debug-backend-validation.js debug-employee-validation.js debug-validation-errors.js PRODUCTION_CLEANUP_COMPLETE.js PORT_FIX_APPLIED.js setup-test-data-complete.js quick-user-check.js validation-test-utils.js"

for %%f in (%dev_scripts%) do (
    if exist "%%f" (
        move "%%f" archive\development-scripts\ >nul 2>&1
        echo ✅ Moved %%f
    )
)

REM Move test files
echo.
echo Moving test files...

set "test_files=complete-integration-test.js comprehensive-api-test-suite.js comprehensive-business-review.js comprehensive-field-coverage-test.js comprehensive-integration-test.js comprehensive-system-validation.js field-consistency-test.js final-business-assessment.js FINAL-INTEGRATION-REPORT.js fixed-api-test-suite.js frontend-performance-test.js frontend-ui-comprehensive-test.js integration-review.js lazy-loading-test.js phase3-security-test.js quick-api-test.js simple-api-test.js simple-fresh-auth-test.js simple-validation-test.js test-correct-endpoints.js test-frontend-backend-validation.js test-runner.js test-salary-integration.js workflow-test-suite.js USER_TESTING_GUIDE.js"

for %%f in (%test_files%) do (
    if exist "%%f" (
        move "%%f" archive\test-files\ >nul 2>&1
        echo ✅ Moved %%f
    )
)

REM Move API test files
echo.
echo Moving API test related files...

set "api_files=run-api-test-manager.bat run-api-tests.bat run-tests.bat test-config.json test-results.json test_output.txt"

for %%f in (%api_files%) do (
    if exist "%%f" (
        move "%%f" archive\api-tests\ >nul 2>&1
        echo ✅ Moved %%f
    )
)

REM Move documentation and reports
echo.
echo Moving documentation and completion reports...

set "doc_files=API_TEST_RESULTS_SUMMARY.md API_TEST_SUITE_DOCUMENTATION.md COMPREHENSIVE_CODE_REVIEW_REPORT.md FIELD_CONSISTENCY_ANALYSIS.md FIELD_CONSISTENCY_FIXES_COMPLETE.md FINAL_BUSINESS_REVIEW_SUMMARY.json FRONTEND_OPTIMIZATION_TESTING_GUIDE.md FRONTEND_VALIDATION_COMPLETION_REPORT.md IMMEDIATE_FIXES_IMPLEMENTATION_GUIDE.md MANUAL_UI_TESTING_GUIDE.md MISSION_COMPLETE.md PHASE_2_COMPLETION_REPORT.md PHASE_3_COMPLETION_REPORT.md PHASE_4_COMPLETION_REPORT.md PHASE_4_FRONTEND_OPTIMIZATION_COMPLETE.md PHASE_4_PERFORMANCE_PLAN.md TEST_ORGANIZATION_COMPLETE.md"

for %%f in (%doc_files%) do (
    if exist "%%f" (
        move "%%f" archive\documentation-reports\ >nul 2>&1
        echo ✅ Moved %%f
    )
)

REM Move directories that are development-related
echo.
echo Moving development directories...

if exist "test-results" (
    move test-results archive\ >nul 2>&1
    echo ✅ Moved test-results directory
)

if exist "test-screenshots" (
    move test-screenshots archive\ >nul 2>&1
    echo ✅ Moved test-screenshots directory
)

REM Move temporary development scripts
echo.
echo Moving temporary scripts...

if exist "setup-postgresql.bat" (
    move "setup-postgresql.bat" archive\temp-scripts\ >nul 2>&1
    echo ✅ Moved setup-postgresql.bat
)

REM Create a summary of what was archived
echo.
echo Creating archive summary...

(
echo # Development Files Cleanup Summary
echo.
echo ## Cleanup Date: %DATE% %TIME%
echo.
echo ## Files Moved to Archive:
echo.
echo ### Development Scripts ^(archive/development-scripts/^):
echo - browser-performance-test.js
echo - check-metadata.js
echo - check-users-actual.js
echo - check-users.js
echo - cleanup-for-production.js
echo - create-performance-indexes.js
echo - create-project-data.js
echo - create-test-project-data.js
echo - debug-auth-step-by-step.js
echo - debug-backend-validation.js
echo - debug-employee-validation.js
echo - debug-validation-errors.js
echo - PRODUCTION_CLEANUP_COMPLETE.js
echo - PORT_FIX_APPLIED.js
echo - setup-test-data-complete.js
echo - quick-user-check.js
echo - validation-test-utils.js
echo.
echo ### Test Files ^(archive/test-files/^):
echo - complete-integration-test.js
echo - comprehensive-api-test-suite.js
echo - comprehensive-business-review.js
echo - comprehensive-field-coverage-test.js
echo - comprehensive-integration-test.js
echo - comprehensive-system-validation.js
echo - field-consistency-test.js
echo - final-business-assessment.js
echo - FINAL-INTEGRATION-REPORT.js
echo - fixed-api-test-suite.js
echo - frontend-performance-test.js
echo - frontend-ui-comprehensive-test.js
echo - integration-review.js
echo - lazy-loading-test.js
echo - phase3-security-test.js
echo - quick-api-test.js
echo - simple-api-test.js
echo - simple-fresh-auth-test.js
echo - simple-validation-test.js
echo - test-correct-endpoints.js
echo - test-frontend-backend-validation.js
echo - test-runner.js
echo - test-salary-integration.js
echo - workflow-test-suite.js
echo - USER_TESTING_GUIDE.js
echo.
echo ### API Test Files ^(archive/api-tests/^):
echo - run-api-test-manager.bat
echo - run-api-tests.bat
echo - run-tests.bat
echo - test-config.json
echo - test-results.json
echo - test_output.txt
echo.
echo ### Documentation Reports ^(archive/documentation-reports/^):
echo - API_TEST_RESULTS_SUMMARY.md
echo - API_TEST_SUITE_DOCUMENTATION.md
echo - COMPREHENSIVE_CODE_REVIEW_REPORT.md
echo - FIELD_CONSISTENCY_ANALYSIS.md
echo - FIELD_CONSISTENCY_FIXES_COMPLETE.md
echo - FINAL_BUSINESS_REVIEW_SUMMARY.json
echo - FRONTEND_OPTIMIZATION_TESTING_GUIDE.md
echo - FRONTEND_VALIDATION_COMPLETION_REPORT.md
echo - IMMEDIATE_FIXES_IMPLEMENTATION_GUIDE.md
echo - MANUAL_UI_TESTING_GUIDE.md
echo - MISSION_COMPLETE.md
echo - PHASE_2_COMPLETION_REPORT.md
echo - PHASE_3_COMPLETION_REPORT.md
echo - PHASE_4_COMPLETION_REPORT.md
echo - PHASE_4_FRONTEND_OPTIMIZATION_COMPLETE.md
echo - PHASE_4_PERFORMANCE_PLAN.md
echo - TEST_ORGANIZATION_COMPLETE.md
echo.
echo ### Directories Moved:
echo - test-results/
echo - test-screenshots/
echo.
echo ### Temporary Scripts ^(archive/temp-scripts/^):
echo - setup-postgresql.bat
echo.
echo ## Files Remaining in Root ^(Production Ready^):
echo - backend/              ^(Core application backend^)
echo - frontend/             ^(Core application frontend^)
echo - PROD/                 ^(Windows production setup^)
echo - PRODUnix/             ^(Unix/Linux production setup^)
echo - docs/                 ^(Production documentation^)
echo - database/             ^(Database configurations^)
echo - scripts/              ^(Production scripts^)
echo - uploads/              ^(File upload directory^)
echo - tests/                ^(Core test suite^)
echo - .env.production.template
echo - docker-compose.yml
echo - ecosystem.config.js
echo - package.json
echo - package-lock.json
echo - README.md
echo - NOVICE_SETUP_GUIDE.md
echo - skyraksys_hrm.code-workspace
echo - .gitignore
echo - .vscode/
echo - node_modules/
echo.
echo ## Purpose:
echo This cleanup was performed to:
echo 1. Remove development and testing clutter from root directory
echo 2. Keep only production-ready files in root
echo 3. Preserve development history in organized archive
echo 4. Make the project structure cleaner for production deployment
echo.
echo ## Archive Organization:
echo - development-scripts/   - Scripts used during development
echo - test-files/           - All test and validation scripts
echo - api-tests/            - API testing utilities and results
echo - documentation-reports/ - Development reports and documentation
echo - temp-scripts/         - Temporary development scripts
) > archive\CLEANUP_SUMMARY.md

echo ✅ Archive summary created: archive\CLEANUP_SUMMARY.md

echo.
echo ==========================================
echo ✅ Development Files Cleanup Complete!
echo ==========================================
echo.

echo Summary:
echo - Development scripts moved to archive\development-scripts\
echo - Test files moved to archive\test-files\
echo - API test files moved to archive\api-tests\
echo - Documentation files moved to archive\documentation-reports\
echo - Organized all files into categorized archive directories

echo.
echo Root directory is now clean and production-ready!
echo All development files preserved in archive\ with organized structure

echo.
echo Next steps:
echo 1. Review archive\CLEANUP_SUMMARY.md for complete details
echo 2. Test that production setup still works correctly
echo 3. Commit the cleaned up structure to version control

pause
