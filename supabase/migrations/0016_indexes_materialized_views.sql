-- 0016_performance_indexes.sql

-- Performance indexes for optimized queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_graduation_year ON public.profiles(graduation_year);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_primary_organization_id ON public.profiles(primary_organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Organization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at);

-- Organization members indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_organization_id ON public.organization_members(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_role_id ON public.organization_members(role_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_is_active ON public.organization_members(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_reports_to ON public.organization_members(reports_to);

-- Events indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_start_date ON public.events(starts_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_organization_id ON public.events(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_visibility ON public.events(visibility);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_created_at ON public.events(created_at);

-- Event attendees indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_attendees_attendee_id ON public.event_attendees(attendee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_attendees_status ON public.event_attendees(status);

-- Jobs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_poster_id ON public.jobs(poster_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_organization_id ON public.jobs(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_employment_type ON public.jobs(employment_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_featured ON public.jobs(featured);

-- Job applications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_applied_at ON public.job_applications(applied_at);

-- Stories indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_author_id ON public.stories(author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_status ON public.stories(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_published_at ON public.stories(published_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_organization_id ON public.stories(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_visibility ON public.stories(visibility);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_created_at ON public.stories(created_at);

-- Network connections indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_network_connections_user_a ON public.network_connections(user_a);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_network_connections_user_b ON public.network_connections(user_b);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_network_connections_requester_id ON public.network_connections(requester_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_network_connections_receiver_id ON public.network_connections(receiver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_network_connections_status ON public.network_connections(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_network_connections_organization_id ON public.network_connections(organization_id);

-- Donations indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_donor_id ON public.donations(donor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_organization_id ON public.donations(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_created_at ON public.donations(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_campaign_id ON public.donations(campaign_id);

-- Conversations and messages indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_organization_id ON public.conversations(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Notifications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_organization_id ON public.analytics_events(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_sessions_organization_id ON public.analytics_sessions(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_sessions_session_started_at ON public.analytics_sessions(session_started_at);

-- Assets indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_organization_id ON public.assets(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_profile_id ON public.assets(profile_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_visibility ON public.assets(visibility);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_created_at ON public.assets(created_at);

-- Admin audit logs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_audit_logs_organization_id ON public.admin_audit_logs(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON public.admin_audit_logs(admin_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_org_active ON public.profiles(primary_organization_id, is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_org_upcoming ON public.events(organization_id, starts_at) WHERE status = 'published' AND starts_at > NOW();
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_org_active ON public.jobs(organization_id, status) WHERE status = 'open';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_org_published ON public.stories(organization_id, published_at) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_network_org_accepted ON public.network_connections(organization_id, status) WHERE status = 'accepted';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_org_completed ON public.donations(organization_id, status) WHERE status = 'completed';

-- GIN indexes for full-text search and array operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_skills_gin ON public.profiles USING GIN (skills);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_tags_gin ON public.jobs USING GIN (tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_tags_gin ON public.stories USING GIN (tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_props_gin ON public.analytics_events USING GIN (event_props);

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_recently_active ON public.profiles(updated_at) WHERE is_active = true AND updated_at > NOW() - INTERVAL '30 days';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_recently_created ON public.events(created_at) WHERE created_at > NOW() - INTERVAL '7 days';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_recently_posted ON public.jobs(created_at) WHERE status = 'open' AND created_at > NOW() - INTERVAL '30 days';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON public.notifications(created_at) WHERE is_read = false;

-- Materialized views for dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_organization_dashboard_stats AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  COUNT(DISTINCT p.id) as total_members,
  COUNT(DISTINCT CASE WHEN p.is_active THEN p.id END) as active_members,
  COUNT(DISTINCT CASE WHEN om.role_id IN (SELECT id FROM public.organization_roles WHERE name = 'student') THEN p.id END) as student_count,
  COUNT(DISTINCT CASE WHEN om.role_id IN (SELECT id FROM public.organization_roles WHERE name = 'alumni') THEN p.id END) as alumni_count,
  COUNT(DISTINCT CASE WHEN om.role_id IN (SELECT id FROM public.organization_roles WHERE name IN ('faculty', 'staff')) THEN p.id END) as faculty_staff_count,
  COUNT(DISTINCT e.id) as total_events,
  COUNT(DISTINCT CASE WHEN e.status = 'published' AND e.starts_at > NOW() THEN e.id END) as upcoming_events,
  COUNT(DISTINCT j.id) as active_jobs,
  COUNT(DISTINCT d.id) as total_donations,
  COALESCE(SUM(CASE WHEN d.status = 'completed' THEN d.amount ELSE 0 END), 0) as total_donation_amount,
  COUNT(DISTINCT s.id) as published_stories,
  COUNT(DISTINCT nc.id) as total_connections,
  COUNT(DISTINCT ae.id) as recent_activities,
  o.created_at as organization_created_at
FROM public.organizations o
LEFT JOIN public.organization_members om ON o.id = om.organization_id AND om.is_active = true
LEFT JOIN public.profiles p ON om.user_id = p.id
LEFT JOIN public.events e ON o.id = e.organization_id
LEFT JOIN public.jobs j ON o.id = j.organization_id AND j.status = 'open'
LEFT JOIN public.donations d ON o.id = d.organization_id
LEFT JOIN public.stories s ON o.id = s.organization_id AND s.status = 'published'
LEFT JOIN public.network_connections nc ON o.id = nc.organization_id AND nc.status = 'accepted'
LEFT JOIN public.analytics_events ae ON o.id = ae.organization_id AND ae.created_at > NOW() - INTERVAL '7 days'
WHERE o.is_active = true
GROUP BY o.id, o.name, o.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_org_dashboard_stats ON public.mv_organization_dashboard_stats (organization_id);

-- Materialized view for user engagement metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_user_engagement_stats AS
SELECT 
  p.id as user_id,
  p.primary_organization_id as organization_id,
  p.full_name,
  p.email,
  COUNT(DISTINCT nc.id) as connection_count,
  COUNT(DISTINCT ea.id) as event_attendance_count,
  COUNT(DISTINCT ja.id) as job_application_count,
  COUNT(DISTINCT d.id) as donation_count,
  COUNT(DISTINCT s.id) as story_count,
  COUNT(DISTINCT m.id) as message_count,
  COUNT(DISTINCT ae.id) as activity_count,
  MAX(ea.checked_in_at) as last_event_attendance,
  MAX(ja.applied_at) as last_job_application,
  MAX(d.created_at) as last_donation,
  MAX(s.published_at) as last_story_published,
  MAX(m.created_at) as last_message_sent,
  p.created_at as member_since
FROM public.profiles p
LEFT JOIN public.network_connections nc ON (p.id = nc.user_a OR p.id = nc.user_b) AND nc.status = 'accepted'
LEFT JOIN public.event_attendees ea ON p.id = ea.attendee_id AND ea.status = 'attended'
LEFT JOIN public.job_applications ja ON p.id = ja.applicant_id
LEFT JOIN public.donations d ON p.id = d.donor_id AND d.status = 'completed'
LEFT JOIN public.stories s ON p.id = s.author_id AND s.status = 'published'
LEFT JOIN public.messages m ON p.id = m.sender_id
LEFT JOIN public.analytics_events ae ON p.id = ae.actor_id AND ae.created_at > NOW() - INTERVAL '30 days'
WHERE p.is_active = true
GROUP BY p.id, p.primary_organization_id, p.full_name, p.email, p.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_engagement_stats ON public.mv_user_engagement_stats (user_id);

-- Materialized view for platform-wide statistics (admin view)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_platform_stats AS
SELECT 
  COUNT(DISTINCT o.id) as total_organizations,
  COUNT(DISTINCT CASE WHEN o.is_active THEN o.id END) as active_organizations,
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT CASE WHEN p.is_active THEN p.id END) as active_users,
  COUNT(DISTINCT e.id) as total_events,
  COUNT(DISTINCT CASE WHEN e.status = 'published' THEN e.id END) as published_events,
  COUNT(DISTINCT j.id) as total_jobs,
  COUNT(DISTINCT CASE WHEN j.status = 'open' THEN j.id END) as open_jobs,
  COUNT(DISTINCT d.id) as total_donations,
  COALESCE(SUM(CASE WHEN d.status = 'completed' THEN d.amount ELSE 0 END), 0) as total_donation_amount,
  COUNT(DISTINCT s.id) as total_stories,
  COUNT(DISTINCT CASE WHEN s.status = 'published' THEN s.id END) as published_stories,
  COUNT(DISTINCT nc.id) as total_connections,
  COUNT(DISTINCT ae.id) as daily_activities,
  MAX(o.created_at) as newest_organization_created,
  MAX(p.created_at) as newest_user_created
FROM public.organizations o
CROSS JOIN public.profiles p
CROSS JOIN public.events e
CROSS JOIN public.jobs j
CROSS JOIN public.donations d
CROSS JOIN public.stories s
CROSS JOIN public.network_connections nc
CROSS JOIN public.analytics_events ae
WHERE ae.created_at > NOW() - INTERVAL '1 day';

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_platform_stats ON public.mv_platform_stats (total_organizations);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_organization_dashboard_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_engagement_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_platform_stats;
END;
$$;

-- Function to get organization statistics
CREATE OR REPLACE FUNCTION public.get_organization_stats(p_organization_id uuid)
RETURNS TABLE(
  total_members bigint,
  active_members bigint,
  student_count bigint,
  alumni_count bigint,
  faculty_staff_count bigint,
  total_events bigint,
  upcoming_events bigint,
  active_jobs bigint,
  total_donations bigint,
  total_donation_amount numeric,
  published_stories bigint,
  total_connections bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ods.total_members,
    ods.active_members,
    ods.student_count,
    ods.alumni_count,
    ods.faculty_staff_count,
    ods.total_events,
    ods.upcoming_events,
    ods.active_jobs,
    ods.total_donations,
    ods.total_donation_amount,
    ods.published_stories,
    ods.total_connections
  FROM public.mv_organization_dashboard_stats ods
  WHERE ods.organization_id = p_organization_id;
END;
$$;

-- Function to get user engagement score
CREATE OR REPLACE FUNCTION public.get_user_engagement_score(p_user_id uuid)
RETURNS decimal
LANGUAGE plpgsql
AS $$
DECLARE
  engagement_score decimal;
BEGIN
  SELECT 
    (
      COALESCE(connection_count, 0) * 0.2 +
      COALESCE(event_attendance_count, 0) * 0.25 +
      COALESCE(job_application_count, 0) * 0.15 +
      COALESCE(donation_count, 0) * 0.2 +
      COALESCE(story_count, 0) * 0.1 +
      COALESCE(message_count, 0) * 0.1
    ) INTO engagement_score
  FROM public.mv_user_engagement_stats
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(engagement_score, 0);
END;
$$;

-- Schedule materialized view refresh (this would be set up as a cron job)
COMMENT ON FUNCTION public.refresh_materialized_views IS 'Refresh materialized views for dashboard statistics. Should be scheduled to run hourly.';

-- Create a simple function to check index usage (for maintenance)
CREATE OR REPLACE FUNCTION public.get_index_usage_info()
RETURNS TABLE(
  index_name text,
  table_name text,
  index_size text,
  index_scans bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    idx.indexname::text as index_name,
    tbl.relname::text as table_name,
    pg_size_pretty(pg_relation_size(idx.indexrelid)) as index_size,
    idx.idx_scan as index_scans
  FROM pg_stat_user_indexes idx
  JOIN pg_class tbl ON idx.relid = tbl.oid
  ORDER BY idx.idx_scan DESC, pg_relation_size(idx.indexrelid) DESC;
END;
$$;