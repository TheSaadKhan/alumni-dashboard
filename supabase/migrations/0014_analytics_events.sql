-- 0014_analytics_events.sql
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Enhanced event tracking
  event_type text NOT NULL, -- page_view, user_signup, content_view, donation, connection, job_application
  event_category text DEFAULT 'general', -- user_behavior, system, security, business, performance
  event_source text DEFAULT 'web', -- web, mobile, api, background_job
  
  -- NEW: Session and request context
  session_id uuid REFERENCES public.user_sessions(id) ON DELETE SET NULL,
  request_id text,
  trace_id text, -- For distributed tracing
  
  -- NEW: Location and device info
  ip_address inet,
  user_agent text,
  device_type text, -- desktop, mobile, tablet
  browser_family text,
  browser_version text,
  os_family text,
  os_version text,
  
  -- NEW: Geographic data
  country_code char(2),
  region text,
  city text,
  timezone text,
  
  -- NEW: Page and navigation context
  page_url text,
  page_title text,
  page_referrer text,
  page_path text,
  utm_parameters jsonb DEFAULT '{}'::jsonb, -- UTM tracking parameters
  
  -- NEW: Event properties and metrics
  event_props jsonb DEFAULT '{}'::jsonb,
  event_metrics jsonb DEFAULT '{}'::jsonb, -- {duration: 1500, value: 99.99, count: 5}
  
  -- NEW: Performance data
  load_time_ms integer CHECK (load_time_ms >= 0),
  processing_time_ms integer CHECK (processing_time_ms >= 0),
  
  -- NEW: Status and validation
  is_processed boolean DEFAULT false,
  processed_at timestamptz,
  is_valid boolean DEFAULT true,
  validation_errors text[],
  
  -- NEW: Privacy and compliance
  is_anonymized boolean DEFAULT false,
  data_retention_days integer DEFAULT 365,
  gdpr_compliant boolean DEFAULT true,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Analytics sessions table
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Session details
  session_token text NOT NULL UNIQUE,
  device_id text, -- For anonymous users
  session_started_at timestamptz NOT NULL DEFAULT now(),
  session_ended_at timestamptz,
  last_activity_at timestamptz DEFAULT now(),
  
  -- NEW: Session properties
  session_props jsonb DEFAULT '{
    "is_first_visit": true,
    "is_returning_user": false,
    "entry_page": "/",
    "exit_page": "/"
  }'::jsonb,
  
  -- NEW: Technical context
  user_agent text,
  ip_address inet,
  screen_resolution text, -- "1920x1080"
  viewport_size text, -- "1200x800"
  language_code text DEFAULT 'en',
  
  -- NEW: Engagement metrics
  page_views integer DEFAULT 1 CHECK (page_views >= 0),
  events_count integer DEFAULT 1 CHECK (events_count >= 0),
  session_duration_seconds integer CHECK (session_duration_seconds >= 0),
  
  -- NEW: Geographic data
  country_code char(2),
  region text,
  city text,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Analytics funnels table
CREATE TABLE IF NOT EXISTS public.analytics_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Funnel configuration
  name text NOT NULL,
  description text,
  steps jsonb NOT NULL, -- Array of funnel steps with event criteria
  is_active boolean DEFAULT true,
  
  -- NEW: Funnel settings
  conversion_window_days integer DEFAULT 30 CHECK (conversion_window_days > 0),
  require_sequence boolean DEFAULT true, -- Whether steps must occur in order
  audience_filters jsonb DEFAULT '{}'::jsonb, -- User segment filters
  
  -- NEW: Performance tracking
  total_conversions integer DEFAULT 0 CHECK (total_conversions >= 0),
  conversion_rate decimal CHECK (conversion_rate >= 0 AND conversion_rate <= 100),
  average_conversion_time_days decimal CHECK (average_conversion_time_days >= 0),
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Analytics metrics table
CREATE TABLE IF NOT EXISTS public.analytics_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organytics(id) ON DELETE CASCADE,
  
  -- NEW: Metric definition
  metric_name text NOT NULL,
  metric_type text NOT NULL, -- count, sum, average, unique, rate
  metric_category text DEFAULT 'general', -- user, revenue, engagement, performance
  description text,
  
  -- NEW: Calculation settings
  calculation_query text, -- SQL or definition for metric calculation
  aggregation_period text DEFAULT 'daily', -- hourly, daily, weekly, monthly
  dimensions text[] DEFAULT '{}', -- Breakdown dimensions
  
  -- NEW: Target and goals
  target_value numeric,
  target_direction text, -- increase, decrease, maintain
  is_business_critical boolean DEFAULT false,
  
  -- NEW: Status
  is_active boolean DEFAULT true,
  last_calculated_at timestamptz,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id, metric_name)
);

-- Analytics metric values table
CREATE TABLE IF NOT EXISTS public.analytics_metric_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id uuid NOT NULL REFERENCES public.analytics_metrics(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- NEW: Metric value
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  metric_value numeric NOT NULL,
  
  -- NEW: Dimensions breakdown
  dimension_filters jsonb DEFAULT '{}'::jsonb, -- {country: "US", device_type: "mobile"}
  
  -- NEW: Change tracking
  previous_value numeric,
  value_change numeric,
  percent_change decimal,
  
  -- NEW: Confidence and quality
  confidence_interval jsonb, -- {lower: 95, upper: 105}
  data_quality_score decimal CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(metric_id, period_start, dimension_filters)
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metric_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Analytics Events
CREATE POLICY "Organization members can view their org analytics" ON public.analytics_events
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

CREATE POLICY "System can create analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true); -- Managed by backend/service role

-- RLS Policies for Analytics Sessions
CREATE POLICY "Organization members can view their org sessions" ON public.analytics_sessions
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

-- RLS Policies for Analytics Funnels
CREATE POLICY "Organization members can view funnels in their org" ON public.analytics_funnels
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Organization admins can manage funnels" ON public.analytics_funnels
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_analytics' = 'true'
      )
    )
  );

-- RLS Policies for Analytics Metrics
CREATE POLICY "Organization members can view metrics in their org" ON public.analytics_metrics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Organization admins can manage metrics" ON public.analytics_metrics
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_analytics' = 'true'
      )
    )
  );

-- RLS Policies for Analytics Metric Values
CREATE POLICY "Organization members can view metric values" ON public.analytics_metric_values
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

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_analytics_sessions_updated_at
  BEFORE UPDATE ON public.analytics_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_analytics_funnels_updated_at
  BEFORE UPDATE ON public.analytics_funnels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_analytics_metrics_updated_at
  BEFORE UPDATE ON public.analytics_metrics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_organization_id ON public.analytics_events (organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_actor_id ON public.analytics_events (actor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_category ON public.analytics_events (event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_country_code ON public.analytics_events (country_code);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_path ON public.analytics_events (page_path);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_organization_id ON public.analytics_sessions (organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON public.analytics_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_token ON public.analytics_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_started_at ON public.analytics_sessions (session_started_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_country_code ON public.analytics_sessions (country_code);

CREATE INDEX IF NOT EXISTS idx_analytics_funnels_organization_id ON public.analytics_funnels (organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_is_active ON public.analytics_funnels (is_active);

CREATE INDEX IF NOT EXISTS idx_analytics_metrics_organization_id ON public.analytics_metrics (organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_metric_name ON public.analytics_metrics (metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_is_active ON public.analytics_metrics (is_active);

CREATE INDEX IF NOT EXISTS idx_analytics_metric_values_metric_id ON public.analytics_metric_values (metric_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_values_organization_id ON public.analytics_metric_values (organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_values_period_start ON public.analytics_metric_values (period_start);

-- Function to automatically set organization context
CREATE OR REPLACE FUNCTION public.set_analytics_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from actor's primary organization if not provided
  IF NEW.organization_id IS NULL AND NEW.actor_id IS NOT NULL THEN
    SELECT primary_organization_id INTO NEW.organization_id
    FROM public.profiles
    WHERE id = NEW.actor_id;
  END IF;
  
  -- Set actor_member_id if organization is found
  IF NEW.organization_id IS NOT NULL AND NEW.actor_id IS NOT NULL THEN
    SELECT om.id INTO NEW.actor_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.actor_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Extract device and browser information from user_agent
  IF NEW.user_agent IS NOT NULL THEN
    -- Simplified parsing - in production, use a proper user agent parser
    IF NEW.user_agent ILIKE '%mobile%' THEN
      NEW.device_type := 'mobile';
    ELSIF NEW.user_agent ILIKE '%tablet%' THEN
      NEW.device_type := 'tablet';
    ELSE
      NEW.device_type := 'desktop';
    END IF;
    
    -- Extract browser family (simplified)
    CASE 
      WHEN NEW.user_agent ILIKE '%chrome%' THEN NEW.browser_family := 'chrome';
      WHEN NEW.user_agent ILIKE '%firefox%' THEN NEW.browser_family := 'firefox';
      WHEN NEW.user_agent ILIKE '%safari%' THEN NEW.browser_family := 'safari';
      WHEN NEW.user_agent ILIKE '%edge%' THEN NEW.browser_family := 'edge';
      ELSE NEW.browser_family := 'other';
    END CASE;
    
    -- Extract OS family (simplified)
    CASE 
      WHEN NEW.user_agent ILIKE '%windows%' THEN NEW.os_family := 'windows';
      WHEN NEW.user_agent ILIKE '%mac os%' THEN NEW.os_family := 'macos';
      WHEN NEW.user_agent ILIKE '%linux%' THEN NEW.os_family := 'linux';
      WHEN NEW.user_agent ILIKE '%android%' THEN NEW.os_family := 'android';
      WHEN NEW.user_agent ILIKE '%iphone%' OR NEW.user_agent ILIKE '%ipad%' THEN NEW.os_family := 'ios';
      ELSE NEW.os_family := 'other';
    END CASE;
  END IF;
  
  -- Set country code from IP address (simplified)
  IF NEW.ip_address IS NOT NULL AND NEW.country_code IS NULL THEN
    NEW.country_code := 'US'; -- Default value, implement proper GeoIP in app
  END IF;
  
  -- Generate session_id if not provided for page views
  IF NEW.session_id IS NULL AND NEW.event_type = 'page_view' THEN
    NEW.session_id := gen_random_uuid();
  END IF;
  
  -- Generate request_id if not provided
  IF NEW.request_id IS NULL THEN
    NEW.request_id := encode(gen_random_bytes(16), 'hex');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_analytics_organization_trigger
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.set_analytics_organization();

-- Function to create or update analytics session
CREATE OR REPLACE FUNCTION public.update_analytics_session(
  p_session_token text,
  p_user_id uuid DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_session_id uuid;
  v_user_member_id uuid;
  v_organization_id uuid;
BEGIN
  -- Determine organization context
  IF p_organization_id IS NULL AND p_user_id IS NOT NULL THEN
    SELECT primary_organization_id INTO v_organization_id
    FROM public.profiles
    WHERE id = p_user_id;
  ELSE
    v_organization_id := p_organization_id;
  END IF;
  
  -- Get user member ID
  IF v_organization_id IS NOT NULL AND p_user_id IS NOT NULL THEN
    SELECT om.id INTO v_user_member_id
    FROM public.organization_members om
    WHERE om.user_id = p_user_id 
      AND om.organization_id = v_organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Try to update existing session
  UPDATE public.analytics_sessions
  SET 
    last_activity_at = NOW(),
    page_views = page_views + 1,
    session_props = jsonb_set(
      COALESCE(session_props, '{}'::jsonb),
      '{exit_page}',
      to_jsonb(p_page_url)
    ),
    updated_at = NOW()
  WHERE session_token = p_session_token
    AND session_ended_at IS NULL
  RETURNING id INTO v_session_id;
  
  -- Create new session if not found
  IF NOT FOUND THEN
    INSERT INTO public.analytics_sessions (
      session_token,
      user_id,
      organization_id,
      user_member_id,
      user_agent,
      ip_address,
      session_props
    ) VALUES (
      p_session_token,
      p_user_id,
      v_organization_id,
      v_user_member_id,
      p_user_agent,
      p_ip_address,
      jsonb_set(
        '{"is_first_visit": true, "is_returning_user": false}'::jsonb,
        '{entry_page,exit_page}',
        to_jsonb(p_page_url)
      )
    ) RETURNING id INTO v_session_id;
  END IF;
  
  RETURN v_session_id;
END;
$$;

-- Function to calculate funnel conversion rates
CREATE OR REPLACE FUNCTION public.calculate_funnel_conversion(
  p_funnel_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  step_number integer,
  step_name text,
  user_count bigint,
  conversion_rate decimal,
  drop_off_rate decimal
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_funnel_record RECORD;
  v_steps jsonb;
  v_total_users bigint;
BEGIN
  -- Get funnel configuration
  SELECT * INTO v_funnel_record
  FROM public.analytics_funnels
  WHERE id = p_funnel_id;
  
  v_steps := v_funnel_record.steps;
  v_total_users := 0;
  
  -- For each step in the funnel, calculate conversion metrics
  FOR i IN 0..jsonb_array_length(v_steps) - 1 LOOP
    RETURN QUERY
    WITH step_users AS (
      SELECT DISTINCT actor_id
      FROM public.analytics_events
      WHERE event_type = (v_steps->i->>'event_type')::text
        AND organization_id = v_funnel_record.organization_id
        AND (p_start_date IS NULL OR created_at >= p_start_date)
        AND (p_end_date IS NULL OR created_at <= p_end_date)
        AND (v_steps->i->>'event_props' IS NULL OR 
             event_props @> (v_steps->i->>'event_props')::jsonb)
    )
    SELECT 
      (i + 1) as step_number,
      (v_steps->i->>'name')::text as step_name,
      COUNT(*) as user_count,
      CASE 
        WHEN i = 0 THEN 100.0
        ELSE (COUNT(*)::decimal / v_total_users::decimal) * 100
      END as conversion_rate,
      CASE 
        WHEN i = 0 THEN 0.0
        ELSE 100 - (COUNT(*)::decimal / v_total_users::decimal) * 100
      END as drop_off_rate
    FROM step_users;
    
    -- Store user count for next iteration
    SELECT COUNT(*) INTO v_total_users
    FROM (
      SELECT DISTINCT actor_id
      FROM public.analytics_events
      WHERE event_type = (v_steps->i->>'event_type')::text
        AND organization_id = v_funnel_record.organization_id
        AND (p_start_date IS NULL OR created_at >= p_start_date)
        AND (p_end_date IS NULL OR created_at <= p_end_date)
        AND (v_steps->i->>'event_props' IS NULL OR 
             event_props @> (v_steps->i->>'event_props')::jsonb)
    ) AS current_step;
  END LOOP;
END;
$$;

-- Function to cleanup old analytics data
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_data()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_events integer;
  deleted_sessions integer;
  retention_days integer := 365;
BEGIN
  -- Delete old events
  WITH deleted_events AS (
    DELETE FROM public.analytics_events
    WHERE created_at < NOW() - (retention_days || ' days')::interval
      AND is_processed = true
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_events FROM deleted_events;
  
  -- Delete old sessions
  WITH deleted_sessions AS (
    DELETE FROM public.analytics_sessions
    WHERE session_started_at < NOW() - (retention_days || ' days')::interval
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_sessions FROM deleted_sessions;
  
  RETURN deleted_events + deleted_sessions;
END;
$$;

-- Function to get organization analytics summary
CREATE OR REPLACE FUNCTION public.get_organization_analytics_summary(
  p_organization_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_events bigint,
  total_sessions bigint,
  unique_users bigint,
  average_session_duration decimal,
  most_popular_event_type text,
  top_country text,
  event_type_breakdown jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(DISTINCT actor_id) as unique_users,
    AVG(load_time_ms) as average_session_duration,
    MODE() WITHIN GROUP (ORDER BY event_type) as most_popular_event_type,
    MODE() WITHIN GROUP (ORDER BY country_code) as top_country,
    (
      SELECT jsonb_object_agg(event_type, event_count)
      FROM (
        SELECT event_type, COUNT(*) as event_count
        FROM public.analytics_events
        WHERE organization_id = p_organization_id
          AND (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY event_type
        ORDER BY event_count DESC
        LIMIT 10
      ) AS event_breakdown
    ) as event_type_breakdown
  FROM public.analytics_events
  WHERE organization_id = p_organization_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;

-- View for enhanced analytics event details
CREATE OR REPLACE VIEW public.analytics_event_details AS
SELECT 
  ae.*,
  p.full_name as actor_name,
  p.email as actor_email,
  org.name as organization_name,
  am.title as actor_title,
  am.department as actor_department,
  s.session_token
FROM public.analytics_events ae
LEFT JOIN public.profiles p ON ae.actor_id = p.id
LEFT JOIN public.organizations org ON ae.organization_id = org.id
LEFT JOIN public.organization_members am ON ae.actor_member_id = am.id
LEFT JOIN public.analytics_sessions s ON ae.session_id = s.id;

-- View for session analytics
CREATE OR REPLACE VIEW public.analytics_session_details AS
SELECT 
  s.*,
  p.full_name as user_name,
  p.email as user_email,
  org.name as organization_name,
  um.title as user_title,
  um.department as user_department,
  COUNT(e.id) as total_events,
  MAX(e.created_at) as last_event_at
FROM public.analytics_sessions s
LEFT JOIN public.profiles p ON s.user_id = p.id
LEFT JOIN public.organizations org ON s.organization_id = org.id
LEFT JOIN public.organization_members um ON s.user_member_id = um.id
LEFT JOIN public.analytics_events e ON s.id = e.session_id
GROUP BY s.id, p.id, org.id, um.id;

-- Create default metrics for organizations
CREATE OR REPLACE FUNCTION public.create_default_analytics_metrics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create default business metrics
  INSERT INTO public.analytics_metrics (
    organization_id,
    metric_name,
    metric_type,
    metric_category,
    description,
    calculation_query
  ) VALUES 
  (
    NEW.id,
    'daily_active_users',
    'unique',
    'user',
    'Number of unique users with activity per day',
    'SELECT COUNT(DISTINCT actor_id) FROM analytics_events WHERE organization_id = {{organization_id}} AND DATE(created_at) = CURRENT_DATE'
  ),
  (
    NEW.id,
    'user_registrations',
    'count',
    'user',
    'Total number of user registrations',
    'SELECT COUNT(*) FROM profiles WHERE primary_organization_id = {{organization_id}} AND DATE(created_at) = CURRENT_DATE'
  ),
  (
    NEW.id,
    'donation_conversion_rate',
    'rate',
    'revenue',
    'Percentage of visitors who make a donation',
    'SELECT (COUNT(DISTINCT CASE WHEN event_type = ''donation'' THEN actor_id END)::decimal / COUNT(DISTINCT actor_id)::decimal) * 100 FROM analytics_events WHERE organization_id = {{organization_id}} AND DATE(created_at) = CURRENT_DATE'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_default_analytics_metrics_trigger
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.create_default_analytics_metrics();