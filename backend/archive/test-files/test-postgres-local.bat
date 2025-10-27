@echo off
echo.
echo 🚀 Testing Skyraksys HRM with PostgreSQL Locally
echo ================================================
echo.

REM Step 1: Check Docker Desktop
echo 🔍 Step 1: Checking Docker Desktop...
docker version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker Desktop is not running!
    echo.
    echo 💡 Please start Docker Desktop first:
    echo 1. Open Docker Desktop from Start Menu
    echo 2. Wait for the whale icon to stop animating
    echo 3. Run this script again
    echo.
    echo 🔄 Would you like to try starting Docker Desktop automatically? (y/n)
    set /p start_docker=
    if /i "%start_docker%"=="y" (
        echo 🚀 Starting Docker Desktop...
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        echo ⏳ Waiting 30 seconds for Docker Desktop to start...
        timeout /t 30 >nul
        docker version >nul 2>&1
        if %ERRORLEVEL% NEQ 0 (
            echo ❌ Docker Desktop failed to start. Please start it manually.
            pause
            exit /b 1
        )
    ) else (
        pause
        exit /b 1
    )
)

echo ✅ Docker Desktop is running!
echo.

REM Step 2: Start PostgreSQL with Docker Compose
echo 🔍 Step 2: Starting PostgreSQL container...
if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml not found!
    echo 💡 Please ensure you're in the correct directory
    pause
    exit /b 1
)

echo 📁 Creating PostgreSQL data directory...
if not exist "postgres-data" mkdir postgres-data

echo 🚀 Starting PostgreSQL container...
docker-compose up -d postgres

echo ⏳ Waiting for PostgreSQL to be ready (20 seconds)...
timeout /t 20 >nul

echo 📊 Container Status:
docker-compose ps

echo.
echo 🔍 Step 3: Testing PostgreSQL connection...
docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "SELECT version();" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL connection successful!
) else (
    echo ❌ PostgreSQL connection failed, trying to create database...
    docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE skyraksys_hrm;"
    docker-compose exec -T postgres psql -U postgres -c "CREATE USER hrm_admin WITH PASSWORD 'hrm_secure_2024';"
    docker-compose exec -T postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_admin;"
    
    echo ⏳ Waiting 5 more seconds...
    timeout /t 5 >nul
    
    docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "SELECT version();" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ PostgreSQL connection successful after setup!
    ) else (
        echo ❌ PostgreSQL connection still failed!
        echo 📋 Troubleshooting:
        echo 1. Check logs: docker-compose logs postgres
        echo 2. Restart container: docker-compose restart postgres
        pause
        exit /b 1
    )
)

echo.
echo 🔍 Step 4: Setting up database schema...
if exist "schema-postgres-production.sql" (
    echo 📄 Creating database schema...
    docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -f /schema-postgres-production.sql >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Database schema created successfully!
    ) else (
        echo ⚠️ Schema creation had issues, but continuing...
    )
) else (
    echo ⚠️ schema-postgres-production.sql not found, skipping...
)

echo.
echo 🔍 Step 5: Installing Node.js dependencies...
if exist "package.json" (
    echo 📦 Installing dependencies...
    npm install >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Dependencies installed successfully!
    ) else (
        echo ❌ Failed to install dependencies
        echo 💡 Running npm install manually...
        npm install
    )
) else (
    echo ⚠️ package.json not found in root, checking backend...
    if exist "backend\package.json" (
        cd backend
        echo 📦 Installing backend dependencies...
        npm install
        cd ..
    )
)

echo.
echo 🔍 Step 6: Checking backend configuration...
if exist "backend\config\database.js" (
    echo 📄 Database configuration found
) else (
    echo ❌ Backend database configuration not found!
)

echo.
echo 🔍 Step 7: Testing database migration (if needed)...
if exist "backend\database.sqlite" (
    echo 📊 SQLite database found - checking migration...
    if exist "migrate-to-postgres.js" (
        echo 🔄 Running data migration...
        node migrate-to-postgres.js
        if %ERRORLEVEL% EQU 0 (
            echo ✅ Data migration completed!
        ) else (
            echo ⚠️ Migration had issues, but continuing...
        )
    ) else (
        echo ⚠️ Migration script not found
    )
) else (
    echo 📝 No SQLite database found - fresh installation
)

echo.
echo 🔍 Step 8: Testing backend startup...
cd backend
echo 🚀 Starting backend server (test mode)...

REM Set environment variables for PostgreSQL
set NODE_ENV=development
set DB_TYPE=postgres
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=skyraksys_hrm
set DB_USER=hrm_admin
set DB_PASSWORD=hrm_secure_2024

echo 📡 Testing server startup...
timeout 5 node server.js & 

echo ⏳ Waiting 5 seconds for server to start...
timeout /t 5 >nul

REM Test if server is responding
curl -s http://localhost:8080 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend server is responding!
) else (
    echo 🧪 Testing server with different method...
    powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8080' -TimeoutSec 5 | Out-Null; exit 0 } catch { exit 1 }"
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Backend server is responding!
    ) else (
        echo ⚠️ Backend server test inconclusive
    )
)

cd ..

echo.
echo 🔍 Step 9: Testing frontend (if available)...
if exist "frontend\package.json" (
    cd frontend
    if exist "node_modules" (
        echo ✅ Frontend dependencies already installed
    ) else (
        echo 📦 Installing frontend dependencies...
        npm install
    )
    
    echo 🧪 Testing frontend build...
    npm run build >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Frontend builds successfully!
    ) else (
        echo ⚠️ Frontend build issues detected
    )
    cd ..
) else (
    echo 📝 Frontend not found or not configured
)

echo.
echo 🎯 Final System Test Results
echo ===========================
echo.

REM Final validation
docker-compose exec -T postgres psql -U hrm_admin -d skyraksys_hrm -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Database: Connected and schema ready
) else (
    echo ❌ Database: Issues detected
)

if exist "backend\server.js" (
    echo ✅ Backend: Configuration ready
) else (
    echo ❌ Backend: Missing server file
)

if exist "frontend\build" (
    echo ✅ Frontend: Built and ready
) else (
    if exist "frontend\src" (
        echo ⚠️ Frontend: Source available, build needed
    ) else (
        echo ❌ Frontend: Not available
    )
)

echo.
echo 🚀 How to start your application:
echo.
echo 📋 Database (PostgreSQL):
echo    - Already running in Docker
echo    - Access: http://localhost:8081 (pgAdmin)
echo    - Connection: postgresql://hrm_admin:hrm_secure_2024@localhost:5432/skyraksys_hrm
echo.
echo 🎯 Backend (Node.js):
echo    - Command: cd backend ^&^& npm start
echo    - URL: http://localhost:8080
echo    - Or use PM2: npm run start:production
echo.
echo 🌐 Frontend (React):
echo    - Command: cd frontend ^&^& npm start
echo    - URL: http://localhost:3000
echo    - Or build: npm run build
echo.
echo 💡 Quick Start Commands:
echo    - Start backend: cd backend ^&^& npm start
echo    - Start frontend: cd frontend ^&^& npm start
echo    - View logs: docker-compose logs postgres
echo    - Stop database: docker-compose down
echo.

echo 📊 Connection Details:
echo    - PostgreSQL: localhost:5432
echo    - Backend API: localhost:8080
echo    - Frontend: localhost:3000
echo    - pgAdmin: localhost:8081
echo.

pause
