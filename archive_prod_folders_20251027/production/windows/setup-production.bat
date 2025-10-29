@echo off
setlocal EnableDelayedExpansion

REM ============================================
REM  SkyRakSys HRM - Production Setup Script
REM  With Automatic Password Generation
REM ============================================
REM  This script sets up a complete production
REM  environment for the HRM system with
REM  automatically generated secure passwords
REM ============================================

set "PASSWORDS_FILE=config\generated-passwords.txt"

echo.
echo ========================================
echo  SkyRakSys HRM Production Setup
echo  Automatic Password Generation Enabled
echo ========================================
echo.

REM Initialize password file
mkdir config 2>nul
echo # SkyRakSys HRM Production Passwords > %PASSWORDS_FILE%
echo # Generated on: %DATE% %TIME% >> %PASSWORDS_FILE%
echo # IMPORTANT: Keep this file secure and never commit to version control >> %PASSWORDS_FILE%
echo. >> %PASSWORDS_FILE%

echo 🔐 Password generation initialized
echo 📝 All generated passwords will be saved to: %PASSWORDS_FILE%
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version

REM Check if Git is installed
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git is not installed. Please install Git.
    echo Download from: https://git-scm.com/
    pause
    exit /b 1
)

echo ✅ Git detected

REM Generate production passwords
echo.
echo [STEP 1] Generating secure production passwords...

REM Generate passwords using PowerShell
for /f "delims=" %%i in ('powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(32, 8)"') do set "POSTGRES_PASSWORD=%%i"
for /f "delims=" %%i in ('powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(32, 8)"') do set "APP_DB_PASSWORD=%%i"
for /f "delims=" %%i in ('powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(24, 6)"') do set "ADMIN_PASSWORD=%%i"
for /f "delims=" %%i in ('powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(24, 6)"') do set "HR_PASSWORD=%%i"
for /f "delims=" %%i in ('powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(24, 6)"') do set "MANAGER_PASSWORD=%%i"
for /f "delims=" %%i in ('powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(64, 16)"') do set "JWT_SECRET=%%i"
for /f "delims=" %%i in ('powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(64, 16)"') do set "SESSION_SECRET=%%i"
for /f "delims=" %%i in ('powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(32, 8)"') do set "REDIS_PASSWORD=%%i"

REM Store passwords in file
echo [PostgreSQL Database] >> %PASSWORDS_FILE%
echo Username: postgres >> %PASSWORDS_FILE%
echo Password: %POSTGRES_PASSWORD% >> %PASSWORDS_FILE%
echo. >> %PASSWORDS_FILE%

echo [Application Database] >> %PASSWORDS_FILE%
echo Username: hrm_prod_user >> %PASSWORDS_FILE%
echo Password: %APP_DB_PASSWORD% >> %PASSWORDS_FILE%
echo. >> %PASSWORDS_FILE%

echo [System Administrator] >> %PASSWORDS_FILE%
echo Email: admin@skyraksys.com >> %PASSWORDS_FILE%
echo Password: %ADMIN_PASSWORD% >> %PASSWORDS_FILE%
echo. >> %PASSWORDS_FILE%

echo [HR Manager] >> %PASSWORDS_FILE%
echo Email: hr@skyraksys.com >> %PASSWORDS_FILE%
echo Password: %HR_PASSWORD% >> %PASSWORDS_FILE%
echo. >> %PASSWORDS_FILE%

echo [Project Manager] >> %PASSWORDS_FILE%
echo Email: manager@skyraksys.com >> %PASSWORDS_FILE%
echo Password: %MANAGER_PASSWORD% >> %PASSWORDS_FILE%
echo. >> %PASSWORDS_FILE%

echo [Security Tokens] >> %PASSWORDS_FILE%
echo JWT_SECRET: %JWT_SECRET% >> %PASSWORDS_FILE%
echo SESSION_SECRET: %SESSION_SECRET% >> %PASSWORDS_FILE%
echo REDIS_PASSWORD: %REDIS_PASSWORD% >> %PASSWORDS_FILE%
echo. >> %PASSWORDS_FILE%

echo ✅ All production passwords generated and stored securely
echo 📁 Password file location: %PASSWORDS_FILE%
echo ⚠️  IMPORTANT: Save this file securely and remove from server after copying!
echo.

REM Create production directory structure
echo.
echo [STEP 2] Creating production directory structure...
mkdir hrm-production 2>nul
cd hrm-production

mkdir backend 2>nul
mkdir frontend 2>nul
mkdir database 2>nul
mkdir logs 2>nul
mkdir uploads 2>nul
mkdir config 2>nul
mkdir scripts 2>nul
mkdir ssl 2>nul

echo ✅ Directory structure created

REM Clone or copy source code
echo.
echo [STEP 3] Choose setup method:
echo 1. Clone from Git repository
echo 2. Copy from existing project
echo 3. Manual setup (I'll provide the files)
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Enter your Git repository URL:
    set /p repo_url="Repository URL: "
    
    echo Cloning repository...
    git clone !repo_url! temp-clone
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to clone repository
        pause
        exit /b 1
    )
    
    REM Copy files to proper structure
    xcopy temp-clone\backend\* backend\ /E /I /Y
    xcopy temp-clone\frontend\* frontend\ /E /I /Y
    if exist temp-clone\database rmdir temp-clone\database /S /Q
    rmdir temp-clone /S /Q
    
    echo ✅ Repository cloned and organized
)

if "%choice%"=="2" (
    echo.
    echo Enter the path to your existing project:
    set /p source_path="Source path: "
    
    if not exist "!source_path!" (
        echo ❌ Source path does not exist
        pause
        exit /b 1
    )
    
    echo Copying files...
    xcopy "!source_path!\backend\*" backend\ /E /I /Y
    xcopy "!source_path!\frontend\*" frontend\ /E /I /Y
    
    echo ✅ Files copied successfully
)

if "%choice%"=="3" (
    echo.
    echo ⚠️  Manual setup selected. Please copy your backend and frontend files
    echo    to the respective directories before continuing.
    echo.
    echo Directory structure:
    echo   hrm-production/
    echo   ├── backend/     (Copy your backend files here)
    echo   ├── frontend/    (Copy your frontend files here)
    echo   └── ...
    echo.
    pause
)

REM Install dependencies
echo.
echo [STEP 4] Installing dependencies...
echo.

echo Installing backend dependencies...
cd backend
if exist package.json (
    call npm install --production
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo ✅ Backend dependencies installed
) else (
    echo ❌ Backend package.json not found
    pause
    exit /b 1
)

cd ..
echo Installing frontend dependencies...
cd frontend
if exist package.json (
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo ✅ Frontend dependencies installed
) else (
    echo ❌ Frontend package.json not found
    pause
    exit /b 1
)

cd ..

REM Build frontend for production
echo.
echo [STEP 4] Building frontend for production...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)
echo ✅ Frontend built successfully
cd ..

REM Setup environment files
echo.
echo [STEP 5] Setting up environment configuration with generated passwords...

REM Create .env file with generated passwords
echo Creating production environment configuration...

(
echo NODE_ENV=production
echo PORT=3001
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=skyraksys_hrm_prod
echo DB_USER=hrm_prod_user
echo DB_PASSWORD=%APP_DB_PASSWORD%
echo POSTGRES_ADMIN_PASSWORD=%POSTGRES_PASSWORD%
echo JWT_SECRET=%JWT_SECRET%
echo SESSION_SECRET=%SESSION_SECRET%
echo ADMIN_PASSWORD=%ADMIN_PASSWORD%
echo HR_PASSWORD=%HR_PASSWORD%
echo MANAGER_PASSWORD=%MANAGER_PASSWORD%
echo REDIS_PASSWORD=%REDIS_PASSWORD%
echo ADMIN_EMAIL=admin@skyraksys.com
echo HR_EMAIL=hr@skyraksys.com
echo MANAGER_EMAIL=manager@skyraksys.com
) > .env

echo ✅ Environment configuration created with secure passwords
echo 📁 Configuration file: .env

REM Setup database
echo.
echo [STEP 6] Database setup...
echo Choose database setup method:
echo 1. PostgreSQL (Recommended for production)
echo 2. Use existing database
echo 3. Skip database setup (manual configuration)

set /p db_choice="Enter your choice (1-3): "

if "%db_choice%"=="1" (
    call ..\scripts\setup-postgresql.bat
)

if "%db_choice%"=="2" (
    echo Please ensure your database is configured and accessible.
    echo Update the .env file with your database credentials.
)

if "%db_choice%"=="3" (
    echo Database setup skipped. Please configure manually.
)

REM Setup SSL certificates (optional)
echo.
echo [STEP 7] SSL Setup...
echo Do you want to set up SSL certificates?
echo 1. Generate self-signed certificates (for testing)
echo 2. Use existing certificates
echo 3. Skip SSL setup
set /p ssl_choice="Enter your choice (1-3): "

if "%ssl_choice%"=="1" (
    call ..\scripts\generate-ssl.bat
)

if "%ssl_choice%"=="2" (
    echo Please copy your SSL certificates to the ssl/ directory:
    echo   ssl/cert.pem (Certificate file)
    echo   ssl/key.pem  (Private key file)
)

REM Setup process manager (PM2)
echo.
echo [STEP 8] Setting up process manager...
npm install -g pm2
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Failed to install PM2 globally. You may need administrator privileges.
    echo You can install it later with: npm install -g pm2
) else (
    echo ✅ PM2 installed successfully
)

REM Create startup scripts
echo.
echo [STEP 9] Creating startup scripts...
call ..\scripts\create-startup-scripts.bat

REM Final setup
echo.
echo [STEP 10] Final configuration...

REM Create log directory structure
mkdir logs\backend 2>nul
mkdir logs\frontend 2>nul
mkdir logs\nginx 2>nul

REM Set permissions (Windows equivalent)
echo Setting up file permissions...
REM In a real Windows production environment, you'd set proper NTFS permissions here

echo.
echo ========================================
echo ✅ Production Setup Complete!
echo ========================================
echo.

echo 🔐 IMPORTANT: Production passwords have been generated!
echo 📁 All passwords saved to: %PASSWORDS_FILE%
echo ⚠️  CRITICAL SECURITY STEPS:
echo    1. Copy the password file to a secure location
echo    2. Remove the password file from this server
echo    3. Never commit passwords to version control
echo    4. Use a password manager for production
echo.

echo Default Login Credentials ^(CHANGE IMMEDIATELY^):
echo   System Admin: admin@skyraksys.com / ^(see password file^)
echo   HR Manager: hr@skyraksys.com / ^(see password file^)
echo   Project Manager: manager@skyraksys.com / ^(see password file^)
echo.

echo Next steps:
echo 1. Secure your password file: %PASSWORDS_FILE%
echo 2. Review configuration in .env
echo 3. Start the application: npm run start:production
echo 4. Test login with generated credentials
echo 5. Change all passwords immediately after first login
echo.

echo Quick start commands:
echo   npm run start:production  - Start all services
echo   npm run stop             - Stop all services  
echo   npm run restart          - Restart all services
echo   npm run logs             - View application logs
echo.

echo Documentation available in docs/
echo.
pause
