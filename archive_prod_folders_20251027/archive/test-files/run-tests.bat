@echo off
echo ========================================
echo    HRM SYSTEM COMPREHENSIVE TESTING
echo ========================================
echo.

:MENU
echo Please select testing option:
echo.
echo 1. Run Complete System Test (API + Frontend)
echo 2. Run API Tests Only
echo 3. Run Frontend Tests Only
echo 4. Check System Health
echo 5. Quick API Test
echo 6. Start Backend and Frontend Services
echo 7. Exit
echo.
set /p choice=Enter your choice (1-7): 

if "%choice%"=="1" goto COMPLETE_TEST
if "%choice%"=="2" goto API_TEST
if "%choice%"=="3" goto FRONTEND_TEST
if "%choice%"=="4" goto HEALTH_CHECK
if "%choice%"=="5" goto QUICK_TEST
if "%choice%"=="6" goto START_SERVICES
if "%choice%"=="7" goto EXIT

echo Invalid choice. Please try again.
echo.
goto MENU

:COMPLETE_TEST
echo.
echo 🚀 Running Complete System Test Suite...
echo This will test both API and Frontend functionality
echo.
node unified-test-runner.js
echo.
pause
goto MENU

:API_TEST
echo.
echo 🔧 Running API Tests Only...
echo.
node comprehensive-hrm-tester.js
echo.
pause
goto MENU

:FRONTEND_TEST
echo.
echo 🎨 Running Frontend Tests Only...
echo.
node frontend-functionality-tester.js
echo.
pause
goto MENU

:HEALTH_CHECK
echo.
echo 🏥 Checking System Health...
echo.
echo Checking Backend (Port 5000)...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend: RUNNING
) else (
    echo ❌ Backend: NOT RUNNING
)

echo.
echo Checking Frontend (Port 3000)...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Frontend: RUNNING
) else (
    echo ❌ Frontend: NOT RUNNING
)

echo.
echo Checking Database Connection...
node -e "
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite:./database.sqlite', { logging: false });
sequelize.authenticate()
  .then(() => console.log('✅ Database: CONNECTED'))
  .catch(() => console.log('❌ Database: NOT CONNECTED'));
" 2>nul

echo.
pause
goto MENU

:QUICK_TEST
echo.
echo ⚡ Running Quick API Test...
echo.
node quick-api-test.js
echo.
pause
goto MENU

:START_SERVICES
echo.
echo 🚀 Starting Backend and Frontend Services...
echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"
echo.
echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul
echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm start"
echo.
echo Both services are starting in separate windows.
echo Wait for them to fully load before running tests.
echo.
pause
goto MENU

:EXIT
echo.
echo Thank you for using HRM System Testing Suite!
echo.
exit /b 0
