-- Connect to your database
\c skyraksys_hrm

-- List all tables
\dt

-- Check leave_requests table structure
\d leave_requests

-- Verify cancellation columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leave_requests'
AND column_name IN ('isCancellation', 'originalLeaveRequestId', 'cancellationNote', 'cancelledAt');

-- Check sample data
SELECT COUNT(*) as total_leave_requests FROM leave_requests;
