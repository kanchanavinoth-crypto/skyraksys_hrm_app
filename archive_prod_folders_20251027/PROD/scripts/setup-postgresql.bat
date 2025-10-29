@echo off
REM ============================================
REM  PostgreSQL Production Setup
REM ============================================

echo.
echo [Database Setup] Setting up PostgreSQL for production...

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ PostgreSQL is not installed or not in PATH.
    echo.
    echo To install PostgreSQL:
    echo 1. Download from: https://www.postgresql.org/download/windows/
    echo 2. Or use winget: winget install PostgreSQL.PostgreSQL
    echo 3. Or use chocolatey: choco install postgresql
    echo.
    echo After installation, add PostgreSQL bin directory to PATH:
    echo Example: C:\Program Files\PostgreSQL\15\bin
    echo.
    pause
    exit /b 1
)

echo ✅ PostgreSQL detected:
psql --version

echo.
echo PostgreSQL setup options:
echo 1. Create new local database
echo 2. Connect to existing PostgreSQL server
echo 3. Use Docker PostgreSQL (recommended)
echo 4. Generate SQL scripts only (manual setup)

set /p pg_choice="Enter your choice (1-4): "

if "%pg_choice%"=="1" (
    call :setup_local_db
)

if "%pg_choice%"=="2" (
    call :setup_remote_db
)

if "%pg_choice%"=="3" (
    call :setup_docker_db
)

if "%pg_choice%"=="4" (
    call :generate_sql_scripts
)

goto :end

:setup_local_db
echo.
echo [Local Database Setup]
echo Please enter database configuration:

set /p db_name="Database name [skyraksys_hrm_prod]: "
if "%db_name%"=="" set db_name=skyraksys_hrm_prod

set /p db_user="Database user [hrm_prod_user]: "
if "%db_user%"=="" set db_user=hrm_prod_user

set /p db_password="Database password: "
if "%db_password%"=="" (
    echo ❌ Password cannot be empty
    goto :setup_local_db
)

echo.
echo Creating database setup script...
(
echo -- SkyRakSys HRM Production Database Setup
echo -- Run this script as PostgreSQL superuser
echo.
echo -- Create database
echo CREATE DATABASE %db_name%;
echo.
echo -- Create user
echo CREATE USER %db_user% WITH ENCRYPTED PASSWORD '%db_password%';
echo.
echo -- Grant privileges
echo GRANT ALL PRIVILEGES ON DATABASE %db_name% TO %db_user%;
echo.
echo -- Connect to the database
echo \c %db_name%
echo.
echo -- Grant schema privileges
echo GRANT ALL ON SCHEMA public TO %db_user%;
echo GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %db_user%;
echo GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %db_user%;
echo ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO %db_user%;
echo ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO %db_user%;
echo.
echo -- Verify setup
echo SELECT current_database^(^), current_user;
) > database\setup-database.sql

echo.
echo ✅ Database setup script created: database\setup-database.sql
echo.
echo To run the setup:
echo 1. Connect to PostgreSQL as superuser:
echo    psql -U postgres
echo 2. Run the setup script:
echo    \i database/setup-database.sql
echo.

REM Update environment file
call :update_env_file %db_name% %db_user% %db_password% localhost 5432
goto :eof

:setup_remote_db
echo.
echo [Remote Database Setup]
echo Please enter your remote PostgreSQL server details:

set /p db_host="Database host: "
set /p db_port="Database port [5432]: "
if "%db_port%"=="" set db_port=5432

set /p db_name="Database name: "
set /p db_user="Database user: "
set /p db_password="Database password: "

echo.
echo Testing connection...
set PGPASSWORD=%db_password%
psql -h %db_host% -p %db_port% -U %db_user% -d %db_name% -c "SELECT version();" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to connect to database. Please check your credentials.
    pause
    goto :setup_remote_db
)

echo ✅ Database connection successful!
call :update_env_file %db_name% %db_user% %db_password% %db_host% %db_port%
goto :eof

:setup_docker_db
echo.
echo [Docker PostgreSQL Setup]

REM Check if Docker is installed
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is not installed.
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker detected

REM Create docker-compose for PostgreSQL
echo Creating Docker PostgreSQL configuration...
(
echo version: '3.8'
echo.
echo services:
echo   postgres:
echo     image: postgres:15-alpine
echo     container_name: skyraksys_hrm_postgres_prod
echo     environment:
echo       POSTGRES_DB: skyraksys_hrm_prod
echo       POSTGRES_USER: hrm_prod_user
echo       POSTGRES_PASSWORD: CHANGE_THIS_PASSWORD
echo     ports:
echo       - "5432:5432"
echo     volumes:
echo       - postgres_data:/var/lib/postgresql/data
echo       - ./database/init:/docker-entrypoint-initdb.d
echo     restart: unless-stopped
echo     networks:
echo       - hrm_network
echo.
echo   # Optional: pgAdmin for database management
echo   pgadmin:
echo     image: dpage/pgadmin4:latest
echo     container_name: skyraksys_hrm_pgadmin_prod
echo     environment:
echo       PGADMIN_DEFAULT_EMAIL: admin@yourdomain.com
echo       PGADMIN_DEFAULT_PASSWORD: admin123
echo     ports:
echo       - "8081:80"
echo     volumes:
echo       - pgadmin_data:/var/lib/pgadmin
echo     depends_on:
echo       - postgres
echo     restart: unless-stopped
echo     networks:
echo       - hrm_network
echo.
echo volumes:
echo   postgres_data:
echo     driver: local
echo   pgadmin_data:
echo     driver: local
echo.
echo networks:
echo   hrm_network:
echo     driver: bridge
) > docker-compose.yml

echo.
echo ✅ Docker configuration created: docker-compose.yml
echo.
echo ⚠️  IMPORTANT: Update the POSTGRES_PASSWORD in docker-compose.yml
echo.
echo To start PostgreSQL:
echo   docker-compose up -d postgres
echo.
echo To start with pgAdmin:
echo   docker-compose up -d
echo.
echo Access pgAdmin at: http://localhost:8081
echo.

call :update_env_file skyraksys_hrm_prod hrm_prod_user CHANGE_THIS_PASSWORD localhost 5432
goto :eof

:generate_sql_scripts
echo.
echo [SQL Scripts Generation]
echo Generating database setup scripts...

mkdir database\scripts 2>nul

REM Create database creation script
(
echo -- ============================================
echo -- SkyRakSys HRM Production Database Setup
echo -- ============================================
echo.
echo -- Create database and user
echo CREATE DATABASE skyraksys_hrm_prod;
echo CREATE USER hrm_prod_user WITH ENCRYPTED PASSWORD 'CHANGE_THIS_PASSWORD';
echo.
echo -- Grant privileges
echo GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_prod_user;
echo.
echo -- Connect to database
echo \c skyraksys_hrm_prod
echo.
echo -- Grant schema privileges
echo GRANT ALL ON SCHEMA public TO hrm_prod_user;
echo GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hrm_prod_user;
echo GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hrm_prod_user;
echo ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hrm_prod_user;
echo ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hrm_prod_user;
) > database\scripts\01-create-database.sql

REM Create backup script
(
echo -- ============================================
echo -- Database Backup Script
echo -- ============================================
echo.
echo -- Create backup
echo -- Run this command from terminal:
echo -- pg_dump -h localhost -U hrm_prod_user -d skyraksys_hrm_prod ^> backup_%%date%%.sql
echo.
echo -- Restore from backup:
echo -- psql -h localhost -U hrm_prod_user -d skyraksys_hrm_prod ^< backup_file.sql
) > database\scripts\02-backup-restore.sql

REM Create maintenance script
(
echo -- ============================================
echo -- Database Maintenance Script
echo -- ============================================
echo.
echo -- Analyze tables for performance
echo ANALYZE;
echo.
echo -- Vacuum tables
echo VACUUM;
echo.
echo -- Reindex all tables
echo REINDEX DATABASE skyraksys_hrm_prod;
echo.
echo -- Check database size
echo SELECT pg_size_pretty^(pg_database_size^('skyraksys_hrm_prod'^)^) as database_size;
echo.
echo -- Check table sizes
echo SELECT 
echo     schemaname,
echo     tablename,
echo     pg_size_pretty^(pg_total_relation_size^(schemaname||'.'||tablename^)^) as size
echo FROM pg_tables 
echo WHERE schemaname = 'public'
echo ORDER BY pg_total_relation_size^(schemaname||'.'||tablename^) DESC;
) > database\scripts\03-maintenance.sql

echo ✅ SQL scripts generated in database\scripts\:
echo   - 01-create-database.sql
echo   - 02-backup-restore.sql  
echo   - 03-maintenance.sql
echo.
echo Manual setup required:
echo 1. Run 01-create-database.sql as PostgreSQL superuser
echo 2. Update environment files with your database credentials
echo.
goto :eof

:update_env_file
set db_name=%1
set db_user=%2
set db_password=%3
set db_host=%4
set db_port=%5

echo.
echo Updating environment file...

REM Update the backend .env.production file
powershell -Command "(Get-Content 'backend\.env.production') -replace 'DB_NAME=.*', 'DB_NAME=%db_name%' | Set-Content 'backend\.env.production'"
powershell -Command "(Get-Content 'backend\.env.production') -replace 'DB_USER=.*', 'DB_USER=%db_user%' | Set-Content 'backend\.env.production'"
powershell -Command "(Get-Content 'backend\.env.production') -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=%db_password%' | Set-Content 'backend\.env.production'"
powershell -Command "(Get-Content 'backend\.env.production') -replace 'DB_HOST=.*', 'DB_HOST=%db_host%' | Set-Content 'backend\.env.production'"
powershell -Command "(Get-Content 'backend\.env.production') -replace 'DB_PORT=.*', 'DB_PORT=%db_port%' | Set-Content 'backend\.env.production'"

echo ✅ Environment file updated with database configuration
goto :eof

:end
echo.
echo [Database Setup Complete]
echo.
echo Next steps:
echo 1. Verify database connection
echo 2. Run database migrations: cd backend && npm run migrate
echo 3. Seed initial data: cd backend && npm run seed
echo.
echo Database connection test:
echo   cd backend
echo   node -e "const {sequelize} = require('./models'); sequelize.authenticate().then(() => console.log('✅ Database connected')).catch(err => console.error('❌ Database error:', err));"
echo.
