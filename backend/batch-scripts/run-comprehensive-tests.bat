@echo off
echo ========================================
echo  HRM System Comprehensive Test Suite
echo ========================================
echo.

:: Check if we're in the right directory
if not exist "server.js" (
    echo Error: This script must be run from the backend directory
    echo Please navigate to the backend folder and try again
    pause
    exit /b 1
)

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Install colors package if not present (needed for test output)
npm list colors >nul 2>&1
if errorlevel 1 (
    echo Installing colors package for test output...
    npm install colors
)

:: Install dayjs if not present (needed for date handling in tests)
npm list dayjs >nul 2>&1
if errorlevel 1 (
    echo Installing dayjs package for date handling...
    npm install dayjs
)

echo.
echo Starting comprehensive test suite...
echo.

:: Run the test suite
node run-tests.js

:: Check exit code
if errorlevel 1 (
    echo.
    echo ========================================
    echo  Test Suite Failed!
    echo ========================================
    pause
    exit /b 1
) else (
    echo.
    echo ========================================
    echo  Test Suite Completed Successfully!
    echo ========================================
    pause
)
