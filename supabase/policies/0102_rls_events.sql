-- Events policies
CREATE POLICY "Anyone can view published events" ON events
FOR SELECT USING (status = 'published' AND is_public = true);

CREATE POLICY "Organizers can manage their events" ON events
FOR ALL USING (auth.uid() IN (
  SELECT auth_user_id FROM profiles WHERE id = organizer_id
));

CREATE POLICY "Admins can manage all events" ON events
FOR ALL USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
));

-- Event attendees policies
CREATE POLICY "Users can view event attendees" ON event_attendees
FOR SELECT USING (true);

CREATE POLICY "Users can register for events" ON event_attendees
FOR INSERT WITH CHECK (auth.uid() IN (
  SELECT auth_user_id FROM profiles WHERE id = profile_id
));

CREATE POLICY "Users can update own event registration" ON event_attendees
FOR UPDATE USING (auth.uid() IN (
  SELECT auth_user_id FROM profiles WHERE id = profile_id
));