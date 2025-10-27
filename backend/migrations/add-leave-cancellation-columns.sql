-- Add leave cancellation columns to leave_requests table
DO $$
BEGIN
    -- Add isCancellation column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' 
        AND column_name = 'isCancellation'
    ) THEN
        ALTER TABLE leave_requests 
        ADD COLUMN "isCancellation" BOOLEAN DEFAULT false NOT NULL;
        COMMENT ON COLUMN leave_requests."isCancellation" IS 'Indicates if this is a cancellation request';
    END IF;

    -- Add originalLeaveRequestId column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' 
        AND column_name = 'originalLeaveRequestId'
    ) THEN
        ALTER TABLE leave_requests 
        ADD COLUMN "originalLeaveRequestId" UUID NULL
        REFERENCES leave_requests(id) ON UPDATE CASCADE ON DELETE SET NULL;
        COMMENT ON COLUMN leave_requests."originalLeaveRequestId" IS 'References the original leave request if this is a cancellation';
    END IF;

    -- Add cancellationNote column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' 
        AND column_name = 'cancellationNote'
    ) THEN
        ALTER TABLE leave_requests 
        ADD COLUMN "cancellationNote" TEXT NULL;
        COMMENT ON COLUMN leave_requests."cancellationNote" IS 'Reason for cancelling the leave';
    END IF;

    -- Add cancelledAt column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' 
        AND column_name = 'cancelledAt'
    ) THEN
        ALTER TABLE leave_requests 
        ADD COLUMN "cancelledAt" TIMESTAMP WITH TIME ZONE NULL;
        COMMENT ON COLUMN leave_requests."cancelledAt" IS 'Timestamp when the leave was cancelled';
    END IF;

    RAISE NOTICE '✅ Leave cancellation columns added successfully';
END $$;

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leave_requests'
AND column_name IN ('isCancellation', 'originalLeaveRequestId', 'cancellationNote', 'cancelledAt')
ORDER BY column_name;
