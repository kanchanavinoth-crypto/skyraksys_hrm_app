@echo off
echo ========================================
echo Database Migration with Health Checks
echo ========================================
echo.

cd /d "d:\skyraksys_hrm\backend"

REM Step 1: Check PostgreSQL service
echo [1/5] Checking PostgreSQL service...
sc query postgresql-x64-14 | find "RUNNING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL is not running!
    echo.
    echo Starting PostgreSQL service...
    net start postgresql-x64-14
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to start PostgreSQL
        echo Please start it manually:
        echo 1. Open Services (services.msc)
        echo 2. Find "postgresql-x64-14"
        echo 3. Right-click and Start
        pause
        exit /b 1
    )
    timeout /t 3 >nul
)
echo ✅ PostgreSQL is running
echo.

REM Step 2: Test database connection
echo [2/5] Testing database connection...
node scripts/test-db-connection.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Database connection failed
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. Database credentials in config/config.json
    echo 3. Database "skyraksys_hrm_db" exists
    pause
    exit /b 1
)
echo.

REM Step 3: Check migration status
echo [3/5] Checking migration status...
npx sequelize-cli db:migrate:status
echo.

REM Step 4: Run migration
echo [4/5] Running database migration...
npx sequelize-cli db:migrate

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [5/5] Verifying migration...
    npx sequelize-cli db:migrate:status
    
    echo.
    echo ========================================
    echo ✅ Migration completed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Verify columns in PostgreSQL:
    echo    SELECT column_name FROM information_schema.columns 
    echo    WHERE table_name = 'leave_requests';
    echo.
    echo 2. Restart backend server:
    echo    node server.js
) else (
    echo.
    echo ========================================
    echo ❌ Migration failed!
    echo ========================================
    echo.
    echo Check the error above and try:
    echo 1. Verify database connection
    echo 2. Check migration files in migrations folder
    echo 3. Run with --debug flag for details
)

echo.
pause
