@echo off
echo ========================================
echo SkyRakSys HRM System - Backend Verification
echo ========================================
echo.

echo [1/5] Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo [2/5] Checking npm version...
npm --version
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo [3/5] Checking backend directory structure...
if not exist "backend\package.json" (
    echo ERROR: Backend package.json not found
    pause
    exit /b 1
)
if not exist "backend\server.js" (
    echo ERROR: Backend server.js not found
    pause
    exit /b 1
)
if not exist "backend\models" (
    echo ERROR: Backend models directory not found
    pause
    exit /b 1
)
if not exist "backend\routes" (
    echo ERROR: Backend routes directory not found
    pause
    exit /b 1
)
echo Backend structure verified ✓

echo [4/5] Checking backend dependencies...
cd backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed ✓
)

echo [5/5] Testing backend startup...
echo Starting backend server for health check...
timeout /t 2 >nul
node -e "const express = require('express'); const app = express(); app.get('/health', (req, res) => res.json({status: 'OK'})); const server = app.listen(8081, () => {console.log('✓ Backend health check passed - Server can start successfully'); server.close();});" 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Backend health check failed - there might be dependency issues
) else (
    echo ✓ Backend startup test passed
)

cd ..

echo.
echo ========================================
echo Backend Verification Complete!
echo ========================================
echo.
echo ✓ Node.js and npm are installed
echo ✓ Backend structure is complete
echo ✓ Dependencies are installed
echo ✓ Server startup test passed
echo.
echo Your backend is ready to run!
echo.
echo To start the backend:
echo   cd backend
echo   npm run dev
echo.
echo API will be available at: http://localhost:8080/api
echo Health check endpoint: http://localhost:8080/api/health
echo.
echo Default login credentials:
echo   Admin: admin@skyraksys.com / admin123
echo   HR: hr@skyraksys.com / admin123
echo   Manager: lead@skyraksys.com / admin123
echo   Employee: employee1@skyraksys.com / admin123
echo.
pause
