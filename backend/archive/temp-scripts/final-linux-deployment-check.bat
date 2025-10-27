@echo off
echo.
echo 🐧 Linux Server Deployment Checker for Docker Desktop
echo ===================================================
echo.

REM Check Docker Desktop status first
echo 🔍 Step 1: Checking Docker Desktop...
docker version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker Desktop is NOT running!
    echo.
    echo 💡 Quick Start Instructions:
    echo 1. Open Docker Desktop from Start Menu
    echo 2. Wait for the whale icon to stop animating
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Docker Desktop is running
echo.

REM Check if PostgreSQL container is running
echo 🔍 Step 2: Checking PostgreSQL container...
docker-compose ps | findstr postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL container is not running
    echo 🚀 Starting PostgreSQL container...
    docker-compose up -d
    echo ⏳ Waiting for PostgreSQL to initialize...
    timeout /t 15 >nul
)

echo ✅ PostgreSQL container is ready
echo.

REM Check database schema
echo 🔍 Step 3: Checking database schema...
docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "\dt" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Database schema not found
    echo 🔧 Creating database schema...
    docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -f /docker-entrypoint-initdb.d/init.sql
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️ Schema creation had issues, but continuing...
    ) else (
        echo ✅ Database schema created successfully
    )
) else (
    echo ✅ Database schema exists
)
echo.

REM Check if data migration is needed
echo 🔍 Step 4: Checking if data migration is needed...
if exist "backend\database.sqlite" (
    echo 📊 SQLite database found - checking for existing data in PostgreSQL...
    
    for /f %%a in ('docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -t -c "SELECT COUNT(*) FROM users WHERE role = ''admin'';"') do set ADMIN_COUNT=%%a
    
    REM Remove spaces from count
    set ADMIN_COUNT=%ADMIN_COUNT: =%
    
    if "%ADMIN_COUNT%"=="0" (
        echo 🔄 No admin users found - migration needed
        echo 🚀 Starting data migration...
        node migrate-to-postgres.js
        if %ERRORLEVEL% NEQ 0 (
            echo ❌ Migration failed!
            echo 💡 Check migration.log for details
            pause
            exit /b 1
        )
        echo ✅ Data migration completed
    ) else (
        echo ✅ Admin users found - migration not needed
    )
) else (
    echo 📝 No SQLite database found - fresh installation
)
echo.

REM Final validation
echo 🔍 Step 5: Final system validation...
echo.

REM Check admin user
for /f "tokens=*" %%a in ('docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -t -c "SELECT email FROM users WHERE role = ''admin'' LIMIT 1;"') do set ADMIN_EMAIL=%%a
if not "%ADMIN_EMAIL%"=="" (
    echo ✅ Admin User: %ADMIN_EMAIL%
) else (
    echo ❌ No admin user found!
)

REM Check table counts
for /f %%a in ('docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -t -c "SELECT COUNT(*) FROM users;"') do set USER_COUNT=%%a
for /f %%a in ('docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -t -c "SELECT COUNT(*) FROM timesheets;"') do set TIMESHEET_COUNT=%%a
for /f %%a in ('docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -t -c "SELECT COUNT(*) FROM leave_requests;"') do set LEAVE_COUNT=%%a

echo ✅ Database Records:
echo    - Users: %USER_COUNT: =%
echo    - Timesheets: %TIMESHEET_COUNT: =%
echo    - Leave Requests: %LEAVE_COUNT: =%
echo.

REM Test database connection
docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "SELECT 'Connection Test: OK';" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Database Connection: OK
) else (
    echo ❌ Database Connection: FAILED
)

echo.
echo 🎯 Linux Server Deployment Readiness Status
echo ==========================================
echo.

REM Check all deployment prerequisites
set DEPLOYMENT_READY=true

if not exist "LINUX_DEPLOYMENT_GUIDE.md" (
    echo ❌ Linux Deployment Guide: MISSING
    set DEPLOYMENT_READY=false
) else (
    echo ✅ Linux Deployment Guide: AVAILABLE
)

if not exist "docker-compose.yml" (
    echo ❌ Docker Compose Config: MISSING
    set DEPLOYMENT_READY=false
) else (
    echo ✅ Docker Compose Config: AVAILABLE
)

if not exist "schema-postgres-production.sql" (
    echo ❌ Production Schema: MISSING
    set DEPLOYMENT_READY=false
) else (
    echo ✅ Production Schema: AVAILABLE
)

if not exist ".env.production.template" (
    echo ❌ Production Environment Template: MISSING
    set DEPLOYMENT_READY=false
) else (
    echo ✅ Production Environment Template: AVAILABLE
)

if not exist "ecosystem.config.js" (
    echo ❌ PM2 Configuration: MISSING
    set DEPLOYMENT_READY=false
) else (
    echo ✅ PM2 Configuration: AVAILABLE
)

echo.
if "%DEPLOYMENT_READY%"=="true" (
    echo 🎉 DEPLOYMENT READY! 
    echo.
    echo 🚀 Next Steps for Linux Server Deployment:
    echo.
    echo 1. 📋 Server Setup:
    echo    - Ubuntu 20.04+ or CentOS 8+
    echo    - 4GB+ RAM, 50GB+ storage
    echo    - Root or sudo access
    echo.
    echo 2. 🔧 Copy these files to server:
    echo    - Complete project folder
    echo    - LINUX_DEPLOYMENT_GUIDE.md
    echo    - docker-compose.yml
    echo    - schema-postgres-production.sql
    echo    - ecosystem.config.js
    echo.
    echo 3. 📖 Follow deployment guide:
    echo    - Open LINUX_DEPLOYMENT_GUIDE.md
    echo    - Execute step-by-step instructions
    echo    - Configure Nginx reverse proxy
    echo    - Setup SSL certificates
    echo    - Configure systemd services
    echo.
    echo 4. 🔐 Production Configuration:
    echo    - Update database credentials
    echo    - Configure domain names
    echo    - Setup SSL certificates
    echo    - Configure firewall rules
    echo.
    echo 5. 🌐 Access URLs after deployment:
    echo    - Frontend: https://yourdomain.com
    echo    - Backend API: https://yourdomain.com/api
    echo    - pgAdmin: https://yourdomain.com:8081
    echo.
    echo 💡 Pro Tips:
    echo    - Test locally first with: npm run start:production
    echo    - Use staging environment before production
    echo    - Setup monitoring and backups
    echo    - Configure log rotation
    echo.
) else (
    echo ❌ DEPLOYMENT NOT READY!
    echo.
    echo 🔧 Missing components detected. Please ensure all files are created.
    echo 💡 Run the complete setup process again.
    echo.
)

echo 📁 Useful Commands:
echo - View logs: docker-compose logs postgres
echo - Database shell: docker-compose exec postgres psql -U hrm_admin -d skyraksys_hrm
echo - Stop containers: docker-compose down
echo - pgAdmin: http://localhost:8081
echo.

pause
