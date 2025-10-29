@echo off
echo 🎯 COMPREHENSIVE E2E TEST SUITE
echo ================================
echo.
echo This will test ALL user roles with complete permutation coverage:
echo - Admin, HR Manager, Team Lead, Employees
echo - Authentication, Authorization, Workflows
echo - Cross-role permissions and interactions
echo - All module combinations
echo.

REM Check if backend server is running
echo 🔍 Checking backend server status...
curl -s http://localhost:8080/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend server not running on port 8080
    echo Please start the backend server first:
    echo    cd backend ^&^& node server.js
    pause
    exit /b 1
)
echo ✅ Backend server is running

REM Check if frontend server is running  
echo 🔍 Checking frontend server status...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Frontend server not running on port 3000
    echo Please start the frontend server first:
    echo    cd frontend ^&^& npm start
    pause
    exit /b 1
)
echo ✅ Frontend server is running

echo.
echo 🔧 Setting up test data...
cd /d "%~dp0backend"
node tests/setup-e2e-test-data.js
if %errorlevel% neq 0 (
    echo ❌ Test data setup failed
    pause
    exit /b 1
)

echo.
echo 🚀 Starting comprehensive E2E tests...
echo This will open a browser and test all user roles automatically.
echo.
echo 👤 Testing User Roles:
echo    - Admin (full system access)
echo    - HR Manager (employee, leave, payroll)
echo    - Team Lead (timesheet approval, reports)  
echo    - Employee (own data, timesheets, leave)
echo    - New Employee (onboarding workflow)
echo.
echo 🔄 Testing Workflows:
echo    - Authentication for all roles
echo    - Employee management workflows
echo    - Timesheet creation and approval
echo    - Leave request and approval
echo    - Payroll processing
echo    - Cross-role permission validation
echo.

pause
echo.
echo 🎬 Launching E2E tests...
node tests/comprehensive-e2e-test.js

if %errorlevel% equ 0 (
    echo.
    echo 🎉 E2E TESTS COMPLETED SUCCESSFULLY!
    echo ✅ All user roles and workflows validated
    echo 📸 Screenshots saved in test-screenshots directory
    echo 📊 Check the test output above for detailed results
) else (
    echo.
    echo ⚠️ SOME E2E TESTS FAILED
    echo 📊 Check the test output above for failed test details
    echo 📸 Screenshots may help debug issues
    echo 🔧 Review failed tests and fix issues before deployment
)

echo.
echo 📝 Test Report Summary:
echo - Authentication tests for all user roles
echo - Permission validation across all modules  
echo - Workflow testing for complete user journeys
echo - Cross-role interaction validation
echo - UI responsiveness and functionality
echo.
echo 🚀 Your HRM system has been comprehensively tested!
pause
