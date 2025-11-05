-- 0500_mv_dashboard_stats.sql
-- Example materialized view that aggregates counts; refresh with schedule or trigger
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_dashboard_stats AS
SELECT
  (SELECT count(*) FROM public.profiles) AS total_profiles,
  (SELECT count(*) FROM public.events WHERE starts_at > now()) AS upcoming_events,
  (SELECT count(*) FROM public.jobs WHERE status = 'open') AS open_jobs;
