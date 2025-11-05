-- 0004_event_attendees.sql
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  attendee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'registered',
  ticket_type text,
  checked_in_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, attendee_id)
);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees (event_id);
