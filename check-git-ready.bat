@echo off
REM =============================================================================
REM Git Line Ending Validation Script for Windows
REM =============================================================================
REM Run this script before git add to ensure proper line endings

echo Checking line endings before Git commit...
echo.

set "has_issues=0"

REM Check main deployment scripts
for %%f in (rhel-quick-deploy.sh deployment-dry-run.sh ultimate-deploy.sh validate-production-configs.sh) do (
    if exist "%%f" (
        powershell -Command "if ((Get-Content '%%f' -Raw) -match \"`r\") { Write-Host '[ERROR] %%f has CRLF endings'; exit 1 } else { Write-Host '[OK] %%f has proper LF endings' }"
        if errorlevel 1 set "has_issues=1"
    )
)

echo.
if %has_issues%==0 (
    echo ✅ All scripts have proper Unix line endings
    echo ✅ Safe to run: git add .
) else (
    echo ❌ Some scripts have Windows line endings
    echo 🔧 Run: git add --renormalize .
)

pause