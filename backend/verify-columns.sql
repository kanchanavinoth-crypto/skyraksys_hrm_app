-- Check if columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'leave_requests'
ORDER BY ordinal_position;

-- Test query with new columns
SELECT 
    id,
    "employeeId",
    "startDate",
    "endDate",
    status,
    "isCancellation",
    "originalLeaveRequestId",
    "cancellationNote",
    "cancelledAt"
FROM leave_requests
LIMIT 5;
