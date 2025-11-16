-- RLS Policies for Assets
CREATE POLICY "Users can view assets based on visibility" ON public.assets
  FOR SELECT USING (
    visibility = 'public'
    OR 
    (visibility = 'organization' AND organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    ))
    OR
    (visibility = 'private' AND profile_id = auth.uid())
    OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_assets' = 'true'
      )
    )
  );

CREATE POLICY "Users can create assets in their org" ON public.assets
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'upload_assets' = 'true'
      )
    )
    AND profile_id = auth.uid()
  );

CREATE POLICY "Asset owners can update their assets" ON public.assets
  FOR UPDATE USING (
    profile_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_assets' = 'true'
      )
    )
  );

CREATE POLICY "Asset owners can delete their assets" ON public.assets
  FOR DELETE USING (
    profile_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_assets' = 'true'
      )
    )
  );

-- RLS Policies for Asset Collections
CREATE POLICY "Users can view collections based on visibility" ON public.asset_collections
  FOR SELECT USING (
    visibility = 'public'
    OR 
    (visibility = 'organization' AND organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    ))
    OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_assets' = 'true'
      )
    )
  );

CREATE POLICY "Organization admins can manage collections" ON public.asset_collections
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_assets' = 'true'
      )
    )
  );

-- RLS Policies for Asset Collection Memberships
CREATE POLICY "Users can view collection memberships for accessible assets" ON public.asset_collection_memberships
  FOR SELECT USING (
    asset_id IN (
      SELECT id FROM public.assets WHERE 
        visibility = 'public'
        OR visibility = 'organization'
        OR profile_id = auth.uid()
    )
  );

CREATE POLICY "Collection owners can manage memberships" ON public.asset_collection_memberships
  FOR ALL USING (
    collection_id IN (
      SELECT id FROM public.asset_collections 
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND is_active = true
        AND role_id IN (
          SELECT id FROM public.organization_roles 
          WHERE permissions->>'manage_assets' = 'true'
        )
      )
    )
  );

-- RLS Policies for Asset Access Logs
CREATE POLICY "Organization admins can view access logs" ON public.asset_access_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'view_analytics' = 'true'
      )
    )
  );

-- RLS Policies for Asset Shared Links
CREATE POLICY "Link creators can manage their shared links" ON public.asset_shared_links
  FOR ALL USING (
    created_by_member_id IN (
      SELECT id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_assets' = 'true'
      )
    )
  );