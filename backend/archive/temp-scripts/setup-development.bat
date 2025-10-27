@echo off
echo ========================================
echo     Skyraksys HRM Development Setup
echo ========================================
echo.

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo [SUCCESS] Node.js !NODE_VERSION! is installed
) else (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

REM Check if PostgreSQL is installed
echo [INFO] Checking PostgreSQL installation...
where psql >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] PostgreSQL is installed
) else (
    echo [WARNING] PostgreSQL not found in PATH. Please ensure PostgreSQL 14+ is installed.
)

REM Setup Backend
echo [INFO] Setting up backend...
cd backend
if not exist backend (
    echo [ERROR] Backend directory not found
    pause
    exit /b 1
)

echo [INFO] Installing backend dependencies...
call npm install

REM Check if .env exists
if not exist ".env" (
    echo [INFO] Creating .env file from template...
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo [WARNING] Please update .env file with your database credentials
    ) else (
        echo [WARNING] .env.example not found. Please create .env file manually
    )
) else (
    echo [SUCCESS] .env file already exists
)

cd ..
echo [SUCCESS] Backend setup completed

REM Setup Frontend
echo [INFO] Setting up frontend...
cd frontend
if not exist frontend (
    echo [ERROR] Frontend directory not found
    pause
    exit /b 1
)

echo [INFO] Installing frontend dependencies...
call npm install

cd ..
echo [SUCCESS] Frontend setup completed

REM Create database setup instructions
echo [INFO] Creating database setup instructions...
(
echo # Database Setup Instructions
echo.
echo ## 1. Create PostgreSQL Database
echo.
echo ```sql
echo -- Connect to PostgreSQL as superuser
echo -- CREATE DATABASE skyraksys_hrm;
echo -- CREATE USER hrm_user WITH ENCRYPTED PASSWORD 'your_secure_password';
echo -- GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_user;
echo ```
echo.
echo ## 2. Update Backend .env File
echo.
echo ```env
echo # Database Configuration
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=skyraksys_hrm
echo DB_USER=hrm_user
echo DB_PASSWORD=your_secure_password
echo.
echo # JWT Configuration
echo JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
echo JWT_REFRESH_SECRET=your_super_secret_refresh_key_minimum_32_characters
echo JWT_EXPIRE=24h
echo JWT_REFRESH_EXPIRE=7d
echo.
echo # Server Configuration
echo PORT=8080
echo NODE_ENV=development
echo.
echo # CORS Configuration
echo CORS_ORIGIN=http://localhost:3000
echo ```
echo.
echo ## 3. Run Database Migrations
echo.
echo ```bash
echo cd backend
echo npx sequelize-cli db:migrate
echo npx sequelize-cli db:seed:all
echo ```
echo.
echo ## 4. Start Development Servers
echo.
echo ```bash
echo # Terminal 1 - Backend
echo cd backend
echo npm run dev
echo.
echo # Terminal 2 - Frontend
echo cd frontend
echo npm start
echo ```
echo.
echo ## Default Login Credentials
echo.
echo - **Admin**: admin@skyraksys.com / Admin@123
echo - **HR**: hr@skyraksys.com / Hr@123
echo - **Manager**: manager@skyraksys.com / Manager@123
echo - **Employee**: employee@skyraksys.com / Employee@123
) > setup-database-instructions.md

echo [SUCCESS] Database setup instructions created: setup-database-instructions.md

REM Create development batch files
echo [INFO] Creating development scripts...

REM Backend start script
(
echo @echo off
echo echo Starting Skyraksys HRM Backend...
echo cd backend
echo npm run dev
echo pause
) > start-backend.bat

REM Frontend start script
(
echo @echo off
echo echo Starting Skyraksys HRM Frontend...
echo cd frontend
echo npm start
echo pause
) > start-frontend.bat

REM Combined start script
(
echo @echo off
echo echo Starting Skyraksys HRM Full Development Environment...
echo echo.
echo echo [INFO] Starting backend server...
echo start "Backend Server" cmd /k "cd backend && npm run dev"
echo.
echo echo [INFO] Waiting 5 seconds for backend to start...
echo timeout /t 5 /nobreak
echo.
echo echo [INFO] Starting frontend server...
echo start "Frontend Server" cmd /k "cd frontend && npm start"
echo.
echo echo [SUCCESS] Both servers are starting in separate windows
echo echo Press any key to close this window...
echo pause
) > start-dev.bat

echo [SUCCESS] Development scripts created

echo.
echo ==========================================
echo [SUCCESS] Setup completed successfully!
echo ==========================================
echo.
echo 📋 Next Steps:
echo 1. Follow instructions in setup-database-instructions.md
echo 2. Update backend\.env with your database credentials
echo 3. Run: start-dev.bat to start both servers
echo.
echo 🌐 URLs:
echo   Backend:  http://localhost:8080
echo   Frontend: http://localhost:3000
echo.
echo 📚 Documentation:
echo   Backend:  backend\README-REFACTORED-COMPLETE.md
echo   API Docs: http://localhost:8080/ (when running)
echo.
echo Press any key to continue...
pause
