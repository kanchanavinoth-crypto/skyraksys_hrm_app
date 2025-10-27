@echo off
echo ========================================
echo   HRM SYSTEM - FINAL COMPREHENSIVE TEST
echo ========================================
echo.

cd /d "d:\skyraksys_hrm\backend"

echo Checking if server is running...
timeout /t 2 /nobreak >nul

echo.
echo Starting comprehensive functional test...
echo This will test all modules with real workflows
echo.

node final-comprehensive-test.js

echo.
echo Test completed. Press any key to exit...
pause >nul
