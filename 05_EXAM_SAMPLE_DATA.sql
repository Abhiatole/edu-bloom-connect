-- EXAM SAMPLE DATA
-- This script adds sample data to the exam tables if they're empty

-- Add sample subjects
DO $$
BEGIN
    -- Add sample subjects if none exist
    IF NOT EXISTS (SELECT 1 FROM subjects LIMIT 1) THEN
        INSERT INTO subjects (name, description)
        VALUES 
        ('Mathematics', 'Core mathematics curriculum'),
        ('Science', 'General science topics'),
        ('English', 'Language and literature'),
        ('History', 'World and regional history')
        ON CONFLICT (name) DO NOTHING;
        
        RAISE NOTICE 'Added sample subjects';
    ELSE
        RAISE NOTICE 'Subjects already exist, skipping sample data';
    END IF;
END $$;

-- Add sample topics
DO $$
BEGIN
    -- Add sample topics if none exist
    IF NOT EXISTS (SELECT 1 FROM topics LIMIT 1) THEN
        WITH subject_ids AS (
            SELECT id, name FROM subjects LIMIT 4
        )
        INSERT INTO topics (name, description, subject_id)
        SELECT 
            'Introduction to ' || s.name, 
            'Foundational concepts in ' || s.name, 
            s.id
        FROM subject_ids s;
        
        RAISE NOTICE 'Added sample topics';
    ELSE
        RAISE NOTICE 'Topics already exist, skipping sample data';
    END IF;
END $$;
