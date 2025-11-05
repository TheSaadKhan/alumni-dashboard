-- 0013_admin_audit_logs.sql
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  before_snapshot jsonb,
  after_snapshot jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
