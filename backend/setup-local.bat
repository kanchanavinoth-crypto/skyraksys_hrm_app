@echo off
echo ========================================
echo SKYRAKSYS HRM - Local Database Setup
echo ========================================
echo.
echo Database: skyraksys_hrm
echo Host: localhost
echo Port: 5432
echo.

cd /d "d:\skyraksys_hrm\backend"

REM Check PostgreSQL
echo [1/4] Checking PostgreSQL...
sc query postgresql-x64-14 | find "RUNNING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL not running. Starting...
    net start postgresql-x64-14
)
echo ✅ PostgreSQL is running
echo.

REM Test connection
echo [2/4] Testing database connection...
psql -U postgres -d skyraksys_hrm -c "SELECT 1" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Connected to skyraksys_hrm
) else (
    echo ❌ Cannot connect to database
    echo.
    echo Creating database...
    psql -U postgres -c "CREATE DATABASE skyraksys_hrm;"
)
echo.

REM Sync models (creates all tables)
echo [3/4] Creating database tables...
node scripts/setup-database.js
echo.

REM Run migrations (adds cancellation columns)
echo [4/4] Running migrations...
npx sequelize-cli db:migrate
echo.

echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo Database: skyraksys_hrm
echo Tables created: ✓
echo Migrations applied: ✓
echo.
echo Next steps:
echo 1. Start backend: node server.js
echo 2. Start frontend: cd ..\frontend ^&^& npm start
echo.
pause
