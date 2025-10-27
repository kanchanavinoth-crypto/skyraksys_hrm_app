@echo off
echo ========================================
echo PostgreSQL Connection Troubleshooting
echo ========================================
echo.

echo [1] Checking PostgreSQL service status...
sc query postgresql-x64-17 | find "STATE"

echo.
echo [2] Testing different PostgreSQL passwords...
echo.

cd backend

echo Testing with password: postgres
set PGPASSWORD=postgres
psql -U postgres -d postgres -c "SELECT 'Connection with postgres password works!' as status;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Password 'postgres' works!
    echo Creating database...
    createdb -U postgres skyraksys_hrm_dev 2>nul
    echo Database creation attempted
    goto TEST_BACKEND
)

echo Testing with password: password
set PGPASSWORD=password
psql -U postgres -d postgres -c "SELECT 'Connection with password works!' as status;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Password 'password' works!
    echo Updating .env file...
    echo # Environment Configuration > .env.temp
    echo NODE_ENV=development >> .env.temp
    echo PORT=8080 >> .env.temp
    echo. >> .env.temp
    echo # Database Configuration >> .env.temp
    echo DB_HOST=localhost >> .env.temp
    echo DB_PORT=5432 >> .env.temp
    echo DB_NAME=skyraksys_hrm_dev >> .env.temp
    echo DB_USER=postgres >> .env.temp
    echo DB_PASSWORD=password >> .env.temp
    echo DB_SSL=false >> .env.temp
    move .env.temp .env
    echo Creating database...
    createdb -U postgres skyraksys_hrm_dev 2>nul
    goto TEST_BACKEND
)

echo Testing with empty password
set PGPASSWORD=
psql -U postgres -d postgres -c "SELECT 'Connection without password works!' as status;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ No password required!
    echo Updating .env file...
    echo # Environment Configuration > .env.temp
    echo NODE_ENV=development >> .env.temp
    echo PORT=8080 >> .env.temp
    echo. >> .env.temp
    echo # Database Configuration >> .env.temp
    echo DB_HOST=localhost >> .env.temp
    echo DB_PORT=5432 >> .env.temp
    echo DB_NAME=skyraksys_hrm_dev >> .env.temp
    echo DB_USER=postgres >> .env.temp
    echo DB_PASSWORD= >> .env.temp
    echo DB_SSL=false >> .env.temp
    move .env.temp .env
    echo Creating database...
    createdb -U postgres skyraksys_hrm_dev 2>nul
    goto TEST_BACKEND
)

echo.
echo ❌ Could not connect with any common passwords
echo.
echo Please check your PostgreSQL installation and password
echo Common solutions:
echo 1. Reset postgres user password:
echo    psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"
echo 2. Or use pgAdmin to set a known password
echo 3. Or check PostgreSQL logs for connection issues
echo.
echo Alternatively, you can use SQLite instead:
echo    setup-sqlite.bat
echo.
goto END

:TEST_BACKEND
echo.
echo [3] Testing backend connection...
node -e "require('dotenv').config(); const { Sequelize } = require('sequelize'); const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {host: process.env.DB_HOST, dialect: 'postgres', logging: false}); sequelize.authenticate().then(() => {console.log('✅ Backend can connect to PostgreSQL!'); process.exit(0);}).catch(err => {console.log('❌ Backend connection failed:', err.message); process.exit(1);});"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ PostgreSQL Setup Successful!
    echo ========================================
    echo.
    echo Now you can run:
    echo   npm run db:migrate
    echo   npm run db:seed
    echo   npm run dev
    echo.
) else (
    echo.
    echo ❌ Backend still cannot connect
    echo Please check the connection parameters manually
)

:END
cd ..
pause
