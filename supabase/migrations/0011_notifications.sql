-- 0011_notifications.sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  type text NOT NULL,
  payload jsonb,
  is_read boolean DEFAULT false,
  delivered boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
