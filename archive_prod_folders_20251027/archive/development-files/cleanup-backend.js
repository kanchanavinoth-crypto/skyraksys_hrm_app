const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning Backend Directory...\n');

const backendDir = path.join(__dirname, 'backend');
const archiveDir = path.join(__dirname, 'archive', 'backend-test-files');

// Files to move from backend directory
const backendTestFiles = [
    // Test screenshots
    '01-login-page-comprehensive.png',
    '01-login-page.png',
    '02-employee-authenticated-comprehensive.png',
    '03-timesheet-business-flow-comprehensive.png',
    '04-leave-business-flow-comprehensive.png',
    '05-manager-workflow-login-comprehensive.png',
    '06-manager-workflow-access-comprehensive.png',
    '07-navigation-flow-complete-comprehensive.png',
    '08-interaction-capabilities-comprehensive.png',
    '09-comprehensive-validation-complete-comprehensive.png',
    '09-validation-complete.png',
    'admin-login-failed-all-roles.png',
    'app-loaded.png',
    'complete-system-validation-complete-system.png',
    'e2e-readiness-check.png',
    'employee-login-failed-all-roles.png',
    'employee-login-success-all-roles.png',
    'employee-login-success-fixed.png',
    'leave-page-success-fixed.png',
    'leave-page.png',
    'manager-login-failed-all-roles.png',
    'timesheet-page-success-fixed.png',
    'timesheet-page.png',
    'ui-elements.png',
    
    // Test files
    'advanced-100-percent-validator.js',
    'api-endpoint-test.js',
    'automated-test-scenarios-runner.js',
    'check-columns.js',
    'check-users-actual.js',
    'check-users.js',
    'comprehensive-test-runner.js',
    'comprehensive-test.js',
    'constraint-fix-test.js',
    'create-admin.js',
    'create-demo-users.js',
    'create-performance-indexes-fixed.js',
    'create-performance-indexes.js',
    'create-sample-data.js',
    'create-test-employee.js',
    'debug-direct-test.js',
    'debug-task-validation.js',
    'debug-test.js',
    'demo-resubmit.js',
    'final-comprehensive-test.js',
    'final-confirmation.js',
    'final-timesheet-test.js',
    'final-validation-summary.js',
    'fix-constraints.js',
    'fix-demo-passwords.js',
    'inspect-password.js',
    'leave-permutation-test.js',
    'leave-system-check.js',
    'list-employees.js',
    'list-users.js',
    'payslip-permutation-test.js',
    'payslip-system-verification.js',
    'quick-test.js',
    'quick-timesheet-test.js',
    'recreate-timesheet-table.js',
    'run-comprehensive-tests.bat',
    'run-final-test.js',
    'run-full-test.bat',
    'run-tests.js',
    'seed-data.js',
    'server-backup.js',
    'server-refactored.js',
    'setup-leave-system.js',
    'setup-test-data-complete.js',
    'setup-test-data.js',
    'simple-100-percent-validator.js',
    'simple-test.js',
    'simple-workflow-test.js',
    'test-db-connection.js',
    'test-demo-login.js',
    'test-employee-api.js',
    'test-login.js',
    'test-reject-resubmit.js',
    'timesheet-fix-test.js',
    'update-admin.js',
    'update-demo-passwords.js',
    'validation-test.js',
    'workflow-fix-test.js',
    
    // Test report files
    'AUTOMATED_TEST_REPORT.md',
    'FRONTEND_E2E_TEST_REPORT.md',
    'API_DOCUMENTATION.md',
    
    // Test data files
    'automated-test-results.json',
    
    // Duplicate env files
    '.env.development',
    '.env.example',
    '.env.postgres.local',
    '.env.sqlite',
    '.env.sqlite.backup',
    'database.backup.sqlite',
    'database.sqlite.disabled',
    
    // Log files
    'server.log'
];

// Test screenshot pattern files
const testScreenshotPattern = /^test-[a-z]\d{3}-\d+\.png$/;

function moveBackendFile(fileName) {
    const sourcePath = path.join(backendDir, fileName);
    const destPath = path.join(archiveDir, fileName);
    
    if (fs.existsSync(sourcePath)) {
        try {
            fs.renameSync(sourcePath, destPath);
            console.log(`✅ Moved ${fileName} from backend/`);
            return true;
        } catch (error) {
            console.log(`❌ Failed to move ${fileName}: ${error.message}`);
            return false;
        }
    }
    return false;
}

// Get all files in backend directory
const allBackendFiles = fs.readdirSync(backendDir).filter(file => {
    const filePath = path.join(backendDir, file);
    return fs.statSync(filePath).isFile();
});

// Move screenshot test files matching pattern
const testScreenshots = allBackendFiles.filter(file => testScreenshotPattern.test(file));

console.log('📁 Moving backend test files...');
let moved = 0;

// Move defined test files
backendTestFiles.forEach(file => {
    if (moveBackendFile(file)) moved++;
});

// Move test screenshot files
testScreenshots.forEach(file => {
    if (moveBackendFile(file)) moved++;
});

console.log(`\n✅ Moved ${moved} files from backend/`);

// Check for any remaining non-essential files
const remainingFiles = fs.readdirSync(backendDir).filter(file => {
    const filePath = path.join(backendDir, file);
    const isFile = fs.statSync(filePath).isFile();
    const isEssential = [
        'server.js',
        'package.json', 
        'package-lock.json',
        '.env',
        '.gitignore',
        '.sequelizerc',
        'README.md'
    ].includes(file);
    
    return isFile && !isEssential && !file.startsWith('.') && !file.endsWith('.png');
});

if (remainingFiles.length > 0) {
    console.log('\n⚠️  Remaining non-essential files in backend/:');
    remainingFiles.forEach(file => console.log(`   - ${file}`));
}

console.log('\n🧹 Backend cleanup completed!');
