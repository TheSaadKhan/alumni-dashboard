-- RLS Policies for Network Connections
CREATE POLICY "Users can view their own connections" ON public.network_connections
  FOR SELECT USING (
    user_a = auth.uid() 
    OR user_b = auth.uid()
    OR requester_id = auth.uid()
    OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can create connection requests" ON public.network_connections
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their own connection requests" ON public.network_connections
  FOR UPDATE USING (
    requester_id = auth.uid() 
    OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can delete their own connections" ON public.network_connections
  FOR DELETE USING (
    user_a = auth.uid() 
    OR user_b = auth.uid()
    OR requester_id = auth.uid()
    OR receiver_id = auth.uid()
  );

CREATE POLICY "Organization admins can view connections in their org" ON public.network_connections
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_network' = 'true'
      )
    )
  );

-- RLS Policies for Connection Recommendations
CREATE POLICY "Users can view their own recommendations" ON public.connection_recommendations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create recommendations" ON public.connection_recommendations
  FOR INSERT WITH CHECK (true); -- Managed by backend service

CREATE POLICY "Users can update their own recommendation interactions" ON public.connection_recommendations
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for Donations
CREATE POLICY "Donors can view their own donations" ON public.donations
  FOR SELECT USING (donor_id = auth.uid());

CREATE POLICY "Donors can create donations" ON public.donations
  FOR INSERT WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Organization members can view donations in their org" ON public.donations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'view_donations' = 'true'
      )
    )
  );

CREATE POLICY "Organization admins can manage donations" ON public.donations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_donations' = 'true'
      )
    )
  );

-- RLS Policies for Donation Campaigns
CREATE POLICY "Anyone can view active campaigns" ON public.donation_campaigns
  FOR SELECT USING (is_active = true);

CREATE POLICY "Organization members can create campaigns" ON public.donation_campaigns
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_campaigns' = 'true'
      )
    )
  );

CREATE POLICY "Organization admins can manage campaigns" ON public.donation_campaigns
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_campaigns' = 'true'
      )
    )
  );

-- RLS Policies for Donation Receipts
CREATE POLICY "Donors can view their own receipts" ON public.donation_receipts
  FOR SELECT USING (
    donation_id IN (
      SELECT id FROM public.donations WHERE donor_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage receipts" ON public.donation_receipts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_donations' = 'true'
      )
    )
  );