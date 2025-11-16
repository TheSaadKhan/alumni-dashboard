-- 0008_network_connections.sql
CREATE TABLE IF NOT EXISTS public.network_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Enhanced connection tracking
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  requester_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  receiver_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  status text DEFAULT 'pending', -- pending, accepted, rejected, blocked, withdrawn
  connection_note text,
  
  -- NEW: Enhanced connection fields
  connection_type text DEFAULT 'general', -- colleague, classmate, mentor, mentee, friend, family
  relationship_strength integer CHECK (relationship_strength >= 1 AND relationship_strength <= 5),
  shared_interests text[] DEFAULT '{}',
  shared_groups text[] DEFAULT '{}',
  
  -- NEW: Connection metadata
  accepted_at timestamptz,
  rejected_at timestamptz,
  blocked_at timestamptz,
  withdrawn_at timestamptz,
  last_interaction_at timestamptz,
  
  -- NEW: Visibility and preferences
  visibility_settings jsonb DEFAULT '{
    "profile_visible": true,
    "contact_info_visible": true,
    "mutual_connections_visible": true
  }'::jsonb,
  
  -- NEW: Recommendation system
  recommended_by uuid REFERENCES public.profiles(id),
  recommendation_strength integer CHECK (recommendation_strength >= 1 AND recommendation_strength <= 5),
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (user_a, user_b)
);

-- Connection recommendations table
CREATE TABLE IF NOT EXISTS public.connection_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recommended_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  recommended_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Recommendation details
  recommendation_source text NOT NULL, -- algorithm, manual, mutual_connections, shared_interests
  recommendation_reason text,
  confidence_score decimal CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- NEW: Recommendation factors
  shared_connections_count integer DEFAULT 0,
  shared_interests_count integer DEFAULT 0,
  shared_groups_count integer DEFAULT 0,
  shared_organizations_count integer DEFAULT 0,
  geographic_proximity decimal,
  
  -- NEW: Tracking
  shown_at timestamptz,
  clicked_at timestamptz,
  ignored_at timestamptz,
  connected_at timestamptz,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (user_id, recommended_user_id)
);

-- Enable RLS
ALTER TABLE public.network_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_recommendations ENABLE ROW LEVEL SECURITY;

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

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_network_connections_updated_at
  BEFORE UPDATE ON public.network_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_connection_recommendations_updated_at
  BEFORE UPDATE ON public.connection_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_network_connections_user_a ON public.network_connections (user_a);
CREATE INDEX IF NOT EXISTS idx_network_connections_user_b ON public.network_connections (user_b);
CREATE INDEX IF NOT EXISTS idx_network_connections_requester_id ON public.network_connections (requester_id);
CREATE INDEX IF NOT EXISTS idx_network_connections_receiver_id ON public.network_connections (receiver_id);
CREATE INDEX IF NOT EXISTS idx_network_connections_organization_id ON public.network_connections (organization_id);
CREATE INDEX IF NOT EXISTS idx_network_connections_status ON public.network_connections (status);
CREATE INDEX IF NOT EXISTS idx_network_connections_connection_type ON public.network_connections (connection_type);
CREATE INDEX IF NOT EXISTS idx_network_connections_created_at ON public.network_connections (created_at);

CREATE INDEX IF NOT EXISTS idx_connection_recommendations_user_id ON public.connection_recommendations (user_id);
CREATE INDEX IF NOT EXISTS idx_connection_recommendations_recommended_user_id ON public.connection_recommendations (recommended_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_recommendations_organization_id ON public.connection_recommendations (organization_id);
CREATE INDEX IF NOT EXISTS idx_connection_recommendations_confidence_score ON public.connection_recommendations (confidence_score);
CREATE INDEX IF NOT EXISTS idx_connection_recommendations_created_at ON public.connection_recommendations (created_at);

-- Function to automatically set organization context
CREATE OR REPLACE FUNCTION public.set_network_connection_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to find common organization between users
  IF NEW.organization_id IS NULL THEN
    SELECT om1.organization_id INTO NEW.organization_id
    FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = NEW.user_a 
      AND om2.user_id = NEW.user_b
      AND om1.is_active = true
      AND om2.is_active = true
    LIMIT 1;
  END IF;
  
  -- Set member IDs if organization is found
  IF NEW.organization_id IS NOT NULL THEN
    -- Set requester member ID
    SELECT id INTO NEW.requester_member_id
    FROM public.organization_members
    WHERE user_id = NEW.requester_id 
      AND organization_id = NEW.organization_id
      AND is_active = true
    LIMIT 1;
    
    -- Set receiver member ID
    SELECT id INTO NEW.receiver_member_id
    FROM public.organization_members
    WHERE user_id = NEW.receiver_id 
      AND organization_id = NEW.organization_id
      AND is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_network_connection_organization_trigger
  BEFORE INSERT ON public.network_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_network_connection_organization();

-- Function to handle connection acceptance
CREATE OR REPLACE FUNCTION public.accept_connection_request(
  p_connection_id uuid,
  p_receiver_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.network_connections
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_connection_id
    AND receiver_id = COALESCE(p_receiver_id, auth.uid())
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

-- Function to reject connection request
CREATE OR REPLACE FUNCTION public.reject_connection_request(
  p_connection_id uuid,
  p_receiver_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.network_connections
  SET 
    status = 'rejected',
    rejected_at = NOW(),
    updated_at = NOW()
  WHERE id = p_connection_id
    AND receiver_id = COALESCE(p_receiver_id, auth.uid())
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

-- Function to block a connection
CREATE OR REPLACE FUNCTION public.block_connection(
  p_connection_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.network_connections
  SET 
    status = 'blocked',
    blocked_at = NOW(),
    updated_at = NOW()
  WHERE id = p_connection_id
    AND (user_a = COALESCE(p_user_id, auth.uid()) OR user_b = COALESCE(p_user_id, auth.uid()));
  
  RETURN FOUND;
END;
$$;

-- Function to get mutual connections count
CREATE OR REPLACE FUNCTION public.get_mutual_connections_count(
  p_user_a uuid,
  p_user_b uuid
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  mutual_count integer;
BEGIN
  SELECT COUNT(*) INTO mutual_count
  FROM (
    -- Connections of user_a
    SELECT 
      CASE WHEN user_a = p_user_a THEN user_b ELSE user_a END as connected_user
    FROM public.network_connections
    WHERE (user_a = p_user_a OR user_b = p_user_a)
      AND status = 'accepted'
  ) AS user_a_connections
  JOIN (
    -- Connections of user_b
    SELECT 
      CASE WHEN user_a = p_user_b THEN user_b ELSE user_a END as connected_user
    FROM public.network_connections
    WHERE (user_a = p_user_b OR user_b = p_user_b)
      AND status = 'accepted'
  ) AS user_b_connections
  ON user_a_connections.connected_user = user_b_connections.connected_user;
  
  RETURN COALESCE(mutual_count, 0);
END;
$$;

-- Function to get connection suggestions
CREATE OR REPLACE FUNCTION public.get_connection_suggestions(
  p_user_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  suggested_user_id uuid,
  full_name text,
  avatar_url text,
  headline text,
  mutual_connections_count integer,
  shared_interests text[],
  confidence_score decimal
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as suggested_user_id,
    p.full_name,
    p.avatar_url,
    p.headline,
    public.get_mutual_connections_count(p_user_id, p.id) as mutual_connections_count,
    (
      SELECT ARRAY_AGG(DISTINCT interest)
      FROM (
        SELECT UNNEST(p1.skills->'interests') as interest
        FROM public.profiles p1
        WHERE p1.id = p_user_id
        UNION
        SELECT UNNEST(p2.skills->'interests') as interest
        FROM public.profiles p2
        WHERE p2.id = p.id
      ) AS shared
    ) as shared_interests,
    RANDOM() as confidence_score -- Simplified, would be more complex in reality
  FROM public.profiles p
  WHERE p.id != p_user_id
    AND p.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.network_connections nc
      WHERE (nc.user_a = p_user_id AND nc.user_b = p.id)
         OR (nc.user_a = p.id AND nc.user_b = p_user_id)
    )
  ORDER BY 
    public.get_mutual_connections_count(p_user_id, p.id) DESC,
    confidence_score DESC
  LIMIT p_limit;
END;
$$;

-- View for enhanced connection details
CREATE OR REPLACE VIEW public.connection_details AS
SELECT 
  nc.*,
  ua.full_name as user_a_name,
  ua.avatar_url as user_a_avatar,
  ua.headline as user_a_headline,
  ub.full_name as user_b_name,
  ub.avatar_url as user_b_avatar,
  ub.headline as user_b_headline,
  requester.full_name as requester_name,
  requester.avatar_url as requester_avatar,
  receiver.full_name as receiver_name,
  receiver.avatar_url as receiver_avatar,
  org.name as organization_name,
  public.get_mutual_connections_count(nc.user_a, nc.user_b) as mutual_connections_count
FROM public.network_connections nc
JOIN public.profiles ua ON nc.user_a = ua.id
JOIN public.profiles ub ON nc.user_b = ub.id
JOIN public.profiles requester ON nc.requester_id = requester.id
JOIN public.profiles receiver ON nc.receiver_id = receiver.id
LEFT JOIN public.organizations org ON nc.organization_id = org.id;

-- View for recommendation details
CREATE OR REPLACE VIEW public.recommendation_details AS
SELECT 
  cr.*,
  u.full_name as user_name,
  u.avatar_url as user_avatar,
  ru.full_name as recommended_user_name,
  ru.avatar_url as recommended_user_avatar,
  ru.headline as recommended_user_headline,
  org.name as organization_name,
  public.get_mutual_connections_count(cr.user_id, cr.recommended_user_id) as mutual_connections_count
FROM public.connection_recommendations cr
JOIN public.profiles u ON cr.user_id = u.id
JOIN public.profiles ru ON cr.recommended_user_id = ru.id
LEFT JOIN public.organizations org ON cr.organization_id = org.id;