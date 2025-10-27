@echo off
echo.
echo ========================================
echo    HRM API Test Suite Manager
echo ========================================
echo.
echo Available Test Suites:
echo.
echo [1] Quick Test (Basic API Health Check)
echo [2] Fixed Test Suite (Comprehensive - 86.4%% Success)
echo [3] Comprehensive Test Suite (Full Feature Coverage)
echo [4] Workflow Test Suite (End-to-End Workflows)
echo [5] All Tests (Run All Suites)
echo [6] Check Server Status
echo [7] Exit
echo.

:menu
set /p choice="Select test suite (1-7): "

if "%choice%"=="1" goto quick
if "%choice%"=="2" goto fixed  
if "%choice%"=="3" goto comprehensive
if "%choice%"=="4" goto workflow
if "%choice%"=="5" goto all
if "%choice%"=="6" goto status
if "%choice%"=="7" goto exit

echo Invalid choice. Please select 1-7.
goto menu

:quick
echo.
echo Running Quick API Tests...
echo.
cd ..\..
node tests\api\quick-api-test.js
echo.
pause
goto menu

:fixed
echo.
echo Running Fixed API Test Suite (Recommended)...
echo.
cd ..\..
node tests\api\fixed-api-test-suite.js
echo.
pause
goto menu

:comprehensive
echo.
echo Running Comprehensive API Test Suite...
echo.
cd ..\..
node tests\api\comprehensive-api-test-suite.js
echo.
pause
goto menu

:workflow
echo.
echo Running Workflow Test Suite...
echo.
cd ..\..
node tests\api\workflow-test-suite.js
echo.
pause
goto menu

:all
echo.
echo Running All Test Suites...
echo.
cd ..\..
echo === Quick Tests ===
node tests\api\quick-api-test.js
echo.
echo === Fixed Test Suite ===
node tests\api\fixed-api-test-suite.js
echo.
echo === Comprehensive Tests ===
node tests\api\comprehensive-api-test-suite.js
echo.
echo === Workflow Tests ===
node tests\api\workflow-test-suite.js
echo.
echo All tests completed!
pause
goto menu

:status
echo.
echo Checking HRM Server Status...
echo.
curl -s http://localhost:5000/api/health | findstr "status\|message\|timestamp" 2>nul
if %errorlevel% neq 0 (
    echo Server is not responding on http://localhost:5000
    echo Please ensure the backend server is running:
    echo   cd backend
    echo   npm start
) else (
    echo Server is running and healthy!
)
echo.
pause
goto menu

:exit
echo.
echo Thank you for using the HRM API Test Suite Manager!
echo.
pause
exit

:error
echo.
echo Error: Could not run tests. Please ensure:
echo 1. Node.js is installed
echo 2. Backend server is running on http://localhost:5000
echo 3. You are in the correct directory
echo.
pause
goto menu
