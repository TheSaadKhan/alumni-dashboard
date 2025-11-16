-- Materialized view for dashboard analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_dashboard_stats AS
SELECT 
  organization_id,
  DATE(created_at) as event_date,
  COUNT(*) as total_events,
  COUNT(DISTINCT actor_id) as unique_users,
  COUNT(DISTINCT session_id) as total_sessions,
  AVG(load_time_ms) as avg_load_time,
  MODE() WITHIN GROUP (ORDER BY event_type) as most_popular_event,
  COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
  COUNT(*) FILTER (WHERE event_type = 'user_signup') as user_signups,
  COUNT(*) FILTER (WHERE event_type = 'donation') as donations,
  COUNT(*) FILTER (WHERE event_type = 'job_application') as job_applications,
  COUNT(*) FILTER (WHERE event_type = 'content_view') as content_views,
  COUNT(*) FILTER (WHERE event_type = 'event_registration') as event_registrations,
  COUNT(*) FILTER (WHERE event_type = 'connection_request') as connection_requests
FROM public.analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY organization_id, DATE(created_at)
WITH DATA;

-- Indexes for materialized view performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_stats_org_date 
ON public.mv_dashboard_stats (organization_id, event_date);

CREATE INDEX IF NOT EXISTS idx_mv_dashboard_stats_date 
ON public.mv_dashboard_stats (event_date);

CREATE INDEX IF NOT EXISTS idx_mv_dashboard_stats_org 
ON public.mv_dashboard_stats (organization_id);

-- Function to refresh dashboard stats
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_dashboard_stats;
END;
$$;

-- Function to get organization dashboard summary
CREATE OR REPLACE FUNCTION public.get_organization_dashboard_summary(
  p_organization_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE(
  total_events bigint,
  unique_users bigint,
  total_sessions bigint,
  avg_load_time decimal,
  most_popular_event text,
  total_page_views bigint,
  total_signups bigint,
  total_donations bigint,
  total_job_applications bigint,
  total_content_views bigint,
  total_event_registrations bigint,
  total_connection_requests bigint,
  daily_average_events decimal,
  user_engagement_rate decimal
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(total_events) as total_events,
    COUNT(DISTINCT actor_id) as unique_users, -- This would need to be calculated differently
    SUM(total_sessions) as total_sessions,
    AVG(avg_load_time) as avg_load_time,
    MODE() WITHIN GROUP (ORDER BY most_popular_event) as most_popular_event,
    SUM(page_views) as total_page_views,
    SUM(user_signups) as total_signups,
    SUM(donations) as total_donations,
    SUM(job_applications) as total_job_applications,
    SUM(content_views) as total_content_views,
    SUM(event_registrations) as total_event_registrations,
    SUM(connection_requests) as total_connection_requests,
    AVG(total_events) as daily_average_events,
    CASE 
      WHEN SUM(total_sessions) > 0 THEN 
        (SUM(total_events)::decimal / SUM(total_sessions)::decimal) * 100 
      ELSE 0 
    END as user_engagement_rate
  FROM public.mv_dashboard_stats
  WHERE organization_id = p_organization_id
    AND event_date >= CURRENT_DATE - (p_days || ' days')::interval;
END;
$$;

-- Function to get daily trends
CREATE OR REPLACE FUNCTION public.get_daily_analytics_trends(
  p_organization_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE(
  event_date date,
  total_events bigint,
  unique_users bigint,
  total_sessions bigint,
  page_views bigint,
  user_signups bigint,
  donations bigint,
  job_applications bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    event_date,
    total_events,
    unique_users,
    total_sessions,
    page_views,
    user_signups,
    donations,
    job_applications
  FROM public.mv_dashboard_stats
  WHERE organization_id = p_organization_id
    AND event_date >= CURRENT_DATE - (p_days || ' days')::interval
  ORDER BY event_date DESC;
END;
$$;

-- Function to get top events by organization
CREATE OR REPLACE FUNCTION public.get_top_events_by_organization(
  p_organization_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  event_type text,
  event_count bigint,
  percentage_of_total decimal
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_events bigint;
BEGIN
  -- Get total events for percentage calculation
  SELECT COALESCE(SUM(total_events), 0) INTO v_total_events
  FROM public.mv_dashboard_stats
  WHERE organization_id = p_organization_id
    AND event_date >= CURRENT_DATE - INTERVAL '30 days';
  
  RETURN QUERY
  WITH event_breakdown AS (
    SELECT 
      most_popular_event as event_type,
      SUM(total_events) as event_count
    FROM public.mv_dashboard_stats
    WHERE organization_id = p_organization_id
      AND event_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY most_popular_event
  )
  SELECT 
    event_type,
    event_count,
    CASE 
      WHEN v_total_events > 0 THEN 
        ROUND((event_count::decimal / v_total_events::decimal) * 100, 2)
      ELSE 0 
    END as percentage_of_total
  FROM event_breakdown
  ORDER BY event_count DESC
  LIMIT p_limit;
END;
$$;

-- Function to check when materialized view was last refreshed
CREATE OR REPLACE FUNCTION public.get_mv_refresh_info()
RETURNS TABLE(
  view_name text,
  last_refresh timestamptz,
  size text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    matviewname::text as view_name,
    last_refresh,
    pg_size_pretty(pg_total_relation_size('public.' || matviewname)) as size
  FROM pg_catalog.pg_matviews 
  WHERE schemaname = 'public' 
    AND matviewname = 'mv_dashboard_stats';
END;
$$;

-- Function to automatically refresh stats during off-peak hours
CREATE OR REPLACE FUNCTION public.auto_refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_hour integer;
  v_last_refresh timestamptz;
BEGIN
  -- Get current hour
  v_current_hour := EXTRACT(HOUR FROM CURRENT_TIME);
  
  -- Check if it's off-peak hours (2 AM to 4 AM)
  IF v_current_hour BETWEEN 2 AND 4 THEN
    -- Get last refresh time
    SELECT last_refresh INTO v_last_refresh
    FROM pg_catalog.pg_matviews 
    WHERE schemaname = 'public' 
      AND matviewname = 'mv_dashboard_stats';
    
    -- Refresh if never refreshed or last refresh was more than 1 hour ago
    IF v_last_refresh IS NULL OR v_last_refresh < NOW() - INTERVAL '1 hour' THEN
      PERFORM public.refresh_dashboard_stats();
      RAISE NOTICE 'Dashboard stats refreshed automatically at %', NOW();
    END IF;
  END IF;
END;
$$;