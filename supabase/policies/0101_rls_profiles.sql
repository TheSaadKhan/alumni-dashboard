-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Public profiles are viewable by all users" ON profiles
FOR SELECT USING (
  is_active = true 
  AND (privacy_settings->>'profile_visible')::boolean = true
);

-- Contact information policies
CREATE POLICY "Users can manage own contact info" ON contact_information
FOR ALL USING (auth.uid() IN (
  SELECT auth_user_id FROM profiles WHERE id = profile_id
));

-- Education history policies
CREATE POLICY "Users can manage own education history" ON education_history
FOR ALL USING (auth.uid() IN (
  SELECT auth_user_id FROM profiles WHERE id = profile_id
));

CREATE POLICY "Education history is viewable for public profiles" ON education_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = profile_id 
    AND profiles.is_active = true
    AND (profiles.privacy_settings->>'profile_visible')::boolean = true
  )
);