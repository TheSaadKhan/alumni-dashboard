-- 0008_network_connections.sql
CREATE TABLE IF NOT EXISTS public.network_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_a, user_b)
);
