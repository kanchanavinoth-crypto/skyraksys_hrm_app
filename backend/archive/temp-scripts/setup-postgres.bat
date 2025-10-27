@echo off
echo.
echo 🐳 Starting Docker Desktop and PostgreSQL Setup
echo ===============================================
echo.

REM Check if Docker Desktop is running
echo 🔍 Checking Docker Desktop status...
docker version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker Desktop is not running!
    echo.
    echo � Please follow these steps:
    echo 1. Start Docker Desktop from Start Menu or Desktop
    echo 2. Wait for Docker Desktop to fully start ^(whale icon should be steady^)
    echo 3. Run this script again
    echo.
    echo 💡 If Docker Desktop is not installed:
    echo 1. Download from: https://www.docker.com/products/docker-desktop
    echo 2. Install Docker Desktop
    echo 3. Restart your computer
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Docker Desktop is running!
echo.

REM Create PostgreSQL data directory
echo 📁 Creating PostgreSQL data directory...
if not exist "postgres-data" mkdir postgres-data

REM Start PostgreSQL container
echo 🚀 Starting PostgreSQL container...
docker-compose up -d

REM Wait for PostgreSQL to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
timeout /t 15 >nul

REM Check container status
echo � Container Status:
docker-compose ps

echo.
echo 🧪 Testing PostgreSQL connection...
docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "SELECT version();"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ PostgreSQL is ready!
    echo.
    echo 📋 Connection Details:
    echo Host: localhost
    echo Port: 5432
    echo Database: skyraksys_hrm
    echo Username: hrm_admin
    echo Password: hrm_secure_2024
    echo.
    echo 🌐 pgAdmin Access:
    echo URL: http://localhost:8081
    echo Email: admin@skyraksys.com
    echo Password: admin123
    echo.
    echo 🎯 Next Steps:
    echo 1. Run schema setup: docker-compose exec postgres psql -U hrm_admin -d skyraksys_hrm -f /docker-entrypoint-initdb.d/schema-postgres-production.sql
    echo 2. Run: node migrate-to-postgres.js to migrate data from SQLite
    echo 3. Update backend configuration to use PostgreSQL
    echo.
) else (
    echo.
    echo ❌ PostgreSQL connection failed!
    echo.
    echo 🔧 Troubleshooting:
    echo 1. Check Docker logs: docker-compose logs postgres
    echo 2. Restart containers: docker-compose restart
    echo 3. Check if port 5432 is available: netstat -an ^| findstr 5432
    echo.
)

echo.
echo 📝 Useful Commands:
echo - View logs: docker-compose logs postgres
echo - Stop containers: docker-compose down
echo - Restart: docker-compose restart
echo - Connect to PostgreSQL: docker-compose exec postgres psql -U hrm_admin -d skyraksys_hrm
echo.

pause
docker-compose up -d postgres

REM Wait for PostgreSQL to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

REM Check if PostgreSQL is responding
echo 🔍 Checking PostgreSQL connection...
:check_postgres
docker exec skyraksys_hrm_postgres pg_isready -U hrm_user -d skyraksys_hrm >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto check_postgres
)

echo ✅ PostgreSQL is ready!
echo.
echo 📊 Database Information:
echo   Host: localhost
echo   Port: 5432
echo   Database: skyraksys_hrm
echo   Username: hrm_user
echo   Password: hrm_password_2025
echo.
echo 🎯 Next steps:
echo   1. Run database migrations: npm run migrate
echo   2. Run database seeders: npm run seed
echo   3. Start the application: npm start
echo.
echo 🔧 Optional: Start pgAdmin for database management:
echo   docker-compose up -d pgadmin
echo   Access at: http://localhost:8081
echo   Email: admin@skyraksys.com
echo   Password: admin123

pause
