-- 0005_jobs.sql
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id uuid NOT NULL,
  tenant_id uuid,
  title text NOT NULL,
  company_name text,
  location text,
  description text,
  employment_type text,
  salary_range jsonb,
  tags text[],
  metadata jsonb,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_tags ON public.jobs USING gin (tags);
