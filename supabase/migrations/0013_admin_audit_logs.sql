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

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Admin Audit Logs
CREATE POLICY "Organization admins can view their org audit logs" ON public.admin_audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'view_audit_logs' = 'true'
      )
    )
  );

CREATE POLICY "System can create audit logs" ON public.admin_audit_logs
  FOR INSERT WITH CHECK (true); -- Managed by backend/service role

CREATE POLICY "Super admins can view all audit logs" ON public.admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.organization_roles oro ON om.role_id = oro.id
      WHERE om.user_id = auth.uid() 
        AND om.is_active = true
        AND oro.name = 'super_admin'
    )
  );

-- RLS Policies for Audit Log Configurations
CREATE POLICY "Organization admins can manage audit configs" ON public.audit_log_configurations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_audit_logs' = 'true'
      )
    )
  );

-- RLS Policies for Audit Log Alerts
CREATE POLICY "Organization admins can view audit alerts" ON public.audit_log_alerts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'view_audit_logs' = 'true'
      )
    )
  );

CREATE POLICY "Organization admins can manage audit alerts" ON public.audit_log_alerts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_audit_logs' = 'true'
      )
    )
  );

-- RLS Policies for Audit Log Exports
CREATE POLICY "Users can view their own audit exports" ON public.audit_log_exports
  FOR SELECT USING (
    requested_by_member_id IN (
      SELECT id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Organization admins can manage audit exports" ON public.audit_log_exports
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_audit_logs' = 'true'
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

CREATE TRIGGER handle_audit_log_configurations_updated_at
  BEFORE UPDATE ON public.audit_log_configurations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_audit_log_alerts_updated_at
  BEFORE UPDATE ON public.audit_log_alerts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_audit_log_exports_updated_at
  BEFORE UPDATE ON public.audit_log_exports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_organization_id ON public.admin_audit_logs (organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON public.admin_audit_logs (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_category ON public.admin_audit_logs (action_category);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_severity ON public.admin_audit_logs (action_severity);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_type ON public.admin_audit_logs (resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_id ON public.admin_audit_logs (resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_ip_address ON public.admin_audit_logs (ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_status ON public.admin_audit_logs (status);

CREATE INDEX IF NOT EXISTS idx_audit_log_configurations_organization_id ON public.audit_log_configurations (organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_configurations_is_active ON public.audit_log_configurations (is_active);

CREATE INDEX IF NOT EXISTS idx_audit_log_alerts_organization_id ON public.audit_log_alerts (organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_alerts_alert_type ON public.audit_log_alerts (alert_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_alerts_alert_severity ON public.audit_log_alerts (alert_severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_alerts_status ON public.audit_log_alerts (status);
CREATE INDEX IF NOT EXISTS idx_audit_log_alerts_created_at ON public.audit_log_alerts (created_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_exports_organization_id ON public.audit_log_exports (organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_status ON public.audit_log_exports (status);
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_created_at ON public.audit_log_exports (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_expires_at ON public.audit_log_exports (expires_at);

-- Function to automatically set organization context
CREATE OR REPLACE FUNCTION public.set_audit_log_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from admin_member if available
  IF NEW.organization_id IS NULL AND NEW.admin_member_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.organization_members
    WHERE id = NEW.admin_member_id;
  END IF;
  
  -- Set admin_member_id if admin_user_id is provided and organization is found
  IF NEW.admin_member_id IS NULL AND NEW.admin_user_id IS NOT NULL AND NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.admin_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.admin_user_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Set country code from IP address (simplified - in production, use a proper GeoIP service)
  IF NEW.ip_address IS NOT NULL AND NEW.country_code IS NULL THEN
    -- This is a simplified example - implement proper GeoIP lookup in application code
    NEW.country_code := 'US'; -- Default value
  END IF;
  
  -- Generate request ID if not provided
  IF NEW.request_id IS NULL THEN
    NEW.request_id := encode(gen_random_bytes(16), 'hex');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_audit_log_organization_trigger
  BEFORE INSERT ON public.admin_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_log_organization();

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_admin_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_before_snapshot jsonb DEFAULT NULL,
  p_after_snapshot jsonb DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_action_category text DEFAULT 'general',
  p_action_severity text DEFAULT 'info',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_log_id uuid;
  v_admin_member_id uuid;
  v_organization_id uuid;
BEGIN
  -- Determine organization context
  IF p_organization_id IS NULL THEN
    SELECT primary_organization_id INTO v_organization_id
    FROM public.profiles
    WHERE id = p_admin_user_id;
  ELSE
    v_organization_id := p_organization_id;
  END IF;
  
  -- Get admin member ID
  IF v_organization_id IS NOT NULL THEN
    SELECT om.id INTO v_admin_member_id
    FROM public.organization_members om
    WHERE om.user_id = p_admin_user_id 
      AND om.organization_id = v_organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Create audit log entry
  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    organization_id,
    admin_member_id,
    action,
    resource_type,
    resource_id,
    before_snapshot,
    after_snapshot,
    action_category,
    action_severity,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_user_id,
    v_organization_id,
    v_admin_member_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_before_snapshot,
    p_after_snapshot,
    p_action_category,
    p_action_severity,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  -- Check if this action should trigger an alert
  PERFORM public.check_audit_alert_conditions(v_log_id);
  
  RETURN v_log_id;
END;
$$;

-- Function to check alert conditions
CREATE OR REPLACE FUNCTION public.check_audit_alert_conditions(
  p_log_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_log_record RECORD;
  v_alert_config RECORD;
  v_should_alert boolean := false;
  v_alert_type text;
  v_alert_severity text;
  v_alert_title text;
  v_alert_description text;
BEGIN
  -- Get the log record
  SELECT * INTO v_log_record
  FROM public.admin_audit_logs
  WHERE id = p_log_id;
  
  -- Check for failed login attempts
  IF v_log_record.action = 'login' AND v_log_record.status = 'failure' THEN
    -- Count recent failed logins for this user
    IF (
      SELECT COUNT(*) 
      FROM public.admin_audit_logs 
      WHERE admin_user_id = v_log_record.admin_user_id 
        AND action = 'login' 
        AND status = 'failure'
        AND created_at >= NOW() - INTERVAL '1 hour'
    ) >= 5 THEN
      v_should_alert := true;
      v_alert_type := 'failed_login';
      v_alert_severity := 'high';
      v_alert_title := 'Multiple failed login attempts detected';
      v_alert_description := 'User ' || v_log_record.admin_user_id || ' has multiple failed login attempts in a short period.';
    END IF;
  END IF;
  
  -- Check for sensitive operations
  IF v_log_record.action_severity IN ('high', 'critical') THEN
    v_should_alert := true;
    v_alert_type := 'sensitive_operation';
    v_alert_severity := v_log_record.action_severity;
    v_alert_title := 'Sensitive operation performed';
    v_alert_description := v_log_record.action || ' operation on ' || COALESCE(v_log_record.resource_type, 'system');
  END IF;
  
  -- Create alert if conditions are met
  IF v_should_alert THEN
    INSERT INTO public.audit_log_alerts (
      organization_id,
      triggered_by_member_id,
      alert_type,
      alert_severity,
      title,
      description,
      matched_logs,
      trigger_conditions
    ) VALUES (
      v_log_record.organization_id,
      v_log_record.admin_member_id,
      v_alert_type,
      v_alert_severity,
      v_alert_title,
      v_alert_description,
      jsonb_build_array(v_log_record.id),
      jsonb_build_object(
        'action', v_log_record.action,
        'severity', v_log_record.action_severity,
        'resource_type', v_log_record.resource_type
      )
    );
  END IF;
END;
$$;

-- Function to cleanup old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
  v_retention_days integer;
BEGIN
  -- Get retention period from configuration or use default
  SELECT COALESCE(
    (SELECT (rules->>'general_logs_retention')::integer 
     FROM public.audit_log_configurations 
     WHERE is_active = true 
     LIMIT 1),
    365
  ) INTO v_retention_days;
  
  WITH deleted AS (
    DELETE FROM public.admin_audit_logs
    WHERE created_at < NOW() - (v_retention_days || ' days')::interval
      AND is_sensitive = false
      AND is_archived = false
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- Function to get audit statistics
CREATE OR REPLACE FUNCTION public.get_audit_statistics(
  p_organization_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_actions bigint,
  successful_actions bigint,
  failed_actions bigint,
  unique_admins bigint,
  top_actions jsonb,
  action_categories jsonb,
  severity_distribution jsonb
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_actions,
    COUNT(*) FILTER (WHERE status = 'success') as successful_actions,
    COUNT(*) FILTER (WHERE status = 'failure') as failed_actions,
    COUNT(DISTINCT admin_user_id) as unique_admins,
    (
      SELECT jsonb_agg(jsonb_build_object('action', action, 'count', action_count))
      FROM (
        SELECT action, COUNT(*) as action_count
        FROM public.admin_audit_logs
        WHERE organization_id = p_organization_id
          AND (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY action
        ORDER BY action_count DESC
        LIMIT 10
      ) AS top_actions
    ) as top_actions,
    (
      SELECT jsonb_object_agg(action_category, category_count)
      FROM (
        SELECT action_category, COUNT(*) as category_count
        FROM public.admin_audit_logs
        WHERE organization_id = p_organization_id
          AND (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY action_category
      ) AS categories
    ) as action_categories,
    (
      SELECT jsonb_object_agg(action_severity, severity_count)
      FROM (
        SELECT action_severity, COUNT(*) as severity_count
        FROM public.admin_audit_logs
        WHERE organization_id = p_organization_id
          AND (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY action_severity
      ) AS severities
    ) as severity_distribution
  FROM public.admin_audit_logs
  WHERE organization_id = p_organization_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;

-- View for enhanced audit log details
CREATE OR REPLACE VIEW public.audit_log_details AS
SELECT 
  al.*,
  p.full_name as admin_name,
  p.email as admin_email,
  org.name as organization_name,
  am.title as admin_title,
  am.department as admin_department,
  us.session_token as session_token
FROM public.admin_audit_logs al
LEFT JOIN public.profiles p ON al.admin_user_id = p.id
LEFT JOIN public.organizations org ON al.organization_id = org.id
LEFT JOIN public.organization_members am ON al.admin_member_id = am.id
LEFT JOIN public.user_sessions us ON al.session_id = us.id;

-- View for audit alert details
CREATE OR REPLACE VIEW public.audit_alert_details AS
SELECT 
  aa.*,
  org.name as organization_name,
  p.full_name as triggered_by_name,
  p.email as triggered_by_email,
  ack_p.full_name as acknowledged_by_name,
  res_p.full_name as resolved_by_name,
  (
    SELECT COUNT(*) 
    FROM public.admin_audit_logs 
    WHERE id = ANY(SELECT jsonb_array_elements_text(aa.matched_logs)::uuid)
  ) as matched_logs_count
FROM public.audit_log_alerts aa
JOIN public.organizations org ON aa.organization_id = org.id
LEFT JOIN public.profiles p ON aa.triggered_by_member_id = p.id
LEFT JOIN public.profiles ack_p ON aa.acknowledged_by = ack_p.id
LEFT JOIN public.profiles res_p ON aa.resolved_by = res_p.id;

-- Create default audit configuration for organizations
CREATE OR REPLACE FUNCTION public.create_default_audit_configuration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.audit_log_configurations (
    organization_id,
    created_by_member_id,
    name,
    description
  ) VALUES (
    NEW.id,
    NULL, -- Will be set by the system
    'Default Audit Configuration',
    'Automatically created audit configuration for the organization'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_default_audit_configuration_trigger
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.create_default_audit_configuration();