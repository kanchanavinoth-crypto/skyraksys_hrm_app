@echo off
echo.
echo ========================================
echo SkyrakSys HRM - Local PostgreSQL Setup
echo ========================================
echo.

echo 💡 This script will set up PostgreSQL locally without Docker
echo.

REM Check if PostgreSQL is installed
echo 🔍 Step 1: Checking for local PostgreSQL installation...
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL is not installed locally!
    echo.
    echo 📥 Please install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo.
    echo 🔧 Alternative options:
    echo 1. Install PostgreSQL locally ^(recommended^)
    echo 2. Start Docker Desktop and run: docker-compose up -d postgres
    echo 3. Use cloud database ^(see cloud-database-guide.bat^)
    echo.
    echo 🚀 For now, let's configure for cloud database or keep SQLite...
    echo.
    pause
    exit /b 1
) else (
    echo ✅ PostgreSQL is installed locally!
)

REM Test PostgreSQL connection
echo.
echo 🔍 Step 2: Testing PostgreSQL connection...
psql --version
echo.

echo 🛠️ Step 3: Setting up database and user...
echo.
echo Please run these commands in PostgreSQL:
echo.
echo CREATE DATABASE skyraksys_hrm;
echo CREATE USER hrm_admin WITH PASSWORD 'hrm_secure_2024';
echo GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_admin;
echo.

REM Configure backend for PostgreSQL
echo 🔧 Step 4: Configuring backend for local PostgreSQL...
cd backend

REM Create PostgreSQL .env configuration
echo # Local PostgreSQL Configuration > .env.postgres.local
echo NODE_ENV=development >> .env.postgres.local
echo PORT=8080 >> .env.postgres.local
echo. >> .env.postgres.local
echo # Database Configuration ^(Local PostgreSQL^) >> .env.postgres.local
echo DB_HOST=localhost >> .env.postgres.local
echo DB_PORT=5432 >> .env.postgres.local
echo DB_NAME=skyraksys_hrm >> .env.postgres.local
echo DB_USER=hrm_admin >> .env.postgres.local
echo DB_PASSWORD=hrm_secure_2024 >> .env.postgres.local
echo DB_DIALECT=postgres >> .env.postgres.local
echo DB_SSL=false >> .env.postgres.local
echo. >> .env.postgres.local
echo # JWT Configuration >> .env.postgres.local
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env.postgres.local
echo JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production >> .env.postgres.local
echo JWT_EXPIRES_IN=1h >> .env.postgres.local
echo JWT_REFRESH_EXPIRES_IN=7d >> .env.postgres.local
echo. >> .env.postgres.local
echo # Security Configuration >> .env.postgres.local
echo BCRYPT_ROUNDS=12 >> .env.postgres.local
echo RATE_LIMIT_WINDOW_MS=900000 >> .env.postgres.local
echo RATE_LIMIT_MAX_REQUESTS=100 >> .env.postgres.local

REM Backup current .env
if exist ".env" (
    copy ".env" ".env.sqlite.backup"
    echo 💾 Current .env backed up as .env.sqlite.backup
)

echo.
echo 📦 Step 5: Installing PostgreSQL dependencies...
npm install pg pg-hstore --save

echo.
echo ✅ Local PostgreSQL setup completed!
echo.
echo 📋 Next steps:
echo 1. Create the database and user in PostgreSQL
echo 2. Copy .env.postgres.local to .env: copy .env.postgres.local .env
echo 3. Test connection: node -e "require('./models').sequelize.authenticate().then(() => console.log('Connected!')).catch(err => console.log('Error:', err))"
echo 4. Start your backend: node server.js
echo.

pause
