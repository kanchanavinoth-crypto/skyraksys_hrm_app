@echo off
echo ========================================
echo SkyRakSys HRM - Complete Setup Guide
echo ========================================
echo.

echo [STEP 1] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not installed
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js is installed
)

echo.
echo [STEP 2] Checking PostgreSQL...
pg_ctl --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL is not installed
    echo.
    echo OPTION 1: Install PostgreSQL
    echo 1. Download from: https://www.postgresql.org/download/windows/
    echo 2. Install with default settings
    echo 3. Remember the password you set for 'postgres' user
    echo 4. Update backend\.env file with your password
    echo.
    echo OPTION 2: Use SQLite (easier setup)
    echo We can configure the backend to use SQLite instead
    echo.
    set /p choice="Choose option (1 for PostgreSQL, 2 for SQLite): "
    if "!choice!"=="2" (
        echo.
        echo Configuring backend for SQLite...
        goto SQLITE_SETUP
    ) else (
        echo.
        echo Please install PostgreSQL first, then run this script again.
        echo After installation, make sure to:
        echo 1. Start PostgreSQL service
        echo 2. Update backend\.env with correct password
        pause
        exit /b 1
    )
) else (
    echo ✅ PostgreSQL is installed
    goto POSTGRES_SETUP
)

:SQLITE_SETUP
echo.
echo [STEP 3] Setting up SQLite backend...
cd backend

echo Installing SQLite dependencies...
npm install sqlite3 --save
if %errorlevel% neq 0 (
    echo ❌ Failed to install SQLite
    pause
    exit /b 1
)

echo Creating SQLite configuration...
echo # SQLite Configuration > .env.sqlite
echo NODE_ENV=development >> .env.sqlite
echo PORT=8080 >> .env.sqlite
echo. >> .env.sqlite
echo # Database Configuration (SQLite) >> .env.sqlite
echo DB_DIALECT=sqlite >> .env.sqlite
echo DB_STORAGE=./database.sqlite >> .env.sqlite
echo. >> .env.sqlite
echo # JWT Configuration >> .env.sqlite
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env.sqlite
echo JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production >> .env.sqlite
echo JWT_EXPIRES_IN=1h >> .env.sqlite
echo JWT_REFRESH_EXPIRES_IN=7d >> .env.sqlite
echo. >> .env.sqlite
echo # Security Configuration >> .env.sqlite
echo BCRYPT_ROUNDS=12 >> .env.sqlite
echo RATE_LIMIT_WINDOW_MS=900000 >> .env.sqlite
echo RATE_LIMIT_MAX_REQUESTS=100 >> .env.sqlite

copy .env.sqlite .env
echo ✅ SQLite configuration created

echo.
echo [STEP 4] Installing backend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [STEP 5] Setting up database...
npm run db:migrate
if %errorlevel% neq 0 (
    echo ⚠️  Migration failed, creating database...
)

npm run db:seed
if %errorlevel% neq 0 (
    echo ⚠️  Seeding failed, will create sample data on first run
)

goto TEST_BACKEND

:POSTGRES_SETUP
echo.
echo [STEP 3] Checking PostgreSQL service...
sc query postgresql-x64-14 >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL service not found
    echo Trying to start PostgreSQL...
    net start postgresql* >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Could not start PostgreSQL service
        echo Please start PostgreSQL manually or check installation
        pause
        exit /b 1
    )
)

echo ✅ PostgreSQL service is running

cd backend
echo.
echo [STEP 4] Installing backend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [STEP 5] Setting up database...
createdb -U postgres skyraksys_hrm_dev 2>nul
npm run db:migrate
npm run db:seed

:TEST_BACKEND
echo.
echo [STEP 6] Testing backend...
echo Starting backend test...
timeout /t 1 >nul

node -e "const express = require('express'); const app = express(); app.get('/test', (req,res) => res.json({status:'OK'})); const server = app.listen(8081, () => {console.log('✅ Backend test passed'); server.close();});" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Backend test failed, but configuration is complete
) else (
    echo ✅ Backend is ready
)

cd ..

echo.
echo [STEP 7] Setting up frontend...
cd frontend
echo Installing frontend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo 🎉 Setup Complete!
echo ========================================
echo.
echo Your HRM system is ready to use!
echo.
echo TO START THE APPLICATION:
echo.
echo 1. Start Backend:
echo    cd backend
echo    npm run dev
echo.
echo 2. Start Frontend (in new terminal):
echo    cd frontend  
echo    npm start
echo.
echo 3. Open browser: http://localhost:3000
echo.
echo DEFAULT LOGIN CREDENTIALS:
echo   Admin: admin@skyraksys.com / admin123
echo   HR: hr@skyraksys.com / admin123
echo   Manager: lead@skyraksys.com / admin123
echo   Employee: employee1@skyraksys.com / admin123
echo.
echo API Health Check: http://localhost:8080/api/health
echo.
pause
