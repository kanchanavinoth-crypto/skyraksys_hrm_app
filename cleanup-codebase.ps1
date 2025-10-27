# SkyRakSys HRM - Codebase Cleanup Script (PowerShell)
# Run this from the root directory: .\cleanup-codebase.ps1

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "  SkyRakSys HRM - Codebase Cleanup"  -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Move test scripts
Write-Host "Moving test scripts..." -ForegroundColor Yellow
Get-ChildItem -Path . -Filter "test-*.js" -File | Move-Item -Destination "archive\test-scripts\" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "*-test.js" -File | Move-Item -Destination "archive\test-scripts\" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "comprehensive-*.js" -File | Move-Item -Destination "archive\test-scripts\" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "setup-*.js" -File | Move-Item -Destination "archive\test-scripts\" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "quick-*.js" -File | Move-Item -Destination "archive\test-scripts\" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "final-*.js" -File | Move-Item -Destination "archive\test-scripts\" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "payslip-*-test.js" -File | Move-Item -Destination "archive\test-scripts\" -Force -ErrorAction SilentlyContinue
Move-Item "business-case-comprehensive-test.js" -Destination "archive\test-scripts\" -Force -ErrorAction SilentlyContinue

# Move debug scripts
Write-Host "Moving debug scripts..." -ForegroundColor Yellow
Get-ChildItem -Path . -Filter "debug-*.js" -File | Move-Item -Destination "archive\debug-scripts\" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "check-*.js" -File | Move-Item -Destination "archive\debug-scripts\" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "create-*.js" -File | Move-Item -Destination "archive\debug-scripts\" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "analyze-*.js" -File | Move-Item -Destination "archive\debug-scripts\" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "diagnostic-*.js" -File | Move-Item -Destination "archive\debug-scripts\" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Filter "fix-*.js" -File | Move-Item -Destination "archive\debug-scripts\" -Force -ErrorAction SilentlyContinue
Move-Item "complete-frontend-fix.js" -Destination "archive\debug-scripts\" -Force -ErrorAction SilentlyContinue
Move-Item "frontend-api-*.js" -Destination "archive\debug-scripts\" -Force -ErrorAction SilentlyContinue
Move-Item "critical-*.js" -Destination "archive\debug-scripts\" -Force -ErrorAction SilentlyContinue
Move-Item "implementation-complete.js" -Destination "archive\debug-scripts\" -Force -ErrorAction SilentlyContinue
Move-Item "drop-constraint.js" -Destination "archive\debug-scripts\" -Force -ErrorAction SilentlyContinue
Move-Item "add-new-constraint.js" -Destination "archive\debug-scripts\" -Force -ErrorAction SilentlyContinue

# Move old documentation
Write-Host "Moving old documentation..." -ForegroundColor Yellow
$docPatterns = @(
    "ADD_EMPLOYEE_*.md", "ADD_LEAVE_*.md", "ADMIN_DEBUG_*.md", 
    "COMPENSATION_*.md", "CORS_FIX_*.md", "DEBUG_*.md", "EDIT_*.md",
    "EMERGENCY_*.md", "EMPLOYEE_EDIT_*.md", "EMPLOYEE_FIELDS_*.md",
    "EMPLOYEE_FORM_*.md", "EMPLOYEE_ID_*.md", "EMPLOYEE_LIST_*.md",
    "EMPLOYEE_PAGINATION_*.md", "EMPLOYEE_PROFILE_*.md", "EMPLOYEE_VALIDATION_*.md",
    "EMPLOYEE_VIEW_*.md", "FK_*.md", "FORM_*.md", "LEAVE_BALANCE_*.md",
    "LEAVE_CANCELLATION_*.md", "LEAVE_REQUEST_*.md", "LEAVE_RUNTIME_*.md",
    "LEFT_NAV_*.md", "LOGGING_*.md", "MOCK_DATA_*.md", "MODERN_TIMESHEET_*.md",
    "MULTIPLE_TASKS_*.md", "MY_PROFILE_*.md", "PAY_MANAGEMENT_*.md",
    "PAYSLIP_BUTTON_*.md", "PAYSLIP_DRY_*.md", "PAYSLIP_TEMPLATE_*.md",
    "PHOTO_UPLOAD_*.md", "PREVIOUS_WEEK_*.md", "PROJECT_TASK_*.md",
    "ROUTE_*.md", "TASK_VALIDATION_*.md", "TEMPLATE_*.md",
    "TIMESHEET_404_*.md", "TIMESHEET_APPROVAL_*.md", "TIMESHEET_ENHANCEMENTS_*.md",
    "TIMESHEET_FIXES_*.md", "TIMESHEET_INTEGRATION_*.md", "TIMESHEET_MAP_*.md",
    "TIMESHEET_VISUAL_*.md", "TOUCHED_*.md", "UI_UX_*.md",
    "USER_ACCOUNT_*.md", "WEEK_DATA_*.md", "ENV_*.md", "EMPLOYEE_FEATURES_*.md"
)

foreach ($pattern in $docPatterns) {
    Get-ChildItem -Path . -Filter $pattern -File | Move-Item -Destination "archive\old-docs\" -Force -ErrorAction SilentlyContinue
}

# Move key documentation to docs folders
Write-Host "Organizing documentation..." -ForegroundColor Yellow
Move-Item "TIMESHEET_COMPREHENSIVE_AUDIT_REPORT.md" -Destination "docs\audits\" -Force -ErrorAction SilentlyContinue
Move-Item "PAYSLIP_SYSTEM_AUDIT_REPORT.md" -Destination "docs\audits\" -Force -ErrorAction SilentlyContinue
Move-Item "API_FUNCTIONALITY_AUDIT.md" -Destination "docs\audits\" -Force -ErrorAction SilentlyContinue
Move-Item "AUDIT_ISSUES_STATUS_TRACKER.md" -Destination "docs\audits\" -Force -ErrorAction SilentlyContinue

Move-Item "COMPREHENSIVE_HRM_REVIEW_REPORT.md" -Destination "docs\" -Force -ErrorAction SilentlyContinue
Move-Item "COMPREHENSIVE_PAYSLIP_SYSTEM_DOCUMENTATION.md" -Destination "docs\" -Force -ErrorAction SilentlyContinue
Move-Item "COMPREHENSIVE_CONTEXT_DOCUMENTATION.md" -Destination "docs\" -Force -ErrorAction SilentlyContinue

Move-Item "PRODUCTION_DEPLOYMENT_CHECKLIST.md" -Destination "docs\production\" -Force -ErrorAction SilentlyContinue
Move-Item "PRODUCTION_READINESS_REPORT.md" -Destination "docs\production\" -Force -ErrorAction SilentlyContinue
Move-Item "PRODUCTION_CREDENTIALS_VERIFICATION.md" -Destination "docs\production\" -Force -ErrorAction SilentlyContinue
Move-Item "PRODUCTION_SETUP_COMPLETE_REVIEW.md" -Destination "docs\production\" -Force -ErrorAction SilentlyContinue
Move-Item "FINAL_PRODUCTION_READINESS_CHECKLIST.md" -Destination "docs\production\" -Force -ErrorAction SilentlyContinue
Move-Item "DEPLOYMENT-DOCUMENTATION.md" -Destination "docs\production\" -Force -ErrorAction SilentlyContinue
Move-Item "SWAGGER_PRODUCTION_GUIDE.md" -Destination "docs\production\" -Force -ErrorAction SilentlyContinue

Move-Item "DEFAULT_TEMPLATES_AND_LOGO_GUIDE.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue
Move-Item "DATABASE_TOOLS_TROUBLESHOOTING.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue
Move-Item "PAYSLIP_TEMPLATE_OPTIONS_GUIDE.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue
Move-Item "TIMESHEET_QUICK_REFERENCE.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue

# Consolidate production configs
Write-Host "Consolidating production configs..." -ForegroundColor Yellow
if (Test-Path "PROD") {
    Copy-Item -Path "PROD\*" -Destination "production\windows\" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "PRODUnix") {
    Copy-Item -Path "PRODUnix\*" -Destination "production\unix\" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "redhat") {
    Copy-Item -Path "redhat\*" -Destination "production\redhat-deployment\base\" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "redhatprod") {
    Copy-Item -Path "redhatprod\*" -Destination "production\redhat-deployment\prod\" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  - Test scripts moved to archive\test-scripts\" -ForegroundColor White
Write-Host "  - Debug scripts moved to archive\debug-scripts\" -ForegroundColor White
Write-Host "  - Old docs moved to archive\old-docs\" -ForegroundColor White
Write-Host "  - Key docs organized in docs\" -ForegroundColor White
Write-Host "  - Production configs copied to production\" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review docs\README.md for navigation" -ForegroundColor Yellow
Write-Host "  2. Check production\README.md for deployment" -ForegroundColor Yellow
Write-Host "  3. Verify old folders (PROD, PRODUnix, redhat, redhatprod) copied correctly" -ForegroundColor Yellow
Write-Host "  4. Delete old folders if satisfied: PROD, PRODUnix, redhat, redhatprod" -ForegroundColor Yellow
Write-Host ""
