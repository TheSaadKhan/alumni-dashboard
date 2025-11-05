-- 0006_job_applications.sql
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  resume_url text,
  cover_letter text,
  status text DEFAULT 'applied',
  applied_at timestamptz DEFAULT now(),
  metadata jsonb,
  UNIQUE (job_id, applicant_id)
);
