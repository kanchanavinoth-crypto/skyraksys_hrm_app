@echo off
echo.
echo ========================================
echo SkyrakSys HRM - PostgreSQL Implementation
echo ========================================
echo.

REM Check if Docker Desktop is running
echo 🔍 Step 1: Checking Docker Desktop...
docker version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker Desktop is NOT running!
    echo.
    echo 💡 Please start Docker Desktop and run this script again.
    echo.
    pause
    exit /b 1
)
echo ✅ Docker Desktop is running

REM Start PostgreSQL container
echo.
echo 🚀 Step 2: Starting PostgreSQL container...
docker-compose up -d postgres

REM Wait for PostgreSQL to be ready
echo.
echo ⏳ Step 3: Waiting for PostgreSQL to initialize...
timeout /t 15 >nul

REM Test connection
echo.
echo 🔍 Step 4: Testing PostgreSQL connection...
docker-compose exec -T postgres pg_isready -U hrm_admin -d skyraksys_hrm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL is ready and accessible!
) else (
    echo ⚠️ PostgreSQL is starting up, trying again...
    timeout /t 10 >nul
    docker-compose exec -T postgres pg_isready -U hrm_admin -d skyraksys_hrm >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ PostgreSQL is now ready!
    ) else (
        echo ❌ PostgreSQL connection failed!
        echo 📋 Check logs: docker-compose logs postgres
        pause
        exit /b 1
    )
)

REM Update backend configuration
echo.
echo 🔧 Step 5: Updating backend configuration for PostgreSQL...
cd backend

REM Create PostgreSQL .env file
echo # PostgreSQL Configuration > .env.postgres
echo NODE_ENV=development >> .env.postgres
echo PORT=8080 >> .env.postgres
echo. >> .env.postgres
echo # Database Configuration >> .env.postgres
echo DB_HOST=localhost >> .env.postgres
echo DB_PORT=5432 >> .env.postgres
echo DB_NAME=skyraksys_hrm >> .env.postgres
echo DB_USER=hrm_admin >> .env.postgres
echo DB_PASSWORD=hrm_secure_2024 >> .env.postgres
echo DB_DIALECT=postgres >> .env.postgres
echo. >> .env.postgres
echo # JWT Configuration >> .env.postgres
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env.postgres
echo JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production >> .env.postgres
echo JWT_EXPIRES_IN=1h >> .env.postgres
echo JWT_REFRESH_EXPIRES_IN=7d >> .env.postgres
echo. >> .env.postgres
echo # Security Configuration >> .env.postgres
echo BCRYPT_ROUNDS=12 >> .env.postgres
echo RATE_LIMIT_WINDOW_MS=900000 >> .env.postgres
echo RATE_LIMIT_MAX_REQUESTS=100 >> .env.postgres

REM Backup current .env and switch to PostgreSQL
if exist ".env" (
    copy ".env" ".env.sqlite.backup"
    echo 💾 Current .env backed up as .env.sqlite.backup
)
copy ".env.postgres" ".env"
echo ✅ Backend configured for PostgreSQL

REM Install PostgreSQL dependencies
echo.
echo 📦 Step 6: Installing PostgreSQL dependencies...
npm install pg pg-hstore --save

REM Migrate data from SQLite if it exists
echo.
echo 🔄 Step 7: Checking for data migration...
cd ..
if exist "backend\database.sqlite" (
    echo 📊 SQLite database found - migrating data to PostgreSQL...
    if exist "migrate-to-postgres.js" (
        node migrate-to-postgres.js
        if %ERRORLEVEL% EQU 0 (
            echo ✅ Data migration completed successfully!
        ) else (
            echo ⚠️ Data migration had issues, will create fresh data
        )
    ) else (
        echo ⚠️ Migration script not found, will create fresh data
    )
) else (
    echo 📝 No SQLite database found - will create fresh data
)

echo.
echo 🎉 PostgreSQL Implementation Complete!
echo ========================================
echo.
echo ✅ PostgreSQL Server: Running on port 5432
echo ✅ Database: skyraksys_hrm
echo ✅ User: hrm_admin
echo ✅ Backend: Configured for PostgreSQL
echo.
echo 🌐 Management URLs:
echo - pgAdmin: http://localhost:8081
echo   Email: admin@skyraksys.com
echo   Password: admin123
echo.
echo 🚀 To start your HRM application:
echo   cd backend
echo   node server.js
echo.
echo 📋 Useful Commands:
echo - View DB logs: docker-compose logs postgres
echo - Stop PostgreSQL: docker-compose down
echo - Restart PostgreSQL: docker-compose restart postgres
echo.
pause
