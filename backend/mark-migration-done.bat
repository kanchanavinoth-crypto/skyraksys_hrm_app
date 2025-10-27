@echo off
echo ========================================
echo Marking Migration as Complete
echo ========================================
echo.

cd /d "d:\skyraksys_hrm\backend"

echo The columns already exist in the database.
echo Marking migration as complete...
echo.

REM Mark the migration as executed
psql -U postgres -d skyraksys_hrm -c "INSERT INTO \"SequelizeMeta\" (name) VALUES ('20250127000000-add-leave-cancellation-fields.js') ON CONFLICT DO NOTHING;"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Migration marked as complete
    echo.
    echo Verifying migration status...
    npx sequelize-cli db:migrate:status
) else (
    echo ❌ Failed to mark migration
)

pause
