@echo off
REM Test Production Build Locally - Windows Script
REM This script helps catch production build issues before deployment

echo Testing Production Build Locally
echo ===================================

cd frontend

echo.
echo 1. Cleaning existing build...
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo 2. Running production build test...
npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Production build SUCCESS!
    echo Your code is ready for deployment.
) else (
    echo.
    echo ❌ Production build FAILED!
    echo Fix these issues before deploying to production.
    echo.
    echo 💡 Common fixes:
    echo    - Check for missing imports
    echo    - Update deprecated packages
    echo    - Fix TypeScript/ESLint errors
)

echo.
echo 3. Running audit check...
npm audit

echo.
echo 4. Testing frontend start...
echo Starting frontend in production mode for 10 seconds...
timeout /t 5 /nobreak > nul
start /b npm start
timeout /t 10 /nobreak > nul
taskkill /f /im node.exe 2>nul

echo.
echo ✨ Local production test completed!
pause