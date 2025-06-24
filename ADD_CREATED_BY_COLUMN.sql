-- Script to add created_by column to student_insights table

-- First check if the column already exists to avoid errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'student_insights'
    AND column_name = 'created_by'
  ) THEN
    -- Add the created_by column if it doesn't exist
    ALTER TABLE public.student_insights 
    ADD COLUMN created_by UUID REFERENCES auth.users(id);
    
    -- Update existing rows to set created_by to the current user
    -- This is a temporary measure and you may want to update with actual values later
    UPDATE public.student_insights 
    SET created_by = auth.uid()
    WHERE created_by IS NULL;
    
    RAISE NOTICE 'Added created_by column to student_insights table';
  ELSE
    RAISE NOTICE 'created_by column already exists in student_insights table';
  END IF;
END $$;

-- Output success message
SELECT 'created_by column has been successfully added to student_insights table!' as result;
