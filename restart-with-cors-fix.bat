@echo off
REM ============================================
REM HRM System - Restart After CORS Fix
REM ============================================

echo.
echo ========================================
echo  CORS Fix - Restarting HRM System
echo ========================================
echo.

REM Stop any running processes on port 8080 and 3000
echo [1/5] Stopping existing processes...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') DO (
    echo Stopping process on port 8080 (PID: %%P)
    taskkill /F /PID %%P 2>nul
)

FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO (
    echo Stopping process on port 3000 (PID: %%P)
    taskkill /F /PID %%P 2>nul
)

timeout /t 2 /nobreak >nul

echo.
echo [2/5] Starting Backend Server (on 0.0.0.0:8080)...
cd backend
start "HRM Backend" cmd /k "node server.js"

timeout /t 5 /nobreak >nul

echo.
echo [3/5] Verifying Backend is running...
netstat -ano | findstr :8080 | findstr LISTENING
if %ERRORLEVEL% EQU 0 (
    echo ✓ Backend is running on port 8080
) else (
    echo ✗ Backend failed to start!
    pause
    exit /b 1
)

echo.
echo [4/5] Starting Frontend (will rebuild with new .env)...
cd ..\frontend
start "HRM Frontend" cmd /k "npm start"

echo.
echo [5/5] Waiting for frontend to start...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo  CORS Fix Applied Successfully!
echo ========================================
echo.
echo Backend running at:  http://95.216.14.232:8080/api
echo Frontend running at: http://95.216.14.232:3000
echo.
echo Open your browser and test the login!
echo.
echo Credentials:
echo   Email: admin@skyraksys.com
echo   Password: admin123
echo.
echo Press any key to exit...
pause >nul
