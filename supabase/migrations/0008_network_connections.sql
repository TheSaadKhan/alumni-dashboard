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