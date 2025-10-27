-- Connect to database
\c skyraksys_hrm

-- Check if all cancellation columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leave_requests'
AND column_name IN ('isCancellation', 'originalLeaveRequestId', 'cancellationNote', 'cancelledAt')
ORDER BY column_name;

-- Should return 4 rows if all columns exist
