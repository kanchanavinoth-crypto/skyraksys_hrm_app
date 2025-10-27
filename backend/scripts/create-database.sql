-- Connect to PostgreSQL first
-- psql -U postgres

-- Check if database exists
SELECT datname FROM pg_database WHERE datname = 'skyraksys_hrm_db';

-- Create database if it doesn't exist
CREATE DATABASE skyraksys_hrm_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_United States.1252'
    LC_CTYPE = 'English_United States.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_db TO postgres;

-- Verify
\l skyraksys_hrm_db
