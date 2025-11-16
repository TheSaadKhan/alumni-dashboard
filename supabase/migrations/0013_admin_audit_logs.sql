-- 0013_admin_audit_logs.sql
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  admin_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Enhanced action tracking
  action text NOT NULL, -- create, update, delete, login, logout, export, import
  action_category text DEFAULT 'general', -- user_management, content, security, system, billing
  action_severity text DEFAULT 'info', -- info, low, medium, high, critical
  
  -- NEW: Resource tracking
  resource_type text, -- user, organization, event, job, donation, story
  resource_id uuid,
  resource_name text, -- Human-readable resource name
  
  -- NEW: Change tracking
  before_snapshot jsonb,
  after_snapshot jsonb,
  changed_fields text[], -- Specific fields that were modified
  change_summary text, -- Human-readable summary of changes
  
  -- NEW: Request context
  request_id text, -- Unique ID for tracking related actions
  session_id uuid REFERENCES public.user_sessions(id) ON DELETE SET NULL,
  
  -- NEW: Location and device info
  ip_address inet,
  user_agent text,
  country_code char(2),
  region text,
  city text,
  
  -- NEW: Authentication context
  authentication_method text, -- password, oauth, api_key, sso
  authentication_provider text, -- google, github, linkedin, internal
  
  -- NEW: Performance and status
  processing_time_ms integer CHECK (processing_time_ms >= 0),
  status text DEFAULT 'success', -- success, failure, partial
  error_message text,
  error_stack text,
  
  -- NEW: Compliance and retention
  retention_period_days integer DEFAULT 365,
  is_sensitive boolean DEFAULT false, -- Marks logs containing sensitive data
  is_archived boolean DEFAULT false,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Audit log configurations table
CREATE TABLE IF NOT EXISTS public.audit_log_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Configuration settings
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  
  -- NEW: Logging rules
  rules jsonb DEFAULT '{
    "enabled_categories": ["user_management", "security", "system"],
    "minimum_severity": "low",
    "log_successful_actions": true,
    "log_failed_actions": true,
    "log_sensitive_operations": true,
    "log_read_operations": false
  }'::jsonb,
  
  -- NEW: Retention policies
  retention_policies jsonb DEFAULT '{
    "general_logs": 365,
    "sensitive_logs": 730,
    "security_logs": 1825,
    "compliance_logs": 2555
  }'::jsonb,
  
  -- NEW: Alerting rules
  alert_rules jsonb DEFAULT '{
    "failed_logins_threshold": 5,
    "sensitive_operations": true,
    "high_severity_actions": true,
    "unusual_activity": true
  }'::jsonb,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id, name)
);

-- Audit log alerts table
CREATE TABLE IF NOT EXISTS public.audit_log_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  triggered_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Alert details
  alert_type text NOT NULL, -- failed_login, sensitive_operation, unusual_activity, compliance_violation
  alert_severity text DEFAULT 'medium', -- low, medium, high, critical
  title text NOT NULL,
  description text,
  
  -- NEW: Trigger conditions
  trigger_conditions jsonb DEFAULT '{}'::jsonb,
  matched_logs jsonb DEFAULT '[]'::jsonb, -- Array of log IDs that triggered this alert
  
  -- NEW: Alert status
  status text DEFAULT 'active', -- active, acknowledged, resolved, dismissed
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES public.profiles(id),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.profiles(id),
  
  -- NEW: Notification settings
  notification_sent boolean DEFAULT false,
  notification_sent_at timestamptz,
  notification_methods text[] DEFAULT '{"in_app"}', -- in_app, email, sms, webhook
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit log exports table
CREATE TABLE IF NOT EXISTS public.audit_log_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Export details
  export_type text NOT NULL, -- full, security, compliance, custom
  format text DEFAULT 'json', -- json, csv, pdf
  status text DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- NEW: Export criteria
  date_range jsonb DEFAULT '{}'::jsonb, -- {start: timestamp, end: timestamp}
  filters jsonb DEFAULT '{}'::jsonb, -- {categories: [], severities: [], actions: []}
  
  -- NEW: File information
  file_url text,
  file_size_bytes bigint,
  file_checksum text,
  download_count integer DEFAULT 0 CHECK (download_count >= 0),
  
  -- NEW: Security and access
  access_token text UNIQUE, -- For secure download links
  is_encrypted boolean DEFAULT true,
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  
  -- NEW: Processing details
  total_records integer DEFAULT 0 CHECK (total_records >= 0),
  processed_records integer DEFAULT 0 CHECK (processed_records >= 0),
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  error_message text,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);