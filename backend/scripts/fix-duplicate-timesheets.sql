-- Fix duplicate timesheet entries
-- This script removes duplicate timesheets keeping only the most recent one

-- Step 1: Find and display duplicates
SELECT 
    "employeeId", 
    "weekStartDate", 
    year, 
    COUNT(*) as duplicate_count
FROM timesheets 
GROUP BY "employeeId", "weekStartDate", year 
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicates, keeping only the one with the latest updatedAt
DELETE FROM timesheets
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY "employeeId", "weekStartDate", year 
                ORDER BY "updatedAt" DESC, "createdAt" DESC
            ) as rn
        FROM timesheets
    ) t
    WHERE t.rn > 1
);

-- Step 3: Verify no duplicates remain
SELECT 
    "employeeId", 
    "weekStartDate", 
    year, 
    COUNT(*) as count
FROM timesheets 
GROUP BY "employeeId", "weekStartDate", year 
HAVING COUNT(*) > 1;

-- If above returns no rows, constraint can be safely created
