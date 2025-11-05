-- Performance indexes
CREATE INDEX CONCURRENTLY idx_profiles_graduation_year ON profiles(graduation_year);
CREATE INDEX CONCURRENTLY idx_profiles_industry ON profiles(industry);
CREATE INDEX CONCURRENTLY idx_profiles_location ON profiles(location);
CREATE INDEX CONCURRENTLY idx_profiles_is_active ON profiles(is_active);

CREATE INDEX CONCURRENTLY idx_events_start_date ON events(start_date);
CREATE INDEX CONCURRENTLY idx_events_status ON events(status);
CREATE INDEX CONCURRENTLY idx_events_organizer_id ON events(organizer_id);

CREATE INDEX CONCURRENTLY idx_jobs_posted_by ON job_postings(posted_by);
CREATE INDEX CONCURRENTLY idx_jobs_is_active ON job_postings(is_active);
CREATE INDEX CONCURRENTLY idx_jobs_created_at ON job_postings(created_at);

CREATE INDEX CONCURRENTLY idx_stories_author_id ON stories(author_id);
CREATE INDEX CONCURRENTLY idx_stories_status ON stories(status);
CREATE INDEX CONCURRENTLY idx_stories_published_at ON stories(published_at);

CREATE INDEX CONCURRENTLY idx_network_connections_requester ON network_connections(requester_id);
CREATE INDEX CONCURRENTLY idx_network_connections_receiver ON network_connections(receiver_id);
CREATE INDEX CONCURRENTLY idx_network_connections_status ON network_connections(status);

-- Materialized view for dashboard stats
CREATE MATERIALIZED VIEW mv_dashboard_stats AS
SELECT 
  COUNT(DISTINCT p.id) as total_alumni,
  COUNT(DISTINCT CASE WHEN p.is_verified THEN p.id END) as verified_alumni,
  COUNT(DISTINCT e.id) as total_events,
  COUNT(DISTINCT j.id) as active_jobs,
  COUNT(DISTINCT d.id) as total_donations,
  SUM(d.amount) as donation_amount
FROM profiles p
LEFT JOIN events e ON e.status = 'published'
LEFT JOIN job_postings j ON j.is_active = true
LEFT JOIN donations d ON d.payment_status = 'completed';

CREATE UNIQUE INDEX idx_mv_dashboard_stats ON mv_dashboard_stats (total_alumni);