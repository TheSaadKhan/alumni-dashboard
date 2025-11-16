-- 0012_user_settings.sql
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Enhanced preferences structure
  preferences jsonb DEFAULT '{
    "privacy": {
      "profile_visibility": "public",
      "email_visibility": "organization_only",
      "connections_visibility": "mutual",
      "activity_visibility": "public",
      "search_visibility": true
    },
    "communication": {
      "email_frequency": "immediate",
      "push_notifications": true,
      "sms_notifications": false,
      "marketing_emails": false,
      "newsletter_subscription": true
    },
    "appearance": {
      "theme": "system",
      "language": "en",
      "timezone": "UTC",
      "date_format": "MM/DD/YYYY",
      "time_format": "12h"
    },
    "notifications": {
      "connection_requests": true,
      "messages": true,
      "event_invites": true,
      "job_alerts": true,
      "story_updates": false,
      "donation_receipts": true
    },
    "security": {
      "two_factor_auth": false,
      "login_alerts": true,
      "session_timeout": 60,
      "password_requirements": "strong"
    }
  }'::jsonb,
  
  -- NEW: Organization-specific settings
  organization_preferences jsonb DEFAULT '{}'::jsonb, -- Settings that vary by organization
  
  -- NEW: Profile customization
  profile_customization jsonb DEFAULT '{
    "banner_color": "#3B82F6",
    "accent_color": "#8B5CF6",
    "font_preference": "system",
    "layout_preference": "standard"
  }'::jsonb,
  
  -- NEW: Data and privacy
  data_privacy jsonb DEFAULT '{
    "data_sharing": "limited",
    "analytics_consent": true,
    "cookie_consent": true,
    "data_export_enabled": true,
    "account_deletion_requested": false
  }'::jsonb,
  
  -- NEW: Accessibility settings
  accessibility jsonb DEFAULT '{
    "high_contrast": false,
    "large_text": false,
    "screen_reader": false,
    "reduced_motion": false,
    "keyboard_navigation": true
  }'::jsonb,
  
  -- NEW: Beta features and experiments
  experimental_features jsonb DEFAULT '{
    "beta_program": false,
    "new_ui_components": true,
    "ai_suggestions": true,
    "advanced_analytics": false
  }'::jsonb,
  
  -- NEW: Last updated tracking
  last_accessed_at timestamptz DEFAULT now(),
  settings_version integer DEFAULT 1,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization-specific user settings table
CREATE TABLE IF NOT EXISTS public.organization_user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Organization-specific preferences
  preferences jsonb DEFAULT '{
    "visibility": {
      "show_in_directory": true,
      "show_contact_info": true,
      "show_activity": true,
      "show_connections": true
    },
    "notifications": {
      "org_announcements": true,
      "org_events": true,
      "org_jobs": true,
      "org_stories": true,
      "department_updates": true
    },
    "communication": {
      "department_channel": true,
      "project_updates": true,
      "team_meetings": true,
      "feedback_requests": true
    },
    "permissions": {
      "allow_contact": true,
      "allow_mentions": true,
      "allow_invites": true,
      "show_presence": true
    }
  }'::jsonb,
  
  -- NEW: Role-based settings
  role_settings jsonb DEFAULT '{}'::jsonb,
  
  -- NEW: Department/team settings
  department_preferences jsonb DEFAULT '{}'::jsonb,
  
  -- NEW: Organization feature flags
  feature_preferences jsonb DEFAULT '{}'::jsonb,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, organization_id)
);

-- User sessions and preferences table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Session details
  session_token text NOT NULL UNIQUE,
  device_info jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  
  -- NEW: Session preferences
  session_preferences jsonb DEFAULT '{
    "last_visited_path": "/",
    "preferred_view": "grid",
    "items_per_page": 20,
    "sort_preference": "recent",
    "filter_settings": {}
  }'::jsonb,
  
  -- NEW: Activity tracking
  last_activity_at timestamptz DEFAULT now(),
  login_at timestamptz DEFAULT now(),
  logout_at timestamptz,
  
  -- NEW: Security
  is_active boolean DEFAULT true,
  expires_at timestamptz NOT NULL,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User data export requests table
CREATE TABLE IF NOT EXISTS public.user_data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Export details
  export_type text NOT NULL, -- full, profile, activity, connections, messages
  format text DEFAULT 'json', -- json, csv, pdf
  status text DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- NEW: File information
  file_url text,
  file_size_bytes bigint,
  checksum text,
  
  -- NEW: Processing details
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  
  -- NEW: Data scope
  data_scope jsonb DEFAULT '{
    "include_profile": true,
    "include_connections": true,
    "include_messages": true,
    "include_activity": true,
    "include_preferences": true
  }'::jsonb,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for User Settings
CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view settings in their org" ON public.user_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_members' = 'true'
      )
    )
  );

-- RLS Policies for Organization User Settings
CREATE POLICY "Users can manage their org-specific settings" ON public.organization_user_settings
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Organization admins can manage org settings" ON public.organization_user_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_members' = 'true'
      )
    )
  );

-- RLS Policies for User Sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "System can create sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (true); -- Managed by authentication system

-- RLS Policies for User Data Exports
CREATE POLICY "Users can manage their own data exports" ON public.user_data_exports
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view exports in their org" ON public.user_data_exports
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_members' = 'true'
      )
    )
  );

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_organization_user_settings_updated_at
  BEFORE UPDATE ON public.organization_user_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_data_exports_updated_at
  BEFORE UPDATE ON public.user_data_exports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings (user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_organization_id ON public.user_settings (organization_id);

CREATE INDEX IF NOT EXISTS idx_org_user_settings_user_id ON public.organization_user_settings (user_id);
CREATE INDEX IF NOT EXISTS idx_org_user_settings_organization_id ON public.organization_user_settings (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_user_settings_user_member ON public.organization_user_settings (user_member_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_organization_id ON public.user_sessions (organization_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions (is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions (expires_at);

CREATE INDEX IF NOT EXISTS idx_user_data_exports_user_id ON public.user_data_exports (user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_organization_id ON public.user_data_exports (organization_id);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_status ON public.user_data_exports (status);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_requested_at ON public.user_data_exports (requested_at);

-- Function to automatically set organization context
CREATE OR REPLACE FUNCTION public.set_user_settings_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from user's primary organization if not provided
  IF NEW.organization_id IS NULL THEN
    SELECT primary_organization_id INTO NEW.organization_id
    FROM public.profiles
    WHERE id = NEW.user_id;
  END IF;
  
  -- Set user_member_id if organization is found
  IF NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.user_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.user_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_settings_organization_trigger
  BEFORE INSERT ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_user_settings_organization();

CREATE TRIGGER set_org_user_settings_organization_trigger
  BEFORE INSERT ON public.organization_user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_user_settings_organization();

CREATE TRIGGER set_user_sessions_organization_trigger
  BEFORE INSERT ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_user_settings_organization();

CREATE TRIGGER set_user_data_exports_organization_trigger
  BEFORE INSERT ON public.user_data_exports
  FOR EACH ROW EXECUTE FUNCTION public.set_user_settings_organization();

-- Function to update last accessed time
CREATE OR REPLACE FUNCTION public.update_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_last_accessed_trigger
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_last_accessed();

-- Function to get user preference with fallback
CREATE OR REPLACE FUNCTION public.get_user_preference(
  p_user_id uuid,
  p_preference_path text, -- e.g., 'privacy.profile_visibility'
  p_default_value jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_value jsonb;
  v_path_elements text[];
  v_current jsonb;
BEGIN
  -- Split the path into elements
  v_path_elements := string_to_array(p_preference_path, '.');
  
  -- Get user settings
  SELECT preferences INTO v_current
  FROM public.user_settings
  WHERE user_id = p_user_id;
  
  -- Navigate through the JSON path
  FOR i IN 1..array_length(v_path_elements, 1) LOOP
    IF v_current IS NULL THEN
      RETURN p_default_value;
    END IF;
    v_current := v_current -> v_path_elements[i];
  END LOOP;
  
  RETURN COALESCE(v_current, p_default_value);
END;
$$;

-- Function to set user preference
CREATE OR REPLACE FUNCTION public.set_user_preference(
  p_user_id uuid,
  p_preference_path text,
  p_value jsonb
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.user_settings
  SET 
    preferences = jsonb_set(
      COALESCE(preferences, '{}'::jsonb),
      ('{' || p_preference_path || '}')::text[],
      p_value,
      true
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create settings record if it doesn't exist
    INSERT INTO public.user_settings (user_id, preferences)
    VALUES (p_user_id, jsonb_build_object(p_preference_path, p_value))
    ON CONFLICT (user_id) DO UPDATE SET
      preferences = jsonb_set(
        COALESCE(user_settings.preferences, '{}'::jsonb),
        ('{' || p_preference_path || '}')::text[],
        p_value,
        true
      ),
      updated_at = NOW();
  END IF;
  
  RETURN true;
END;
$$;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.user_sessions
    WHERE expires_at < NOW()
      AND is_active = true
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- Function to cleanup expired data exports
CREATE OR REPLACE FUNCTION public.cleanup_expired_exports()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.user_data_exports
    WHERE expires_at < NOW()
      AND status = 'completed'
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- Function to create data export request
CREATE OR REPLACE FUNCTION public.create_data_export_request(
  p_user_id uuid,
  p_export_type text DEFAULT 'full',
  p_format text DEFAULT 'json',
  p_data_scope jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_export_id uuid;
  v_default_scope jsonb := '{
    "include_profile": true,
    "include_connections": true,
    "include_messages": true,
    "include_activity": true,
    "include_preferences": true
  }'::jsonb;
BEGIN
  INSERT INTO public.user_data_exports (
    user_id,
    export_type,
    format,
    data_scope,
    expires_at
  ) VALUES (
    p_user_id,
    p_export_type,
    p_format,
    COALESCE(p_data_scope, v_default_scope),
    NOW() + INTERVAL '30 days'
  ) RETURNING id INTO v_export_id;
  
  RETURN v_export_id;
END;
$$;

-- View for enhanced user settings
CREATE OR REPLACE VIEW public.user_settings_details AS
SELECT 
  us.*,
  p.full_name,
  p.email,
  p.avatar_url,
  org.name as organization_name,
  um.title as user_title,
  um.department as user_department
FROM public.user_settings us
JOIN public.profiles p ON us.user_id = p.id
LEFT JOIN public.organizations org ON us.organization_id = org.id
LEFT JOIN public.organization_members um ON us.user_member_id = um.id;

-- View for organization settings details
CREATE OR REPLACE VIEW public.organization_user_settings_details AS
SELECT 
  ous.*,
  p.full_name,
  p.email,
  org.name as organization_name,
  um.title as user_title,
  um.department as user_department
FROM public.organization_user_settings ous
JOIN public.profiles p ON ous.user_id = p.id
JOIN public.organizations org ON ous.organization_id = org.id
LEFT JOIN public.organization_members um ON ous.user_member_id = um.id;

-- View for active sessions
CREATE OR REPLACE VIEW public.active_sessions AS
SELECT 
  us.*,
  p.full_name,
  p.email,
  org.name as organization_name,
  EXTRACT(EPOCH FROM (us.expires_at - NOW())) as seconds_remaining
FROM public.user_sessions us
JOIN public.profiles p ON us.user_id = p.id
LEFT JOIN public.organizations org ON us.organization_id = org.id
WHERE us.is_active = true 
  AND us.expires_at > NOW();

-- Create default settings for existing users
CREATE OR REPLACE FUNCTION public.create_default_user_settings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, organization_id, user_member_id)
  SELECT 
    NEW.id,
    NEW.primary_organization_id,
    om.id
  FROM public.organization_members om
  WHERE om.user_id = NEW.id 
    AND om.organization_id = NEW.primary_organization_id
    AND om.is_active = true
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_default_user_settings_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_user_settings();

-- Create default organization settings when user joins org
CREATE OR REPLACE FUNCTION public.create_default_org_user_settings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.organization_user_settings (user_id, organization_id, user_member_id)
  VALUES (NEW.user_id, NEW.organization_id, NEW.id)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_default_org_user_settings_trigger
  AFTER INSERT ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.create_default_org_user_settings();