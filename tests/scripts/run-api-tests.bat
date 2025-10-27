@echo off
echo.
echo ========================================
echo HRM API Test Suite Runner
echo ========================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js to run the test suite
    pause
    exit /b 1
)

REM Check if backend server is running
echo 🏥 Checking if backend server is running...
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo.
    echo ⚠️  Backend server is not running on port 5000
    echo Please start the backend server first:
    echo    cd backend
    echo    npm start
    echo.
    echo Or use the VS Code task: "start-backend"
    pause
    exit /b 1
)

echo ✅ Backend server is running
echo.

REM Show menu
:menu
echo Choose test suite to run:
echo.
echo 1. Quick Tests (recommended for first run)
echo 2. Comprehensive Tests (full API testing)
echo 3. Workflow Tests (end-to-end scenarios)
echo 4. All Tests (run everything)
echo 5. Health Check Only
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Running Quick Tests...
    node test-runner.js quick
    goto end
)
if "%choice%"=="2" (
    echo.
    echo 🔍 Running Comprehensive Tests...
    node test-runner.js comprehensive
    goto end
)
if "%choice%"=="3" (
    echo.
    echo 🔄 Running Workflow Tests...
    node test-runner.js workflow
    goto end
)
if "%choice%"=="4" (
    echo.
    echo 🎯 Running All Tests...
    node test-runner.js
    goto end
)
if "%choice%"=="5" (
    echo.
    echo 🏥 Running Health Check...
    node test-runner.js health
    goto end
)
if "%choice%"=="6" (
    echo Goodbye!
    goto end
)

echo Invalid choice. Please try again.
echo.
goto menu

:end
echo.
echo Test execution completed.
pause
