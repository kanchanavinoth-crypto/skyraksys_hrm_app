-- Migration: Add cancellation columns to leave_requests
-- Run this after your main schema is in place

ALTER TABLE leave_requests
    ADD COLUMN IF NOT EXISTS is_cancellation BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS original_leave_request_id UUID REFERENCES leave_requests(id),
    ADD COLUMN IF NOT EXISTS cancellation_note TEXT;

-- Optionally, add comments for clarity
COMMENT ON COLUMN leave_requests.is_cancellation IS 'Indicates if this is a cancellation request';
COMMENT ON COLUMN leave_requests.original_leave_request_id IS 'References the original leave request being cancelled';
COMMENT ON COLUMN leave_requests.cancellation_note IS 'Reason for cancellation';
