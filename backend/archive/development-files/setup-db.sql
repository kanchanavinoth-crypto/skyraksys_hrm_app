-- Create database user
CREATE USER hrm_admin WITH PASSWORD 'hrm_secure_2024';

-- Create database
CREATE DATABASE skyraksys_hrm OWNER hrm_admin;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_admin;

-- Connect to the new database
\c skyraksys_hrm;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO hrm_admin;
