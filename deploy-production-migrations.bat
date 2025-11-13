@echo off
REM 🚀 Production Migration Deployment Script (Windows)
REM 
REM This script safely deploys migrations to production with all safety checks
REM based on the field mapping analysis we performed.
REM 
REM Usage: deploy-production-migrations.bat [options]

setlocal EnableDelayedExpansion

REM Configuration
set BACKUP_DIR=.\backups
set LOG_DIR=.\logs
set MIGRATION_LOG=%LOG_DIR%\migration-%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%.log
set MIGRATION_LOG=%MIGRATION_LOG: =0%

REM Default options
set DRY_RUN=false
set FORCE=false
set SKIP_BACKUP=false
set SKIP_VERIFICATION=false

REM Create log directory
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Parse command line arguments
:parse_args
if "%1"=="--dry-run" (
    set DRY_RUN=true
    shift
    goto parse_args
)
if "%1"=="--force" (
    set FORCE=true
    shift
    goto parse_args
)
if "%1"=="--skip-backup" (
    set SKIP_BACKUP=true
    shift
    goto parse_args
)
if "%1"=="--skip-verification" (
    set SKIP_VERIFICATION=true
    shift
    goto parse_args
)
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help
if not "%1"=="" (
    echo ❌ ERROR: Unknown option: %1
    goto show_help
)

REM Helper functions
:log
echo [%date% %time%] %1
echo [%date% %time%] %1 >> "%MIGRATION_LOG%"
goto :eof

:error
echo ❌ ERROR: %1
echo [%date% %time%] ERROR: %1 >> "%MIGRATION_LOG%"
goto :eof

:success
echo ✅ SUCCESS: %1
echo [%date% %time%] SUCCESS: %1 >> "%MIGRATION_LOG%"
goto :eof

:warning
echo ⚠️ WARNING: %1
echo [%date% %time%] WARNING: %1 >> "%MIGRATION_LOG%"
goto :eof

:info
echo ℹ️ INFO: %1
echo [%date% %time%] INFO: %1 >> "%MIGRATION_LOG%"
goto :eof

:show_help
echo.
echo 🚀 Production Migration Deployment Script
echo.
echo Usage: deploy-production-migrations.bat [options]
echo.
echo Options:
echo     --dry-run           Simulate migration without executing (recommended first)
echo     --force             Force migration even if warnings exist (USE WITH CAUTION)
echo     --skip-backup       Skip database backup (NOT RECOMMENDED)
echo     --skip-verification Skip field mapping verification after migration
echo     --help, -h          Show this help message
echo.
echo Examples:
echo     # Safe production migration (recommended)
echo     deploy-production-migrations.bat
echo.
echo     # Test run first (highly recommended)
echo     deploy-production-migrations.bat --dry-run
echo.
echo     # Emergency deployment (use with extreme caution)
echo     deploy-production-migrations.bat --force
echo.
echo Environment Variables Required:
echo     NODE_ENV=production
echo     DB_HOST=^<database_host^>
echo     DB_NAME=^<database_name^>
echo     DB_USER=^<database_user^>
echo     DB_PASSWORD=^<database_password^>
echo.
exit /b 0

REM Main execution starts here
echo 🚀 PRODUCTION MIGRATION DEPLOYMENT
echo Started at: %date% %time%
echo Log file: %MIGRATION_LOG%
echo.

if "%DRY_RUN%"=="true" (
    call :warning "DRY RUN MODE - No actual changes will be made"
)

REM Pre-flight checks
call :log "🔍 Running Pre-flight Checks..."

REM Check if we're in the right directory
if not exist "package.json" (
    call :error "Please run this script from the project root directory"
    exit /b 1
)
if not exist "backend" (
    call :error "Backend directory not found. Please run from project root."
    exit /b 1
)

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    call :error "Node.js is not installed or not in PATH"
    exit /b 1
)

for /f "tokens=1 delims=." %%i in ('node --version') do set NODE_MAJOR=%%i
set NODE_MAJOR=%NODE_MAJOR:v=%
if %NODE_MAJOR% LSS 16 (
    call :error "Node.js version 16 or higher is required"
    exit /b 1
)
call :success "Node.js version check passed"

REM Check environment
if not "%NODE_ENV%"=="production" (
    if not "%FORCE%"=="true" (
        call :error "NODE_ENV must be set to 'production'. Current: %NODE_ENV%"
        call :info "Use --force to override this check (not recommended)"
        exit /b 1
    )
)
call :success "Environment check passed: NODE_ENV=%NODE_ENV%"

REM Check required environment variables
if "%DB_HOST%"=="" (
    call :error "Required environment variable DB_HOST is not set"
    exit /b 1
)
if "%DB_NAME%"=="" (
    call :error "Required environment variable DB_NAME is not set"
    exit /b 1
)
if "%DB_USER%"=="" (
    call :error "Required environment variable DB_USER is not set"
    exit /b 1
)
if "%DB_PASSWORD%"=="" (
    call :error "Required environment variable DB_PASSWORD is not set"
    exit /b 1
)
call :success "All required environment variables are set"

REM Check backend dependencies
if not exist "backend\node_modules" (
    call :error "Backend dependencies not installed. Run 'cd backend && npm install'"
    exit /b 1
)
call :success "Backend dependencies check passed"

REM Test database connection
call :log "🔌 Testing Database Connection..."
cd backend
call npm run db:test-connection >> "%MIGRATION_LOG%" 2>&1
if errorlevel 1 (
    call :error "Database connection failed"
    cd ..
    exit /b 1
)
call :success "Database connection successful"
cd ..

REM Check migration status
call :log "📊 Checking Migration Status..."
cd backend
npx sequelize-cli db:migrate:status > temp_migration_status.txt 2>&1
if errorlevel 1 (
    call :error "Failed to get migration status"
    cd ..
    exit /b 1
)

REM Count pending migrations (simplified check)
findstr /c:"down" temp_migration_status.txt >nul
if errorlevel 1 (
    call :success "All migrations are up to date"
    if not "%FORCE%"=="true" (
        call :info "Use --force to run anyway"
        cd ..
        exit /b 0
    )
) else (
    call :warning "Found pending migrations"
    type temp_migration_status.txt >> "%MIGRATION_LOG%"
)
del temp_migration_status.txt >nul 2>&1
cd ..

REM Create database backup
if "%SKIP_BACKUP%"=="true" (
    call :warning "Skipping database backup (--skip-backup flag used)"
) else (
    call :log "💾 Creating Database Backup..."
    
    set timestamp=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set timestamp=!timestamp: =0!
    set backup_file=%BACKUP_DIR%\production_backup_!timestamp!.sql
    
    if "%DRY_RUN%"=="true" (
        call :info "DRY RUN: Would create backup at !backup_file!"
    ) else (
        REM Use pg_dump for backup
        set PGPASSWORD=%DB_PASSWORD%
        pg_dump -h %DB_HOST% -U %DB_USER% -d %DB_NAME% > "!backup_file!" 2>> "%MIGRATION_LOG%"
        if errorlevel 1 (
            call :error "Backup creation failed"
            exit /b 1
        )
        call :success "Backup created successfully: !backup_file!"
        echo !backup_file! > "%BACKUP_DIR%\.latest_backup"
        set PGPASSWORD=
    )
)

REM Run migrations
call :log "🚀 Running Database Migrations..."

if "%DRY_RUN%"=="true" (
    call :info "DRY RUN: Would execute migrations"
) else (
    cd backend
    npx sequelize-cli db:migrate 2>&1 | findstr /v /c:"" >> "%MIGRATION_LOG%"
    if errorlevel 1 (
        call :error "Migration execution failed"
        cd ..
        goto rollback
    )
    call :success "Migrations completed successfully"
    cd ..
)

REM Verify field mappings
if "%SKIP_VERIFICATION%"=="true" (
    call :warning "Skipping field mapping verification (--skip-verification flag used)"
) else (
    call :log "🔍 Verifying Field Mappings..."
    
    if "%DRY_RUN%"=="true" (
        call :info "DRY RUN: Would verify field mappings"
    ) else (
        if exist "scripts\verify-field-mappings.js" (
            node scripts\verify-field-mappings.js >> "%MIGRATION_LOG%" 2>&1
            if errorlevel 1 (
                call :error "Field mapping verification failed"
                if not "%FORCE%"=="true" goto rollback
                call :warning "Continuing due to --force flag"
            ) else (
                call :success "Field mapping verification passed"
            )
        ) else (
            call :warning "Field mapping verification script not found"
        )
    )
)

REM Post-migration tasks
call :log "🔧 Running Post-Migration Tasks..."

if "%DRY_RUN%"=="true" (
    call :info "DRY RUN: Would run post-migration tasks"
) else (
    REM Restart PM2 if available
    where pm2 >nul 2>&1
    if not errorlevel 1 (
        call :info "Restarting application services..."
        pm2 reload all >> "%MIGRATION_LOG%" 2>&1
        if errorlevel 1 (
            call :warning "PM2 reload failed (non-critical)"
        )
    )
    
    call :success "Post-migration tasks completed"
)

REM Success summary
echo.
echo ✅ MIGRATION DEPLOYMENT COMPLETED SUCCESSFULLY
echo Log file: %MIGRATION_LOG%

if exist "%BACKUP_DIR%\.latest_backup" (
    set /p latest_backup= < "%BACKUP_DIR%\.latest_backup"
    echo Backup: !latest_backup!
)

call :info "Migration deployment completed at %date% %time%"
exit /b 0

:rollback
call :error "Migration failed - initiating rollback..."

if exist "%BACKUP_DIR%\.latest_backup" (
    set /p backup_file= < "%BACKUP_DIR%\.latest_backup"
    if exist "!backup_file!" (
        call :warning "Restoring from backup: !backup_file!"
        set PGPASSWORD=%DB_PASSWORD%
        psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% < "!backup_file!" >> "%MIGRATION_LOG%" 2>&1
        if errorlevel 1 (
            call :error "Backup restoration failed - manual intervention required"
        ) else (
            call :success "Database restored from backup"
        )
        set PGPASSWORD=
    ) else (
        call :error "Backup file not found: !backup_file!"
    )
) else (
    call :warning "No recent backup available - attempting Sequelize rollback"
    cd backend
    npx sequelize-cli db:migrate:undo >> "%MIGRATION_LOG%" 2>&1
    if errorlevel 1 (
        call :error "Sequelize rollback failed"
    )
    cd ..
)
exit /b 1