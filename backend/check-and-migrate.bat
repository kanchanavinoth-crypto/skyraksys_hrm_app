@echo off
echo ========================================
echo Database Migration Check & Setup
echo ========================================
echo.

cd /d "d:\skyraksys_hrm\backend"

echo [1/4] Checking migration status...
echo.
call npx sequelize-cli db:migrate:status

echo.
echo [2/4] Current pending migrations...
echo.

echo [3/4] Running ALL pending migrations...
echo.
call npx sequelize-cli db:migrate

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ ALL Migrations completed!
    echo ========================================
    echo.
    echo [4/4] Verifying database schema...
    node scripts/verify-schema.js
) else (
    echo.
    echo ========================================
    echo ❌ Migration failed!
    echo ========================================
    echo.
    echo The leave_requests table does not exist.
    echo This means initial migrations have not been run.
    echo.
    echo Solution: Run database sync first
    echo   node scripts/setup-database.js
)

pause
