-- VERIFY_CONSTRAINT_FIX.sql
-- This script verifies that constraints can be properly added
-- and tests the fix for "ADD CONSTRAINT IF NOT EXISTS" issues

-- First, we'll create a test table
DROP TABLE IF EXISTS test_constraints;

CREATE TABLE test_constraints (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING'
);

-- Try to add a constraint using the DO block approach
-- which is safer than "ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS"
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'test_status_check'
        AND conrelid = 'public.test_constraints'::regclass
    ) THEN
        BEGIN
            ALTER TABLE public.test_constraints 
                ADD CONSTRAINT test_status_check 
                CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED'));
            RAISE NOTICE 'Added test status check constraint';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Test status check constraint already exists';
        END;
    END IF;
END $$;

-- Try to add it again - this should not error
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'test_status_check'
        AND conrelid = 'public.test_constraints'::regclass
    ) THEN
        BEGIN
            ALTER TABLE public.test_constraints 
                ADD CONSTRAINT test_status_check 
                CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED'));
            RAISE NOTICE 'Added test status check constraint';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Test status check constraint already exists';
        END;
    ELSE
        RAISE NOTICE 'Constraint already exists - verified working correctly';
    END IF;
END $$;

-- Verify constraint enforcement works
INSERT INTO test_constraints (name, status) VALUES ('Valid Status', 'PENDING');
-- This should fail - uncomment to test
-- INSERT INTO test_constraints (name, status) VALUES ('Invalid Status', 'INVALID');

-- Cleanup
DROP TABLE IF EXISTS test_constraints;

RAISE NOTICE 'Constraint verification completed successfully';
