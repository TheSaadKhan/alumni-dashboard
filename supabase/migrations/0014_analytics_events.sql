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
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
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