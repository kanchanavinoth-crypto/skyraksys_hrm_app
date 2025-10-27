@echo off
echo Installing database utility dependencies...

cd backend

:: Check if npm is available
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH
    exit /b 1
)

:: Create scripts directory if it doesn't exist
if not exist "scripts\database" (
    mkdir "scripts\database"
)

:: Install required dependencies
call npm install rimraf sequelize-erd --save-dev
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    exit /b 1
)

:: Create docs directory for database diagrams
if not exist "docs" (
    mkdir "docs"
)

:: Create backups directory
if not exist "backups" (
    mkdir "backups"
)

echo ✅ Setup completed successfully!
echo.
echo Available database commands:
echo   npm run db:backup         - Backup database
echo   npm run db:restore        - Restore database
echo   npm run db:check         - Run database health checks
echo   npm run db:maintenance   - Perform database maintenance
echo   npm run db:optimize      - Optimize database performance
echo   npm run db:diagram       - Generate database diagram
echo.
echo For development:
echo   npm run seed:minimal     - Load minimal dataset
echo   npm run seed:full        - Load full dataset
echo   npm run seed:test        - Load test dataset

exit /b 0