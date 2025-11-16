-- Profiles Policies (Updated for organization context)
DROP POLICY IF EXISTS "Users can view active profiles" ON public.profiles;
CREATE POLICY "Users can view active profiles"
ON public.profiles
FOR SELECT 
USING (
  is_active = true AND 
  (
    -- Users can see profiles in their shared organizations
    id = auth.uid()
    OR
    primary_organization_id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
    OR
    -- Allow viewing if both users don't have primary organizations
    (
      primary_organization_id IS NULL 
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles p2 
        WHERE p2.id = auth.uid() AND p2.primary_organization_id IS NOT NULL
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Enhanced profile viewing policy for network features
DROP POLICY IF EXISTS "Users can view profiles for networking" ON public.profiles;
CREATE POLICY "Users can view profiles for networking"
ON public.profiles
FOR SELECT
USING (
  is_active = true AND
  (
    -- Always see your own profile
    id = auth.uid()
    OR
    -- See profiles in your organizations
    EXISTS (
      SELECT 1 
      FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = profiles.id
        AND om1.is_active = true
        AND om2.is_active = true
    )
    OR
    -- See connected profiles (network connections)
    EXISTS (
      SELECT 1 
      FROM public.network_connections nc
      WHERE (
        (nc.user_a = auth.uid() AND nc.user_b = profiles.id) OR
        (nc.user_a = profiles.id AND nc.user_b = auth.uid())
      )
      AND nc.status = 'accepted'
    )
    OR
    -- See profiles that have public visibility
    get_user_preference(profiles.id, 'privacy.profile_visibility', '"public"') = '"public"'
  )
);

-- Policy for system/admin access to all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.is_active = true
      AND r.permissions->>'manage_members' = 'true'
  )
);

-- Function to check if user can view another profile
CREATE OR REPLACE FUNCTION public.can_view_profile(
  p_viewer_id uuid,
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_target_visibility text;
  v_shared_organizations boolean;
  v_connected boolean;
BEGIN
  -- Always allow viewing own profile
  IF p_viewer_id = p_profile_id THEN
    RETURN true;
  END IF;

  -- Check if target profile is active
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_profile_id AND is_active = true
  ) THEN
    RETURN false;
  END IF;

  -- Get profile visibility preference
  SELECT COALESCE(
    public.get_user_preference(p_profile_id, 'privacy.profile_visibility', '"public"')::text,
    'public'
  ) INTO v_target_visibility;

  -- Remove quotes from JSONB value
  v_target_visibility := REPLACE(REPLACE(v_target_visibility, '"', ''), '''', '');

  -- Public profiles are always viewable
  IF v_target_visibility = 'public' THEN
    RETURN true;
  END IF;

  -- Check shared organizations
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = p_viewer_id
      AND om2.user_id = p_profile_id
      AND om1.is_active = true
      AND om2.is_active = true
  ) INTO v_shared_organizations;

  IF v_shared_organizations THEN
    RETURN true;
  END IF;

  -- Check network connections for "connections_only" visibility
  IF v_target_visibility = 'connections_only' THEN
    SELECT EXISTS (
      SELECT 1 
      FROM public.network_connections nc
      WHERE (
        (nc.user_a = p_viewer_id AND nc.user_b = p_profile_id) OR
        (nc.user_a = p_profile_id AND nc.user_b = p_viewer_id)
      )
      AND nc.status = 'accepted'
    ) INTO v_connected;

    RETURN v_connected;
  END IF;

  -- Private profiles are only visible to self and admins
  IF v_target_visibility = 'private' THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.organization_members om
      JOIN public.organization_roles r ON om.role_id = r.id
      WHERE om.user_id = p_viewer_id
        AND om.is_active = true
        AND r.permissions->>'manage_members' = 'true'
    );
  END IF;

  RETURN false;
END;
$$;

-- Update the main view policy to use the function
DROP POLICY IF EXISTS "Users can view active profiles" ON public.profiles;
CREATE POLICY "Users can view active profiles"
ON public.profiles
FOR SELECT 
USING (public.can_view_profile(auth.uid(), id));