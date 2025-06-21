-- SIMPLIFIED TABLE CREATION SCRIPT
-- This script creates missing tables for the dashboard but avoids using the table_exists function
-- Instead, it uses direct EXISTS queries in each section

-- Create subjects table if it doesn't exist
DO $$
BEGIN
  -- Check if subjects table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subjects'
  ) THEN
    CREATE TABLE public.subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add RLS policies for subjects
    ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
    
    -- Allow all authenticated users to view subjects
    CREATE POLICY subjects_select_policy ON public.subjects
      FOR SELECT USING (auth.role() = 'authenticated');
      
    -- Allow administrators to modify subjects
    CREATE POLICY subjects_all_policy ON public.subjects
      USING (
        EXISTS (
          SELECT 1 FROM public.teacher_profiles
          WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
      );
      
    -- Insert some sample subjects
    INSERT INTO public.subjects (name, description)
    VALUES 
      ('Mathematics', 'Study of numbers, quantities, and shapes'),
      ('Science', 'Study of the natural world'),
      ('English', 'Study of language and literature'),
      ('History', 'Study of past events'),
      ('Geography', 'Study of places and environments');
  END IF;
END
$$;

-- Create topics table if it doesn't exist
DO $$
BEGIN
  -- Check if topics table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'topics'
  ) THEN
    CREATE TABLE public.topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        subject_id UUID REFERENCES public.subjects(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add RLS policies for topics
    ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
    
    -- Allow all authenticated users to view topics
    CREATE POLICY topics_select_policy ON public.topics
      FOR SELECT USING (auth.role() = 'authenticated');
      
    -- Allow administrators to modify topics
    CREATE POLICY topics_all_policy ON public.topics
      USING (
        EXISTS (
          SELECT 1 FROM public.teacher_profiles
          WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
      );
      
    -- Insert some sample topics if subjects exist
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'subjects'
    ) THEN
      INSERT INTO public.topics (name, description, subject_id)
      SELECT 'Algebra', 'Study of mathematical symbols and rules', id
      FROM public.subjects WHERE name = 'Mathematics';
      
      INSERT INTO public.topics (name, description, subject_id)
      SELECT 'Biology', 'Study of living organisms', id
      FROM public.subjects WHERE name = 'Science';
      
      INSERT INTO public.topics (name, description, subject_id)
      SELECT 'Grammar', 'Study of language structure', id
      FROM public.subjects WHERE name = 'English';
    END IF;
  END IF;
END
$$;

-- Create exams table if it doesn't exist
DO $$
BEGIN
  -- Check if exams table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exams'
  ) THEN    CREATE TABLE public.exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        subject_id UUID REFERENCES public.subjects(id),
        topic_id UUID REFERENCES public.topics(id),
        class_level TEXT,
        exam_type TEXT,
        max_marks INTEGER DEFAULT 100,
        passing_marks INTEGER DEFAULT 40,
        duration_minutes INTEGER DEFAULT 60,
        created_by UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add RLS policies for exams
    ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
    
    -- Allow teachers to view their own exams
    CREATE POLICY exams_select_policy ON public.exams
      FOR SELECT USING (
        auth.role() = 'authenticated' AND (
          created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.teacher_profiles
            WHERE user_id = auth.uid() AND role = 'ADMIN'
          )
        )
      );
      
    -- Allow teachers to modify their own exams
    CREATE POLICY exams_modify_policy ON public.exams
      USING (created_by = auth.uid());
  END IF;
END
$$;

-- Create exam_results table if it doesn't exist
DO $$
BEGIN
  -- Check if exam_results table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exam_results'
  ) THEN
    CREATE TABLE public.exam_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id UUID REFERENCES public.exams(id),
        student_id UUID NOT NULL,
        examiner_id UUID NOT NULL,
        score INTEGER,
        percentage DECIMAL,
        passing_status TEXT CHECK (passing_status IN ('PASS', 'FAIL')),
        status TEXT DEFAULT 'PENDING',
        feedback TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add RLS policies for exam_results
    ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
    
    -- Allow teachers to view results where they are the examiner
    CREATE POLICY exam_results_teacher_policy ON public.exam_results
      FOR ALL USING (examiner_id = auth.uid());
      
    -- Allow students to view their own results
    CREATE POLICY exam_results_student_policy ON public.exam_results
      FOR SELECT USING (student_id = auth.uid());
      
    -- Allow admins to view all results
    CREATE POLICY exam_results_admin_policy ON public.exam_results
      USING (
        EXISTS (
          SELECT 1 FROM public.teacher_profiles
          WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
      );
  END IF;
END
$$;

-- Create timetables table if it doesn't exist
DO $$
BEGIN
  -- Check if timetables table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'timetables'
  ) THEN
    CREATE TABLE public.timetables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id TEXT NOT NULL,
        teacher_id UUID NOT NULL,
        subject_id UUID REFERENCES public.subjects(id),
        day_of_week TEXT,
        start_time TIME,
        end_time TIME,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add RLS policies for timetables
    ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
    
    -- Allow teachers to view their own timetables
    CREATE POLICY timetables_teacher_policy ON public.timetables
      FOR ALL USING (teacher_id = (
        SELECT id FROM public.teacher_profiles
        WHERE user_id = auth.uid()
      ));
      
    -- Allow admins to view all timetables
    CREATE POLICY timetables_admin_policy ON public.timetables
      USING (
        EXISTS (
          SELECT 1 FROM public.teacher_profiles
          WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
      );
  END IF;
END
$$;

-- Create a helper view for exam results with percentage calculation
DO $$
DECLARE
  topic_id_exists BOOLEAN;
  examiner_id_exists BOOLEAN;
  percentage_exists BOOLEAN;
  passing_status_exists BOOLEAN;
  status_exists BOOLEAN;
  feedback_exists BOOLEAN;
  score_exists BOOLEAN;
  subject_id_exists BOOLEAN;
  student_id_exists BOOLEAN;
  created_at_exists BOOLEAN;
  updated_at_exists BOOLEAN;
  select_clause TEXT;
  from_clause TEXT;
BEGIN
  BEGIN -- Main block with exception handling
    -- Drop the view if it exists
    DROP VIEW IF EXISTS exam_results_with_percentage;
    
    -- Check if required columns exist
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'exams'
      AND column_name = 'topic_id'
    ) INTO topic_id_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exam_results'
    AND column_name = 'examiner_id'
  ) INTO examiner_id_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exam_results'
    AND column_name = 'percentage'
  ) INTO percentage_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exam_results'
    AND column_name = 'passing_status'
  ) INTO passing_status_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exam_results'
    AND column_name = 'status'
  ) INTO status_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exam_results'
    AND column_name = 'feedback'
  ) INTO feedback_exists;
    SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exam_results'
    AND column_name = 'score'
  ) INTO score_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exam_results'
    AND column_name = 'created_at'
  ) INTO created_at_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exam_results'
    AND column_name = 'updated_at'
  ) INTO updated_at_exists;
  
  -- Check if all required tables exist before creating the view
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exam_results'
  ) AND EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exams'
  ) THEN
    -- Build dynamic SELECT clause based on column existence
    select_clause := '
      SELECT 
        r.id,
        r.exam_id,
        r.student_id,';
        
    -- Add optional columns with NULL fallbacks
    IF examiner_id_exists THEN
      select_clause := select_clause || '
        r.examiner_id,';
    ELSE
      select_clause := select_clause || '
        NULL AS examiner_id,';
    END IF;
    
    -- Add score column if it exists
    IF score_exists THEN
      select_clause := select_clause || '
        r.score,';
    ELSE
      select_clause := select_clause || '
        NULL AS score,';
    END IF;
    
    -- Handle percentage calculation
    IF percentage_exists THEN
      IF score_exists THEN
        select_clause := select_clause || '
          CASE
            WHEN r.percentage IS NOT NULL THEN r.percentage
            WHEN e.max_marks > 0 AND r.score IS NOT NULL THEN (r.score * 100.0 / e.max_marks)
            ELSE NULL
          END AS percentage,';
      ELSE
        select_clause := select_clause || '
          r.percentage,';
      END IF;
    ELSE
      IF score_exists THEN
        select_clause := select_clause || '
          CASE
            WHEN e.max_marks > 0 AND r.score IS NOT NULL THEN (r.score * 100.0 / e.max_marks)
            ELSE NULL
          END AS percentage,';
      ELSE
        select_clause := select_clause || '
          NULL AS percentage,';
      END IF;
    END IF;
    
    -- Add more optional columns
    IF passing_status_exists THEN
      select_clause := select_clause || '
        r.passing_status,';
    ELSE
      select_clause := select_clause || '
        NULL AS passing_status,';
    END IF;
    
    IF status_exists THEN
      select_clause := select_clause || '
        r.status,';
    ELSE
      select_clause := select_clause || '
        ''PENDING'' AS status,';
    END IF;
    
    IF feedback_exists THEN
      select_clause := select_clause || '
        r.feedback,';
    ELSE
      select_clause := select_clause || '
        NULL AS feedback,';
    END IF;
      -- Complete the SELECT clause
    select_clause := select_clause || '
';
    
    -- Add timestamp columns if they exist
    IF created_at_exists THEN
      select_clause := select_clause || '        r.created_at,
';
    ELSE
      select_clause := select_clause || '        e.created_at,
';
    END IF;
    
    IF updated_at_exists THEN
      select_clause := select_clause || '        r.updated_at,
';
    ELSE
      select_clause := select_clause || '        e.updated_at,
';
    END IF;
    
    select_clause := select_clause || '        e.title AS exam_title,
        s.name AS subject_name,';
        
    -- Add topic name based on topic_id existence
    IF topic_id_exists THEN
      select_clause := select_clause || '
        t.name AS topic_name,';
    ELSE
      select_clause := select_clause || '
        NULL AS topic_name,';
    END IF;
    
    select_clause := select_clause || '
        sp.full_name AS student_name,';
        
    -- Add examiner name based on examiner_id existence
    IF examiner_id_exists THEN
      select_clause := select_clause || '
        tp.full_name AS examiner_name';
    ELSE
      select_clause := select_clause || '
        NULL AS examiner_name';
    END IF;    -- Build FROM clause based on column existence
    from_clause := '
      FROM 
        public.exam_results r
      LEFT JOIN 
        public.exams e ON r.exam_id = e.id';
      -- Only add subject join if subject_id exists in exams
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'exams'
      AND column_name = 'subject_id'
    ) INTO subject_id_exists;
    
    IF subject_id_exists THEN
      from_clause := from_clause || '
      LEFT JOIN 
        public.subjects s ON e.subject_id = s.id';
    ELSE
      from_clause := from_clause || '
      LEFT JOIN 
        public.subjects s ON false'; -- Still include subjects but with no rows matching
    END IF;
        
    -- Add topics join if topic_id exists
    IF topic_id_exists THEN
      from_clause := from_clause || '
      LEFT JOIN 
        public.topics t ON e.topic_id = t.id';
    END IF;
    
    -- Only add student_profiles join if student_id exists
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'exam_results'
      AND column_name = 'student_id'
    ) INTO student_id_exists;
    
    IF student_id_exists THEN
      from_clause := from_clause || '
      LEFT JOIN 
        public.student_profiles sp ON r.student_id = sp.user_id';
    ELSE
      from_clause := from_clause || '
      LEFT JOIN 
        public.student_profiles sp ON false'; -- Still include but with no rows matching
    END IF;
        
    -- Add teacher profiles join if examiner_id exists
    IF examiner_id_exists THEN
      from_clause := from_clause || '
      LEFT JOIN 
        public.teacher_profiles tp ON r.examiner_id = tp.user_id';
    END IF;    -- Execute the dynamic SQL to create the view
    BEGIN
      EXECUTE 'CREATE VIEW exam_results_with_percentage AS ' || select_clause || from_clause;
      
      -- Grant access to the view
      EXECUTE 'GRANT SELECT ON exam_results_with_percentage TO authenticated';
      
      RAISE NOTICE 'Successfully created exam_results_with_percentage view';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error creating view: %', SQLERRM;
        
        -- Check for created_at and updated_at columns
        DECLARE
          r_created_at_exists BOOLEAN;
          r_updated_at_exists BOOLEAN;
          fallback_select TEXT;
        BEGIN
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'exam_results'
            AND column_name = 'created_at'
          ) INTO r_created_at_exists;
          
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'exam_results'
            AND column_name = 'updated_at'
          ) INTO r_updated_at_exists;
          
          -- Build fallback SELECT with correct timestamp references
          fallback_select := '
            CREATE VIEW exam_results_with_percentage AS
            SELECT 
              r.id,
              r.exam_id,
              r.student_id,
              NULL::uuid AS examiner_id,
              NULL::integer AS score,
              NULL::numeric AS percentage,
              NULL::text AS passing_status,
              ''PENDING''::text AS status,
              NULL::text AS feedback,';
              
          -- Add timestamps based on which table has them
          IF r_created_at_exists THEN
            fallback_select := fallback_select || '
              r.created_at,';
          ELSE
            fallback_select := fallback_select || '
              e.created_at,';
          END IF;
          
          IF r_updated_at_exists THEN
            fallback_select := fallback_select || '
              r.updated_at,';
          ELSE
            fallback_select := fallback_select || '
              e.updated_at,';
          END IF;
          
          -- Complete the fallback SELECT
          fallback_select := fallback_select || '
              e.title AS exam_title,
              NULL::text AS subject_name,
              NULL::text AS topic_name,
              NULL::text AS student_name,
              NULL::text AS examiner_name
            FROM 
              public.exam_results r
            LEFT JOIN 
              public.exams e ON r.exam_id = e.id';
              
          -- Execute the fallback view creation
          EXECUTE fallback_select;
          EXECUTE 'GRANT SELECT ON exam_results_with_percentage TO authenticated';
          RAISE NOTICE 'Created fallback view with correct timestamp columns';
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'Second fallback attempt failed: %', SQLERRM;
            -- Last resort fallback - absolute minimal view with no references to problematic columns
            EXECUTE '
              CREATE VIEW exam_results_with_percentage AS
              SELECT 
                r.id,
                r.exam_id,
                NULL::uuid AS student_id,
                NULL::uuid AS examiner_id,
                NULL::integer AS score,
                NULL::numeric AS percentage,
                NULL::text AS passing_status,
                ''PENDING''::text AS status,
                NULL::text AS feedback,
                now() AS created_at,
                now() AS updated_at,
                NULL::text AS exam_title,
                NULL::text AS subject_name,
                NULL::text AS topic_name,
                NULL::text AS student_name,
                NULL::text AS examiner_name
              FROM 
                public.exam_results r
              LIMIT 0';  -- Empty result set
            
            EXECUTE 'GRANT SELECT ON exam_results_with_percentage TO authenticated';
            RAISE NOTICE 'Created minimal empty fallback view';      END;
    END;
  END IF;
  
  EXCEPTION -- Exception handler for the main block
    WHEN OTHERS THEN
      RAISE NOTICE 'Complete view creation failed: %', SQLERRM;
      
      -- Final safety fallback - create an extremely minimal view that will work in any situation
      BEGIN
        DROP VIEW IF EXISTS exam_results_with_percentage;
        
        EXECUTE '
          CREATE VIEW exam_results_with_percentage AS
          SELECT
            gen_random_uuid() AS id,
            gen_random_uuid() AS exam_id,
            gen_random_uuid() AS student_id,
            gen_random_uuid() AS examiner_id,
            0 AS score,
            0.0 AS percentage,
            ''PENDING''::text AS passing_status,
            ''PENDING''::text AS status,
            ''''::text AS feedback,
            now() AS created_at,
            now() AS updated_at,
            ''''::text AS exam_title,
            ''''::text AS subject_name,
            ''''::text AS topic_name,
            ''''::text AS student_name,
            ''''::text AS examiner_name
          WHERE false';  -- No rows, just structure
          
        EXECUTE 'GRANT SELECT ON exam_results_with_percentage TO authenticated';
        RAISE NOTICE 'Created ultimate fallback view with no dependencies';
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Even the ultimate fallback failed: %', SQLERRM;
      END;
  END; -- End of main block
END
$$;
