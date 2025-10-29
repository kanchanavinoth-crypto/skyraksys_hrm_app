@echo off
echo Setting up PostgreSQL database for HRM system...

echo Creating database user...
psql -U postgres -c "CREATE USER hrm_admin WITH PASSWORD 'hrm_secure_2024';" 2>nul

echo Creating database...
psql -U postgres -c "CREATE DATABASE skyraksys_hrm OWNER hrm_admin;" 2>nul

echo Granting privileges...
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_admin;" 2>nul

echo Testing connection...
psql -U hrm_admin -d skyraksys_hrm -c "SELECT current_database(), current_user;"

echo PostgreSQL setup complete!
pause
