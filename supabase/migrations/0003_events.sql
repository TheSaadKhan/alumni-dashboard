-- 0003_events.sql
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL,
  tenant_id uuid,
  title text NOT NULL,
  description text,
  location text,
  address jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer CHECK (capacity >= 0),
  is_virtual boolean DEFAULT false,
  status text DEFAULT 'draft',
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON public.events (starts_at);
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON public.events (tenant_id);
