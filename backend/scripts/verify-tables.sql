-- Check if leave_requests table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'leave_requests'
);

-- List all tables in database
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check leave_requests table structure
\d leave_requests
