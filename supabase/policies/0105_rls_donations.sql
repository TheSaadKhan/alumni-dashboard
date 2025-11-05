-- Donation campaigns policies
CREATE POLICY "Anyone can view active campaigns" ON donation_campaigns
FOR SELECT USING (status = 'active');

CREATE POLICY "Organizers can manage their campaigns" ON donation_campaigns
FOR ALL USING (auth.uid() IN (
  SELECT auth_user_id FROM profiles WHERE id = organizer_id
));

-- Donations policies
CREATE POLICY "Users can view own donations" ON donations
FOR SELECT USING (auth.uid() IN (
  SELECT auth_user_id FROM profiles WHERE id = donor_id
));

CREATE POLICY "Users can make donations" ON donations
FOR INSERT WITH CHECK (auth.uid() IN (
  SELECT auth_user_id FROM profiles WHERE id = donor_id
));

CREATE POLICY "Campaign organizers can view donations to their campaigns" ON donations
FOR SELECT USING (EXISTS (
  SELECT 1 FROM donation_campaigns
  WHERE donation_campaigns.id = campaign_id
  AND donation_campaigns.organizer_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
));