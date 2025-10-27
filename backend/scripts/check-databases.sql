-- List all databases
SELECT 
    datname as database_name,
    pg_size_pretty(pg_database_size(datname)) as size,
    datallowconn as allow_connections
FROM pg_database
WHERE datistemplate = false
ORDER BY datname;

-- Check if specific database exists
SELECT EXISTS(
    SELECT 1 FROM pg_database WHERE datname = 'skyraksys_hrm_db'
) as exists;

-- Also check for common variations
SELECT datname 
FROM pg_database 
WHERE datname LIKE '%skyraksys%' OR datname LIKE '%hrm%'
ORDER BY datname;
