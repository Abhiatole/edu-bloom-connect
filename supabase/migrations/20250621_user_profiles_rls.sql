-- RLS for user_profiles: allow admin creation and admin approval
-- Allow admins to insert their own profile
CREATE POLICY "Admins can create own profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'ADMIN');

-- Allow admins to update status of any user (for approval)
CREATE POLICY "Admins can approve users" ON user_profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'ADMIN' AND status = 'APPROVED'));

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'ADMIN'));
