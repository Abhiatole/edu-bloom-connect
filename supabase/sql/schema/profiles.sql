-- ...existing code...

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS fk_user_profiles_user_id,
  ADD CONSTRAINT fk_user_profiles_user_id
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.admin_profiles
  ADD CONSTRAINT fk_admin_profiles_user_id
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_profiles
  ADD CONSTRAINT fk_teacher_profiles_user_id
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.student_profiles
  ADD CONSTRAINT fk_student_profiles_user_id
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ...existing code...