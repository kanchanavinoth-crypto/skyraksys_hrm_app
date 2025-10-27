@echo off
echo.
echo ========================================
echo SkyrakSys HRM - Database Options Menu
echo ========================================
echo.

echo Choose your database setup:
echo.
echo 1. 🐳 Docker PostgreSQL ^(requires Docker Desktop^)
echo 2. 💻 Local PostgreSQL ^(install PostgreSQL locally^)
echo 3. 🌐 Cloud PostgreSQL ^(Heroku, AWS, etc.^)
echo 4. 📁 Keep SQLite ^(current setup^)
echo 5. 📊 View database comparison
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo 🐳 Docker PostgreSQL Setup:
    echo 1. Start Docker Desktop
    echo 2. Run: docker-compose up -d postgres
    echo 3. Run: implement-postgresql.bat
    pause
) else if "%choice%"=="2" (
    echo.
    echo 💻 Local PostgreSQL Setup:
    setup-local-postgresql.bat
) else if "%choice%"=="3" (
    echo.
    echo 🌐 Cloud PostgreSQL Setup:
    cloud-database-guide.bat
) else if "%choice%"=="4" (
    echo.
    echo 📁 SQLite Configuration:
    echo Your system is already running with SQLite!
    echo ✅ No changes needed - continue development
    echo.
    echo Current status:
    echo - Database: SQLite ^(database.sqlite^)
    echo - Backend: Running on port 8080
    echo - Frontend: Running on port 3000
    echo.
    echo 💡 You can migrate to PostgreSQL later when needed.
    pause
) else if "%choice%"=="5" (
    echo.
    node database-comparison.js
    pause
) else (
    echo Invalid choice. Please run again.
    pause
)

echo.
echo 🎯 Current Recommendation:
echo For development: SQLite ^(current^) is fine
echo For production: PostgreSQL is essential
echo.
pause
