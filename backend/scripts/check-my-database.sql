-- 1. List all non-template databases
\echo '========================================
\echo 'All Databases:'
\echo '========================================

SELECT 
    datname as "Database",
    pg_size_pretty(pg_database_size(datname)) as "Size",
    CASE WHEN datallowconn THEN 'Yes' ELSE 'No' END as "Connections"
FROM pg_database
WHERE datistemplate = false
ORDER BY datname;

\echo ''
\echo '========================================
\echo 'HRM-Related Databases:'
\echo '========================================

-- 2. Find HRM-related databases
SELECT 
    datname as "Database Name",
    pg_size_pretty(pg_database_size(datname)) as "Size"
FROM pg_database 
WHERE datname LIKE '%skyraksys%' 
   OR datname LIKE '%hrm%'
ORDER BY datname;

\echo ''
\echo '========================================
\echo 'Check Specific Database:'
\echo '========================================

-- 3. Check if skyraksys_hrm_db exists
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_database WHERE datname = 'skyraksys_hrm_db') 
        THEN '✅ skyraksys_hrm_db EXISTS'
        ELSE '❌ skyraksys_hrm_db NOT FOUND'
    END as "Status";

\echo ''
\echo '========================================
\echo 'Database Details:'
\echo '========================================

-- 4. Get details about skyraksys_hrm_db
SELECT 
    datname as "Database Name",
    pg_encoding_to_char(encoding) as "Encoding",
    datcollate as "Collation",
    datctype as "Ctype",
    pg_size_pretty(pg_database_size(datname)) as "Size",
    (SELECT count(*) FROM pg_stat_activity WHERE datname = 'skyraksys_hrm_db') as "Active Connections"
FROM pg_database
WHERE datname = 'skyraksys_hrm_db';
