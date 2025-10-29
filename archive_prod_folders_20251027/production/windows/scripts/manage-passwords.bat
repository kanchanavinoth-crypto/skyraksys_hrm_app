@echo off
setlocal enabledelayedexpansion

REM ================================================================
REM SkyRakSys HRM Production Password Management Script (Windows)
REM ================================================================
REM 
REM This script helps manage and change default passwords in the
REM production environment for Windows systems.
REM 
REM Usage: manage-passwords.bat [command] [options]
REM 
REM ================================================================

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "ENV_FILE=%PROJECT_DIR%\.env"
set "ENV_TEMPLATE=%PROJECT_DIR%\.env.production.template"
set "BACKUP_DIR=%PROJECT_DIR%\config\backups"

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Colors for output (if supported)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

goto :main

REM ================================================================
REM Utility Functions
REM ================================================================

:log_info
echo [INFO] %~1
goto :eof

:log_success
echo [SUCCESS] %~1
goto :eof

:log_warning
echo [WARNING] %~1
goto :eof

:log_error
echo [ERROR] %~1
goto :eof

:generate_password
REM Generate secure password using PowerShell
set "length=%~1"
if "%length%"=="" set "length=32"

powershell -Command "Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(%length%, 8)" 2>nul
if errorlevel 1 (
    REM Fallback to simple random generation
    for /f "delims=" %%i in ('powershell -Command "[System.Guid]::NewGuid().ToString().Replace('-','').Substring(0,%length%)"') do set "generated_password=%%i"
    echo !generated_password!
)
goto :eof

:backup_config
set "file=%~1"
if exist "%file%" (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "DATE=%%c%%a%%b"
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "TIME=%%a%%b"
    set "TIME=!TIME: =0!"
    set "backup_file=%BACKUP_DIR%\%~n1%~x1.!DATE!_!TIME!.bak"
    copy "%file%" "!backup_file!" >nul
    call :log_info "Backed up %file% to !backup_file!"
)
goto :eof

:update_env_var
set "file=%~1"
set "var_name=%~2"
set "var_value=%~3"

if not exist "%file%" (
    call :log_error "Environment file %file% not found"
    exit /b 1
)

REM Create temporary file for updates
set "temp_file=%file%.tmp"

REM Process the file line by line
(
    for /f "usebackq delims=" %%a in ("%file%") do (
        set "line=%%a"
        if "!line:~0,%len_var_name%!"=="%var_name%" if "!line:~%len_var_name%,1!"=="=" (
            echo %var_name%=%var_value%
        ) else (
            echo %%a
        )
    )
) > "%temp_file%"

REM Replace original file
move "%temp_file%" "%file%" >nul
call :log_success "Updated %var_name% in %file%"
goto :eof

REM ================================================================
REM Password Management Functions
REM ================================================================

:change_database_passwords
call :log_info "Changing database passwords..."

REM Generate new passwords
call :generate_password 32
set "postgres_admin_password=%generated_password%"

call :generate_password 32
set "app_db_password=%generated_password%"

call :log_info "Generated new database passwords"

REM Backup environment file
call :backup_config "%ENV_FILE%"

REM Update PostgreSQL passwords (requires manual intervention)
call :log_warning "PostgreSQL password update requires manual intervention:"
echo   1. Open PostgreSQL command prompt (psql)
echo   2. Connect as postgres user: psql -U postgres
echo   3. Run: ALTER USER postgres PASSWORD '%postgres_admin_password%';
echo   4. Run: ALTER USER hrm_prod_user PASSWORD '%app_db_password%';

REM Update environment file
call :update_env_var "%ENV_FILE%" "POSTGRES_ADMIN_PASSWORD" "%postgres_admin_password%"
call :update_env_var "%ENV_FILE%" "DB_PASSWORD" "%app_db_password%"

call :log_success "Database password configuration updated"
echo New PostgreSQL admin password: %postgres_admin_password%
echo New application database password: %app_db_password%
goto :eof

:change_admin_passwords
call :log_info "Changing application admin passwords..."

REM Generate new passwords
call :generate_password 24
set "admin_password=%generated_password%"

call :generate_password 24
set "hr_password=%generated_password%"

call :generate_password 24
set "manager_password=%generated_password%"

REM Backup environment file
call :backup_config "%ENV_FILE%"

REM Update environment file
call :update_env_var "%ENV_FILE%" "ADMIN_PASSWORD" "%admin_password%"
call :update_env_var "%ENV_FILE%" "HR_PASSWORD" "%hr_password%"
call :update_env_var "%ENV_FILE%" "MANAGER_PASSWORD" "%manager_password%"

call :log_success "Application admin passwords updated"
echo New passwords:
echo   Admin: %admin_password%
echo   HR Manager: %hr_password%
echo   Project Manager: %manager_password%
call :log_warning "Please save these passwords securely!"
goto :eof

:change_security_tokens
call :log_info "Changing security tokens and secrets..."

REM Generate new tokens
call :generate_password 64
set "jwt_secret=%generated_password%"

call :generate_password 64
set "jwt_refresh_secret=%generated_password%"

call :generate_password 64
set "session_secret=%generated_password%"

call :generate_password 32
set "encryption_key=%generated_password%"

call :generate_password 16
set "encryption_iv=%generated_password%"

call :generate_password 48
set "webhook_secret=%generated_password%"

REM Backup environment file
call :backup_config "%ENV_FILE%"

REM Update environment file
call :update_env_var "%ENV_FILE%" "JWT_SECRET" "%jwt_secret%"
call :update_env_var "%ENV_FILE%" "JWT_REFRESH_SECRET" "%jwt_refresh_secret%"
call :update_env_var "%ENV_FILE%" "SESSION_SECRET" "%session_secret%"
call :update_env_var "%ENV_FILE%" "ENCRYPTION_KEY" "%encryption_key%"
call :update_env_var "%ENV_FILE%" "ENCRYPTION_IV" "%encryption_iv%"
call :update_env_var "%ENV_FILE%" "WEBHOOK_SECRET" "%webhook_secret%"

call :log_success "Security tokens updated successfully"
goto :eof

:change_infrastructure_passwords
call :log_info "Changing infrastructure service passwords..."

REM Generate new passwords
call :generate_password 32
set "redis_password=%generated_password%"

call :generate_password 24
set "nginx_password=%generated_password%"

call :generate_password 32
set "ssl_password=%generated_password%"

call :generate_password 32
set "backup_password=%generated_password%"

REM Backup environment file
call :backup_config "%ENV_FILE%"

REM Update environment file
call :update_env_var "%ENV_FILE%" "REDIS_PASSWORD" "%redis_password%"
call :update_env_var "%ENV_FILE%" "NGINX_ADMIN_PASSWORD" "%nginx_password%"
call :update_env_var "%ENV_FILE%" "SSL_PRIVATE_KEY_PASSWORD" "%ssl_password%"
call :update_env_var "%ENV_FILE%" "BACKUP_ENCRYPTION_PASSWORD" "%backup_password%"

call :log_success "Infrastructure passwords updated successfully"
goto :eof

:change_all_passwords
call :log_info "Changing ALL default passwords..."

call :change_database_passwords
echo.
call :change_admin_passwords
echo.
call :change_security_tokens
echo.
call :change_infrastructure_passwords

call :log_success "All passwords have been updated successfully!"
call :log_warning "Please restart all services for changes to take effect:"
echo   - Restart PostgreSQL service
echo   - Restart Redis service (if applicable)
echo   - Restart IIS or application server
echo   - Restart Node.js application
goto :eof

:generate_password_only
set "length=%~1"
if "%length%"=="" set "length=32"

call :generate_password %length%
echo Generated password: %generated_password%
goto :eof

:verify_passwords
call :log_info "Verifying current password configuration..."

set "issues=0"

REM Check if environment file exists
if not exist "%ENV_FILE%" (
    call :log_error "Environment file not found: %ENV_FILE%"
    set /a issues+=1
)

REM Check for default passwords
if exist "%ENV_FILE%" (
    findstr /C:"admin123" /C:"password123" /C:"change_this" /C:"default" "%ENV_FILE%" >nul 2>&1
    if not errorlevel 1 (
        call :log_warning "Default or weak passwords detected in environment file"
        set /a issues+=1
    )
    
    findstr /C:"SkyRakSys.*2024" "%ENV_FILE%" >nul 2>&1
    if not errorlevel 1 (
        call :log_warning "Default SkyRakSys passwords detected - should be changed"
        set /a issues+=1
    )
)

if %issues%==0 (
    call :log_success "Password configuration appears secure"
) else (
    call :log_warning "Found %issues% security issues that should be addressed"
)
goto :eof

:show_help
echo SkyRakSys HRM Password Management Script (Windows)
echo.
echo Usage: %~nx0 [command] [options]
echo.
echo Commands:
echo   change-all          Change all default passwords
echo   change-database     Change database passwords only
echo   change-admin        Change application admin passwords only
echo   change-security     Change security tokens only
echo   change-infra        Change infrastructure passwords only
echo   verify              Verify current password configuration
echo   generate [length]   Generate a secure password
echo   help                Show this help message
echo.
echo Examples:
echo   %~nx0 change-all                    Change all passwords
echo   %~nx0 change-database               Change database passwords
echo   %~nx0 generate 32                   Generate 32-character password
echo   %~nx0 verify                        Check current configuration
echo.
echo Security Notes:
echo   - Always backup configuration before changes
echo   - Test changes in staging environment first
echo   - Restart services after password changes
echo   - Store new passwords securely
echo   - Never commit passwords to version control
echo.
goto :eof

REM ================================================================
REM Main Script Logic
REM ================================================================

:main
set "command=%~1"
set "param=%~2"

if "%command%"=="" goto :show_help
if "%command%"=="help" goto :show_help

if "%command%"=="change-all" (
    echo This will change ALL default passwords. Continue? [y/N]
    set /p response=
    if /i "!response!"=="y" (
        call :change_all_passwords
    ) else (
        call :log_info "Operation cancelled"
    )
    goto :eof
)

if "%command%"=="change-database" (
    echo This will change database passwords. Continue? [y/N]
    set /p response=
    if /i "!response!"=="y" (
        call :change_database_passwords
    ) else (
        call :log_info "Operation cancelled"
    )
    goto :eof
)

if "%command%"=="change-admin" (
    call :change_admin_passwords
    goto :eof
)

if "%command%"=="change-security" (
    call :change_security_tokens
    goto :eof
)

if "%command%"=="change-infra" (
    call :change_infrastructure_passwords
    goto :eof
)

if "%command%"=="verify" (
    call :verify_passwords
    goto :eof
)

if "%command%"=="generate" (
    call :generate_password_only %param%
    goto :eof
)

call :log_error "Unknown command: %command%"
call :show_help
