const fs = require('fs');
const path = require('path');

console.log('🧹 Starting SkyRakSys HRM Application Cleanup...\n');

const rootDir = __dirname;
const archiveDir = path.join(rootDir, 'archive');

// Ensure archive directories exist
const archiveDirs = [
    'development-files',
    'test-files', 
    'reports',
    'backend-test-files'
];

archiveDirs.forEach(dir => {
    const dirPath = path.join(archiveDir, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Files to move to archive/test-files
const testFiles = [
    'add-realistic-test-data.js',
    'advanced-system-testing.js', 
    'all-scenarios-test-runner.js',
    'analyze-service-endpoints.js',
    'check-database-data.js',
    'check-database-users.js',
    'check-endpoints.js',
    'check-final-status.js',
    'check-positions.js',
    'check-server-health.js',
    'check-system-status.js',
    'check-user-details.js',
    'check-users.js',
    'cleanup-and-reset-for-scaling.js',
    'cleanup-components.sh',
    'cleanup-development-files.bat',
    'cleanup-development-files.sh',
    'clear-auth-and-login.js',
    'complete-integration-solution.js',
    'complete-steps-1-and-2-assessment.js',
    'component-cleanup-analysis.js',
    'comprehensive-e2e-tester.js',
    'comprehensive-frontend-backend-validation.js',
    'comprehensive-hrm-test-suite.js',
    'comprehensive-hrm-tester.js',
    'comprehensive-system-check.js',
    'consolidated-hrm-test-suite.js',
    'corrected-timesheet-payroll-test.js',
    'create-complete-test-data.js',
    'create-complete-working-data.js',
    'create-comprehensive-data.js',
    'create-comprehensive-scaling-data-fixed.js',
    'create-comprehensive-scaling-data.js',
    'create-comprehensive-test-data.js',
    'create-corrected-test-data.js',
    'create-final-data.js',
    'create-final-scaling-data.js',
    'create-full-test-data.js',
    'create-leave-balances-correctly.js',
    'create-leave-balances-directly.js',
    'create-leave-payroll-data.js',
    'create-minimal-working-data.js',
    'create-projects-tasks.js',
    'create-sample-data.js',
    'create-simple-leaves.js',
    'create-simple-test-data.js',
    'create-test-data-complete.js',
    'create-test-data-for-dashboard.js',
    'create-timesheets-with-projects.js',
    'create-working-data-final.js',
    'debug-and-create-leave-data.js',
    'debug-leave-balance-auth.js',
    'debug-leave-validation.js',
    'debug-salary-structure.js',
    'debug-system-status.js',
    'debug-token-auth.js',
    'deep-dive-testing.js',
    'detailed-field-mapping-check.js',
    'detailed-timesheet-test.js',
    'enhance-leave-balance-system.js',
    'enhance-system-data.js',
    'enhance-test-data.js',
    'execute-steps-1-and-2.js',
    'final-comprehensive-e2e-tester.js',
    'final-comprehensive-test-suite.js',
    'final-comprehensive-validation.js',
    'final-integration-report.js',
    'final-leave-payroll-setup.js',
    'final-leave-setup.js',
    'final-status-check.js',
    'final-steps-1-and-2-test.js',
    'final-system-report.js',
    'final-timesheet-payroll-validation.js',
    'finalize-system-data.js',
    'finalize-test-data.js',
    'fix-broken-imports.js',
    'fix-field-mapping-issues.js',
    'fix-imports-correction.js',
    'fix-imports.js',
    'fix-leave-balances.js',
    'fix-position-requirement.js',
    'fix-remaining-issues.js',
    'fix-security-sessions.js',
    'fix-service-imports.js',
    'fix-timesheet-validation.js',
    'fixed-comprehensive-test-suite.js',
    'fixed-timesheet-payroll-test.js',
    'frontend-functionality-tester.js',
    'initialize-complete-test-data.js',
    'jest.config.js',
    'leave-validation-guide.js',
    'payroll-enhancement-fix.js',
    'performance-optimization-script.js',
    'quick-api-verification.js',
    'quick-employee-test.js',
    'quick-project-setup.js',
    'quick-server-test.js',
    'react-optimization-implementation.js',
    'robust-scenarios-validator.js',
    'run-tests.bat',
    'salary-structure-fix-test.js',
    'seed-projects-tasks.js',
    'setup-complete-data.js',
    'setup-leave-payroll-complete.js',
    'setup-leave-system.js',
    'setup-postgres.bat',
    'simple-dashboard-test.js',
    'successful-api-test.js',
    'test-api-endpoints.js',
    'test-auth-credentials.js',
    'test-auth-fix.js',
    'test-backend-endpoints.js',
    'test-direct-api-access.js',
    'test-dropdown-functionality.js',
    'test-employee-creation.js',
    'test-employee-position-fix.js',
    'test-frontend-backend-connectivity.js',
    'test-jwt-parsing.js',
    'test-leave-balance-admin.js',
    'test-leave-creation.js',
    'test-leave-form-final-fix.js',
    'test-leave-form-fix.js',
    'test-responsive-components.bat',
    'test-timesheet-validation.js',
    'testing-framework-setup.js',
    'timesheet-payroll-tester.js',
    'ultimate-comprehensive-test-suite.js',
    'ultimate-timesheet-payroll-validation.js',
    'unified-test-runner.js',
    'verify-all-endpoints.js',
    'verify-fixed-endpoints.js',
    'working-test-data.js'
];

// Files to move to archive/reports
const reportFiles = [
    'ALL_GAPS_IMPLEMENTATION_COMPLETE.md',
    'API_ENDPOINTS_REFERENCE.md',
    'CLEANUP_COMPLETION_REPORT.md',
    'COMPLETION_REPORT.md',
    'COMPONENT_CLEANUP_REPORT.md',
    'COMPREHENSIVE_SYSTEM_DOCUMENTATION.md',
    'COMPREHENSIVE_SYSTEM_REFACTORING_PLAN.md',
    'COMPREHENSIVE_SYSTEM_REVIEW.md',
    'COMPREHENSIVE_TESTING_COMPLETION_REPORT.md',
    'DASHBOARD_ISSUE_RESOLUTION.md',
    'DESKTOP_LOGIN_ENHANCEMENTS.md',
    'DETAILED_REQUIREMENTS_ANALYSIS.md',
    'EMPLOYEE_ID_RESPONSIVENESS_ANALYSIS.md',
    'ENDPOINT_MAPPING_FIXES_SUMMARY.md',
    'ENHANCEMENT_COMPLETION_REPORT.md',
    'FINAL_COMPREHENSIVE_COMPLETION_REPORT.md',
    'FRONTEND_BACKEND_INTEGRATION_REPORT.md',
    'FRONTEND_REFACTORING_STATUS.md',
    'FUNCTIONALITY_CONFLICTS_ANALYSIS.md',
    'LEAVE_BALANCE_IMPLEMENTATION.md',
    'LEAVE_FORM_DATEPICKER_FIX_COMPLETE.md',
    'LEAVE_REQUEST_VALIDATION_FIX_GUIDE.md',
    'MANAGER_INTERFACE_IMPLEMENTATION_SUMMARY.md',
    'NEXT_STEPS_ROADMAP.md',
    'NOVICE_SETUP_GUIDE.md',
    'PENDING_ITEMS_SUMMARY.md',
    'PERFORMANCE_OPTIMIZATION_PLAN.md',
    'PHASE_1_COMPLETION_REPORT.md',
    'REFACTORING_COMPLETION_REPORT.md',
    'REQUIREMENTS_DRY_RUN_ANALYSIS.md',
    'RESPONSIVE_UI_ASSESSMENT.md',
    'STEPS_1_AND_2_COMPLETION_REPORT.md',
    'SYSTEM_COMPLETION_REPORT.md',
    'SYSTEM_TESTING_COMPLETE.md',
    'TECHNICAL_ANALYSIS_SUPPLEMENT.md',
    'TESTING_FRAMEWORK_GUIDE.md',
    'TEST_DATA_SUCCESS_REPORT.md'
];

// JSON and CSV files to move
const dataFiles = [
    'ALL_SCENARIOS_REPORT.json',
    'ALL_SCENARIOS_TEST_RESULTS.csv',
    'cleanup-and-scaling-report.json',
    'comprehensive-scaling-data-report.json',
    'comprehensive-test-report.json',
    'COMPREHENSIVE_E2E_COMPLETION_REPORT.js',
    'consolidated-hrm-test-report.json',
    'E2E_TEST_REPORT.json',
    'E2E_TEST_RESULTS.csv',
    'E2E_TEST_SCENARIOS.csv',
    'final-comprehensive-hrm-report.json',
    'frontend-functionality-report.json',
    'payroll-enhancement-report.json',
    'ROBUST_SCENARIOS_VALIDATION.csv',
    'ROBUST_VALIDATION_REPORT.json',
    'system-test-report.html',
    'ultimate-hrm-test-report.json',
    'unified-system-test-report.json',
    'FINAL_E2E_SUCCESS_REPORT.js',
    'FINAL_E2E_TEST_REPORT.json',
    'FINAL_E2E_TEST_RESULTS.csv'
];

// Move files function
function moveFile(fileName, destDir) {
    const sourcePath = path.join(rootDir, fileName);
    const destPath = path.join(archiveDir, destDir, fileName);
    
    if (fs.existsSync(sourcePath)) {
        try {
            fs.renameSync(sourcePath, destPath);
            console.log(`✅ Moved ${fileName} to archive/${destDir}/`);
            return true;
        } catch (error) {
            console.log(`❌ Failed to move ${fileName}: ${error.message}`);
            return false;
        }
    } else {
        console.log(`⚠️  File not found: ${fileName}`);
        return false;
    }
}

// Execute cleanup
console.log('📁 Moving test files...');
let testMoved = 0;
testFiles.forEach(file => {
    if (moveFile(file, 'test-files')) testMoved++;
});

console.log('\n📁 Moving report files...');
let reportMoved = 0;
reportFiles.forEach(file => {
    if (moveFile(file, 'reports')) reportMoved++;
});

console.log('\n📁 Moving data files...');
let dataMoved = 0;
dataFiles.forEach(file => {
    if (moveFile(file, 'test-files')) dataMoved++;
});

// Summary
console.log('\n🎉 CLEANUP SUMMARY:');
console.log(`✅ Test files moved: ${testMoved}`);
console.log(`✅ Report files moved: ${reportMoved}`);
console.log(`✅ Data files moved: ${dataMoved}`);
console.log(`📊 Total files archived: ${testMoved + reportMoved + dataMoved}`);

console.log('\n📋 REMAINING FILES FOR MANUAL REVIEW:');
const remainingFiles = fs.readdirSync(rootDir).filter(file => {
    const filePath = path.join(rootDir, file);
    return fs.statSync(filePath).isFile() && !file.startsWith('.') && 
           !['package.json', 'package-lock.json', 'README.md', 'docker-compose.yml', 
             'ecosystem.config.js', 'highlevelrequirement.md', 'COMPREHENSIVE_CLEANUP_ANALYSIS.md',
             'cleanup-application.js'].includes(file);
});

if (remainingFiles.length > 0) {
    console.log('⚠️  Files that may need manual review:');
    remainingFiles.forEach(file => console.log(`   - ${file}`));
}

console.log('\n🧹 Root directory cleanup completed!');
console.log('📁 Check archive/ folder for moved files');
console.log('✨ Application is now clean and production-ready!');
