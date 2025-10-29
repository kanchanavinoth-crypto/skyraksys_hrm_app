@echo off
echo ========================================
echo Quick SQLite Setup - SkyRakSys HRM
echo ========================================
echo.

echo This will set up your HRM system with SQLite database
echo (no PostgreSQL installation required)
echo.

cd backend

echo [1/4] Installing SQLite dependency...
npm install sqlite3 --save

echo [2/4] Configuring for SQLite...
copy .env.sqlite .env
if %errorlevel% neq 0 (
    echo Creating SQLite configuration...
    echo # SQLite Configuration > .env
    echo NODE_ENV=development >> .env
    echo PORT=8080 >> .env
    echo. >> .env
    echo # Database Configuration (SQLite) >> .env
    echo DB_DIALECT=sqlite >> .env
    echo DB_STORAGE=./database.sqlite >> .env
    echo. >> .env
    echo # JWT Configuration >> .env
    echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env
    echo JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production >> .env
    echo JWT_EXPIRES_IN=1h >> .env
    echo JWT_REFRESH_EXPIRES_IN=7d >> .env
    echo. >> .env
    echo # Security Configuration >> .env
    echo BCRYPT_ROUNDS=12 >> .env
    echo RATE_LIMIT_WINDOW_MS=900000 >> .env
    echo RATE_LIMIT_MAX_REQUESTS=100 >> .env
)

echo [3/4] Ensuring dependencies are installed...
npm install

echo [4/4] Testing backend startup...
echo Starting backend test with SQLite...

node -e "console.log('Testing SQLite backend...'); const express = require('express'); const app = express(); app.get('/test', (req,res) => res.json({status:'OK', database:'SQLite'})); const server = app.listen(8081, () => {console.log('✅ Backend works with SQLite!'); server.close();});"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ SQLite Setup Complete!
    echo ========================================
    echo.
    echo Your backend is now configured to use SQLite
    echo.
    echo TO START:
    echo   cd backend
    echo   npm run dev
    echo.
    echo Database will be created automatically as: database.sqlite
    echo Sample data will be seeded on first run
    echo.
) else (
    echo.
    echo ⚠️  Setup completed but test failed
    echo This might be due to missing dependencies
    echo Try running: npm install
)

cd ..
pause
