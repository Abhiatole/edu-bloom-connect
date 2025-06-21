-- APPROVE_PENDING_TEACHERS.sql
-- This script approves all pending teacher accounts
-- Run this in the Supabase SQL Editor

-- First, get a count of pending teachers
SELECT COUNT(*) FROM teacher_profiles WHERE status = 'PENDING';

-- Update all pending teacher profiles to approved
UPDATE teacher_profiles
SET 
  status = 'APPROVED',
  approval_date = NOW()
WHERE status = 'PENDING';

-- Verify the update
SELECT COUNT(*) FROM teacher_profiles WHERE status = 'APPROVED';
SELECT COUNT(*) FROM teacher_profiles WHERE status = 'PENDING';

-- Note: You may want to add an approved_by field with the admin's user ID
-- For example:
-- UPDATE teacher_profiles
-- SET 
--   status = 'APPROVED',
--   approval_date = NOW(),
--   approved_by = '00000000-0000-0000-0000-000000000000' -- Replace with admin user ID
-- WHERE status = 'PENDING';
