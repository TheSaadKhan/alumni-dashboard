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