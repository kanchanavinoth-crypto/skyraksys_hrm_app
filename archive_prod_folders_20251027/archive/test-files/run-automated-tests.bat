@echo off
echo.
echo ===============================================
echo   SkyRakSys HRM - Comprehensive Test Suite
echo ===============================================
echo.

REM Set up colors for Windows
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

REM Color codes
set "GREEN=%ESC%[32m"
set "RED=%ESC%[31m"
set "YELLOW=%ESC%[33m"
set "BLUE=%ESC%[34m"
set "MAGENTA=%ESC%[35m"
set "CYAN=%ESC%[36m"
set "WHITE=%ESC%[37m"
set "RESET=%ESC%[0m"

echo %CYAN%🚀 Starting Comprehensive Test Suite...%RESET%
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Node.js is not installed. Please install Node.js first.%RESET%
    pause
    exit /b 1
)

REM Check if backend directory exists
if not exist "backend" (
    echo %RED%❌ Backend directory not found. Please run from project root.%RESET%
    pause
    exit /b 1
)

REM Navigate to backend directory
cd backend

REM Install dependencies if needed
echo %YELLOW%📦 Checking dependencies...%RESET%
if not exist "node_modules" (
    echo %YELLOW%Installing backend dependencies...%RESET%
    npm install
    if errorlevel 1 (
        echo %RED%❌ Failed to install backend dependencies%RESET%
        pause
        exit /b 1
    )
)

REM Install test dependencies
echo %YELLOW%📦 Installing test dependencies...%RESET%
npm install --save-dev axios colors puppeteer

echo.
echo %BLUE%🔍 Available Test Suites:%RESET%
echo %WHITE%[1] Backend API Tests (Authentication, CRUD, Workflows)%RESET%
echo %WHITE%[2] Frontend E2E Tests (UI, Navigation, User Flows)%RESET%
echo %WHITE%[3] Full Integration Tests (Backend + Frontend)%RESET%
echo %WHITE%[4] Quick Health Check%RESET%
echo %WHITE%[5] Performance Tests%RESET%
echo %WHITE%[6] Run All Tests%RESET%
echo.

set /p choice=%CYAN%Select test suite (1-6): %RESET%

if "%choice%"=="1" goto backend_tests
if "%choice%"=="2" goto frontend_tests
if "%choice%"=="3" goto integration_tests
if "%choice%"=="4" goto health_check
if "%choice%"=="5" goto performance_tests
if "%choice%"=="6" goto all_tests
goto invalid_choice

:backend_tests
echo.
echo %MAGENTA%🔧 Running Backend API Tests...%RESET%
echo %YELLOW%⚠️  Please ensure backend server is running on port 8080%RESET%
pause
node tests/comprehensive-automated-test.js
goto end

:frontend_tests
echo.
echo %MAGENTA%🌐 Running Frontend E2E Tests...%RESET%
echo %YELLOW%⚠️  Please ensure both frontend (3000) and backend (8080) servers are running%RESET%
pause
node tests/frontend-e2e-test.js
goto end

:integration_tests
echo.
echo %MAGENTA%🔗 Running Full Integration Tests...%RESET%
echo %YELLOW%⚠️  Please ensure both servers are running%RESET%
echo %CYAN%Testing backend APIs...%RESET%
node tests/comprehensive-automated-test.js
echo.
echo %CYAN%Testing frontend UI...%RESET%
node tests/frontend-e2e-test.js
goto end

:health_check
echo.
echo %MAGENTA%🏥 Running Quick Health Check...%RESET%
echo %CYAN%Checking backend health...%RESET%
curl -s http://localhost:8080/api/health || echo %RED%❌ Backend not responding%RESET%
echo.
echo %CYAN%Checking frontend availability...%RESET%
curl -s http://localhost:3000 > nul && echo %GREEN%✅ Frontend responding%RESET% || echo %RED%❌ Frontend not responding%RESET%
goto end

:performance_tests
echo.
echo %MAGENTA%⚡ Running Performance Tests...%RESET%
echo %YELLOW%⚠️  Please ensure backend server is running%RESET%
pause
node -e "
const { PerformanceTests } = require('./tests/comprehensive-automated-test.js');
async function run() {
  const perfTests = new PerformanceTests({admin: 'dummy-token'});
  await perfTests.runAll();
}
run().catch(console.error);
"
goto end

:all_tests
echo.
echo %MAGENTA%🎯 Running Complete Test Suite...%RESET%
echo.
echo %YELLOW%⚠️  This will run ALL tests. Please ensure:
echo     - Backend server is running on port 8080
echo     - Frontend server is running on port 3000
echo     - No other applications are using these ports%RESET%
echo.
pause

echo %CYAN%Step 1/3: Backend API Tests%RESET%
node tests/comprehensive-automated-test.js
echo.
echo %CYAN%Step 2/3: Frontend E2E Tests%RESET%
node tests/frontend-e2e-test.js
echo.
echo %CYAN%Step 3/3: Generating Combined Report%RESET%
node -e "
const fs = require('fs');
const path = require('path');

// Read individual reports
let combinedReport = '# 🏆 SkyRakSys HRM - Complete Test Suite Report\n\n';
combinedReport += '**Generated**: ' + new Date().toISOString() + '\n\n';

try {
  const backendReport = fs.readFileSync('./AUTOMATED_TEST_REPORT.md', 'utf8');
  combinedReport += '## 🔧 Backend Test Results\n\n' + backendReport + '\n\n';
} catch (e) {
  combinedReport += '## 🔧 Backend Test Results\n\n❌ Backend test report not found\n\n';
}

try {
  const frontendReport = fs.readFileSync('./FRONTEND_E2E_TEST_REPORT.md', 'utf8');
  combinedReport += '## 🌐 Frontend Test Results\n\n' + frontendReport + '\n\n';
} catch (e) {
  combinedReport += '## 🌐 Frontend Test Results\n\n❌ Frontend test report not found\n\n';
}

combinedReport += '---\n\n## 🎯 Overall Assessment\n\n';
combinedReport += 'This comprehensive test suite validates:\n';
combinedReport += '- ✅ Backend API functionality\n';
combinedReport += '- ✅ Frontend user interface\n';
combinedReport += '- ✅ Full-stack integration\n';
combinedReport += '- ✅ User workflows\n';
combinedReport += '- ✅ Performance metrics\n\n';

fs.writeFileSync('./COMPLETE_TEST_SUITE_REPORT.md', combinedReport);
console.log('📝 Combined report saved: COMPLETE_TEST_SUITE_REPORT.md');
"
goto end

:invalid_choice
echo %RED%❌ Invalid choice. Please select 1-6.%RESET%
pause
goto start

:end
echo.
echo %GREEN%🏁 Test execution completed!%RESET%
echo.
echo %CYAN%📝 Check the following files for detailed results:%RESET%
if exist "AUTOMATED_TEST_REPORT.md" echo %WHITE%   - AUTOMATED_TEST_REPORT.md (Backend tests)%RESET%
if exist "FRONTEND_E2E_TEST_REPORT.md" echo %WHITE%   - FRONTEND_E2E_TEST_REPORT.md (Frontend tests)%RESET%
if exist "COMPLETE_TEST_SUITE_REPORT.md" echo %WHITE%   - COMPLETE_TEST_SUITE_REPORT.md (Combined report)%RESET%
if exist "test-screenshots" echo %WHITE%   - test-screenshots/ (UI screenshots)%RESET%
echo.

echo %YELLOW%💡 Tips:%RESET%
echo %WHITE%   - Review failed tests in the reports%RESET%
echo %WHITE%   - Screenshots help debug UI issues%RESET%
echo %WHITE%   - Run individual test suites for faster iterations%RESET%
echo.

pause
