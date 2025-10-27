@echo off
REM ========================================
REM SkyRakSys HRM - Codebase Cleanup Script
REM ========================================
echo.
echo ========================================
echo   SkyRakSys HRM - Codebase Cleanup
echo ========================================
echo.
echo This script will organize your codebase:
echo   1. Move test scripts to archive/test-scripts/
echo   2. Move debug scripts to archive/debug-scripts/
echo   3. Move old documentation to archive/old-docs/
echo   4. Consolidate production configs to production/
echo   5. Keep only essential files in root
echo.
pause

REM Create backup first
echo.
echo Creating backup...
xcopy /E /I /Y backend backup\backend\
xcopy /E /I /Y frontend backup\frontend\
echo Backup created in backup\ folder
echo.

REM Move test scripts
echo Moving test scripts...
move test-*.js archive\test-scripts\ 2>nul
move *-test.js archive\test-scripts\ 2>nul
move comprehensive-*.js archive\test-scripts\ 2>nul
move setup-*.js archive\test-scripts\ 2>nul
move quick-*.js archive\test-scripts\ 2>nul
move final-*.js archive\test-scripts\ 2>nul
move payslip-*-test.js archive\test-scripts\ 2>nul

REM Move debug scripts
echo Moving debug scripts...
move debug-*.js archive\debug-scripts\ 2>nul
move check-*.js archive\debug-scripts\ 2>nul
move create-*.js archive\debug-scripts\ 2>nul
move analyze-*.js archive\debug-scripts\ 2>nul
move diagnostic-*.js archive\debug-scripts\ 2>nul
move fix-*.js archive\debug-scripts\ 2>nul

REM Move old documentation to archive
echo Moving old documentation...
move ADD_EMPLOYEE_*.md archive\old-docs\ 2>nul
move ADD_LEAVE_*.md archive\old-docs\ 2>nul
move ADMIN_DEBUG_*.md archive\old-docs\ 2>nul
move COMPENSATION_*.md archive\old-docs\ 2>nul
move CORS_FIX_*.md archive\old-docs\ 2>nul
move DEBUG_*.md archive\old-docs\ 2>nul
move EDIT_*.md archive\old-docs\ 2>nul
move EMERGENCY_*.md archive\old-docs\ 2>nul
move EMPLOYEE_EDIT_*.md archive\old-docs\ 2>nul
move EMPLOYEE_FIELDS_*.md archive\old-docs\ 2>nul
move EMPLOYEE_FORM_*.md archive\old-docs\ 2>nul
move EMPLOYEE_ID_*.md archive\old-docs\ 2>nul
move EMPLOYEE_LIST_*.md archive\old-docs\ 2>nul
move EMPLOYEE_PAGINATION_*.md archive\old-docs\ 2>nul
move EMPLOYEE_PROFILE_*.md archive\old-docs\ 2>nul
move EMPLOYEE_VALIDATION_*.md archive\old-docs\ 2>nul
move EMPLOYEE_VIEW_*.md archive\old-docs\ 2>nul
move FK_*.md archive\old-docs\ 2>nul
move FORM_*.md archive\old-docs\ 2>nul
move LEAVE_BALANCE_*.md archive\old-docs\ 2>nul
move LEAVE_CANCELLATION_*.md archive\old-docs\ 2>nul
move LEAVE_REQUEST_*.md archive\old-docs\ 2>nul
move LEAVE_RUNTIME_*.md archive\old-docs\ 2>nul
move LEFT_NAV_*.md archive\old-docs\ 2>nul
move LOGGING_*.md archive\old-docs\ 2>nul
move MOCK_DATA_*.md archive\old-docs\ 2>nul
move MODERN_TIMESHEET_*.md archive\old-docs\ 2>nul
move MULTIPLE_TASKS_*.md archive\old-docs\ 2>nul
move MY_PROFILE_*.md archive\old-docs\ 2>nul
move PAY_MANAGEMENT_*.md archive\old-docs\ 2>nul
move PAYSLIP_BUTTON_*.md archive\old-docs\ 2>nul
move PAYSLIP_DRY_*.md archive\old-docs\ 2>nul
move PAYSLIP_TEMPLATE_*.md archive\old-docs\ 2>nul
move PHOTO_UPLOAD_*.md archive\old-docs\ 2>nul
move PREVIOUS_WEEK_*.md archive\old-docs\ 2>nul
move PROJECT_TASK_*.md archive\old-docs\ 2>nul
move ROUTE_*.md archive\old-docs\ 2>nul
move TASK_VALIDATION_*.md archive\old-docs\ 2>nul
move TEMPLATE_*.md archive\old-docs\ 2>nul
move TIMESHEET_404_*.md archive\old-docs\ 2>nul
move TIMESHEET_APPROVAL_*.md archive\old-docs\ 2>nul
move TIMESHEET_ENHANCEMENTS_*.md archive\old-docs\ 2>nul
move TIMESHEET_FIXES_*.md archive\old-docs\ 2>nul
move TIMESHEET_INTEGRATION_*.md archive\old-docs\ 2>nul
move TIMESHEET_MAP_*.md archive\old-docs\ 2>nul
move TIMESHEET_VISUAL_*.md archive\old-docs\ 2>nul
move TOUCHED_*.md archive\old-docs\ 2>nul
move UI_UX_*.md archive\old-docs\ 2>nul
move USER_ACCOUNT_*.md archive\old-docs\ 2>nul
move WEEK_DATA_*.md archive\old-docs\ 2>nul

REM Move key documentation to docs folders
echo Organizing documentation...
move TIMESHEET_COMPREHENSIVE_AUDIT_REPORT.md docs\audits\ 2>nul
move PAYSLIP_SYSTEM_AUDIT_REPORT.md docs\audits\ 2>nul
move API_FUNCTIONALITY_AUDIT.md docs\audits\ 2>nul
move AUDIT_ISSUES_STATUS_TRACKER.md docs\audits\ 2>nul

move COMPREHENSIVE_HRM_REVIEW_REPORT.md docs\ 2>nul
move COMPREHENSIVE_PAYSLIP_SYSTEM_DOCUMENTATION.md docs\ 2>nul
move COMPREHENSIVE_CONTEXT_DOCUMENTATION.md docs\ 2>nul

move PRODUCTION_DEPLOYMENT_CHECKLIST.md docs\production\ 2>nul
move PRODUCTION_READINESS_REPORT.md docs\production\ 2>nul
move PRODUCTION_CREDENTIALS_VERIFICATION.md docs\production\ 2>nul
move PRODUCTION_SETUP_COMPLETE_REVIEW.md docs\production\ 2>nul
move FINAL_PRODUCTION_READINESS_CHECKLIST.md docs\production\ 2>nul
move DEPLOYMENT-DOCUMENTATION.md docs\production\ 2>nul
move SWAGGER_PRODUCTION_GUIDE.md docs\production\ 2>nul

move DEFAULT_TEMPLATES_AND_LOGO_GUIDE.md docs\guides\ 2>nul
move DATABASE_TOOLS_TROUBLESHOOTING.md docs\guides\ 2>nul
move PAYSLIP_TEMPLATE_OPTIONS_GUIDE.md docs\guides\ 2>nul
move TIMESHEET_QUICK_REFERENCE.md docs\guides\ 2>nul

REM Consolidate production configs
echo Consolidating production configs...
xcopy /E /I /Y PROD\* production\windows\ 2>nul
xcopy /E /I /Y PRODUnix\* production\unix\ 2>nul
xcopy /E /I /Y redhat\* production\redhat-deployment\base\ 2>nul
xcopy /E /I /Y redhatprod\* production\redhat-deployment\prod\ 2>nul

REM Keep these in root
echo Cleaning up root directory (keeping essential files)...
REM The following stay in root:
REM - README.md
REM - CHANGELOG.md
REM - package.json
REM - ecosystem.config.js
REM - docker-compose.yml
REM - .env files
REM - .gitignore

echo.
echo ========================================
echo   Cleanup Complete!
echo ========================================
echo.
echo Summary:
echo   - Test scripts moved to archive\test-scripts\
echo   - Debug scripts moved to archive\debug-scripts\
echo   - Old docs moved to archive\old-docs\
echo   - Key docs organized in docs\
echo   - Production configs in production\
echo.
echo Next steps:
echo   1. Review docs\README.md for navigation
echo   2. Check production\README.md for deployment
echo   3. Delete PROD, PRODUnix, redhat, redhatprod folders if satisfied
echo.
pause
