-- Admin override policies
CREATE POLICY "Admins can manage all data" ON profiles
FOR ALL USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
));

CREATE POLICY "Admins can manage all events" ON events
FOR ALL USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
));

CREATE POLICY "Admins can manage all jobs" ON job_postings
FOR ALL USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
));