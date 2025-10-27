-- Connect as postgres user first:
-- psql -U postgres

-- Drop existing database if it exists (CAREFUL!)
DROP DATABASE IF EXISTS skyraksys_hrm_dev;

-- Create fresh development database
CREATE DATABASE skyraksys_hrm_dev
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_United States.1252'
    LC_CTYPE = 'English_United States.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_dev TO postgres;

-- Connect to the database
\c skyraksys_hrm_dev

-- Verify connection
SELECT 'Database created successfully!' as status;

-- Show database info
\l skyraksys_hrm_dev
