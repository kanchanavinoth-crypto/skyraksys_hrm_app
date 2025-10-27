@echo off
REM ================================================
REM Final Cleanup - Delete Old Production Folders
REM ================================================
REM
REM This script deletes the old production folders after
REM verification that they were copied correctly.
REM
REM ONLY RUN THIS AFTER VERIFYING:
REM   1. production/windows/ contains all PROD files
REM   2. production/unix/ contains all PRODUnix files
REM   3. production/redhat-deployment/base/ contains all redhat files
REM   4. production/redhat-deployment/prod/ contains all redhatprod files
REM
REM ================================================

echo.
echo ================================================
echo   Final Cleanup - Delete Old Folders
echo ================================================
echo.
echo This will DELETE the following folders:
echo   - PROD
echo   - PRODUnix
echo   - redhat
echo   - redhatprod
echo.
echo These folders have been COPIED to production/
echo.
echo WARNING: This action CANNOT be undone!
echo.
echo Have you verified all files were copied correctly?
echo.
pause

echo.
echo Verifying new production structure exists...
echo.

if not exist "production\windows\" (
    echo ERROR: production\windows\ does not exist!
    echo Please run cleanup-codebase.ps1 first.
    pause
    exit /b 1
)

if not exist "production\unix\" (
    echo ERROR: production\unix\ does not exist!
    echo Please run cleanup-codebase.ps1 first.
    pause
    exit /b 1
)

if not exist "production\redhat-deployment\base\" (
    echo ERROR: production\redhat-deployment\base\ does not exist!
    echo Please run cleanup-codebase.ps1 first.
    pause
    exit /b 1
)

if not exist "production\redhat-deployment\prod\" (
    echo ERROR: production\redhat-deployment\prod\ does not exist!
    echo Please run cleanup-codebase.ps1 first.
    pause
    exit /b 1
)

echo All production folders verified!
echo.
echo.
echo FINAL CONFIRMATION
echo ==================
echo.
echo Are you ABSOLUTELY SURE you want to delete the old folders?
echo Type 'DELETE' (in capitals) to confirm:
echo.
set /p CONFIRM=

if not "%CONFIRM%"=="DELETE" (
    echo.
    echo Deletion cancelled.
    echo No changes were made.
    pause
    exit /b 0
)

echo.
echo Deleting old folders...
echo.

if exist "PROD\" (
    echo Deleting PROD...
    rmdir /s /q "PROD"
    echo   Done.
)

if exist "PRODUnix\" (
    echo Deleting PRODUnix...
    rmdir /s /q "PRODUnix"
    echo   Done.
)

if exist "redhat\" (
    echo Deleting redhat...
    rmdir /s /q "redhat"
    echo   Done.
)

if exist "redhatprod\" (
    echo Deleting redhatprod...
    rmdir /s /q "redhatprod"
    echo   Done.
)

echo.
echo ================================================
echo   Cleanup Complete!
echo ================================================
echo.
echo Old production folders have been deleted.
echo All files are now in production/ structure.
echo.
echo Next steps:
echo   1. Commit changes to git
echo   2. Review docs/DOCUMENTATION_INDEX.md
echo   3. Test production deployment
echo.
pause
