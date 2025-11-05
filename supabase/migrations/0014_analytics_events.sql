-- 0014_analytics_events.sql
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  event_type text NOT NULL,
  event_props jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events (event_type);
