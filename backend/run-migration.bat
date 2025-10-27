@echo off
echo ========================================
echo Running Leave Cancellation Migration
echo ========================================
echo.

cd /d "d:\skyraksys_hrm\backend"

echo Current directory: %CD%
echo.

echo Checking Sequelize CLI installation...
call npx sequelize-cli --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Sequelize CLI not found. Installing...
    call npm install --save-dev sequelize-cli
)

echo.
echo Running pending migrations...
call npx sequelize-cli db:migrate

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo ✅ Migration completed successfully!
    echo ========================================
    echo.
    echo Verifying columns were added...
    call npx sequelize-cli db:migrate:status
) else (
    echo ========================================
    echo ❌ Migration failed with error code %ERRORLEVEL%
    echo ========================================
    echo.
    echo Run with --debug flag for more details:
    echo npx sequelize-cli db:migrate --debug
)

echo.
pause
