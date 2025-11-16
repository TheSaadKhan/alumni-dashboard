-- 0005_jobs.sql
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id uuid,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  title text NOT NULL,
  company_name text,
  location text,
  description text,
  employment_type text, -- full_time, part_time, contract, internship, temporary
  
  -- NEW: Enhanced job fields
  department text,
  experience_level text, -- entry, mid, senior, executive
  education_requirements text[] DEFAULT '{}',
  
  salary_range jsonb, -- {min: number, max: number, currency: 'USD', period: 'yearly'}
  benefits text[] DEFAULT '{}',
  
  tags text[],
  
  -- NEW: Application process
  application_url text,
  application_instructions text,
  application_deadline timestamptz,
  remote_policy text, -- remote, hybrid, on_site
  
  -- NEW: Job status and visibility
  status text DEFAULT 'open', -- open, closed, draft, paused
  visibility text DEFAULT 'public', -- public, organization_only, private
  featured boolean DEFAULT false,
  priority integer DEFAULT 0,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  applicant_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  resume_url text,
  cover_letter text,
  
  -- NEW: Enhanced application fields
  current_company text,
  current_title text,
  total_experience_years integer,
  linkedin_url text,
  portfolio_url text,
  
  status text DEFAULT 'applied', -- applied, reviewed, interviewed, offered, rejected, withdrawn
  application_stage text DEFAULT 'screening', -- screening, interview, offer, rejected
  
  -- NEW: Application tracking
  applied_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  interviewed_at timestamptz,
  offered_at timestamptz,
  rejected_at timestamptz,
  
  -- NEW: Interview and feedback
  interview_notes text,
  hiring_manager_notes text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(job_id, applicant_id)
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Jobs
CREATE POLICY "Users can view jobs based on visibility" ON public.jobs
  FOR SELECT USING (
    -- Public jobs
    visibility = 'public'
    OR 
    -- Organization jobs visible to members
    (visibility = 'organization_only' AND organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    ))
    OR
    -- Private jobs visible to poster
    (visibility = 'private' AND poster_id = auth.uid())
    OR
    -- Organization admins can see all jobs in their org
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_jobs' = 'true'
      )
    )
  );

CREATE POLICY "Organization members can create jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_jobs' = 'true'
      )
    )
  );

CREATE POLICY "Job posters can update their jobs" ON public.jobs
  FOR UPDATE USING (
    poster_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_jobs' = 'true'
      )
    )
  );

CREATE POLICY "Job posters can delete their jobs" ON public.jobs
  FOR DELETE USING (
    poster_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_jobs' = 'true'
      )
    )
  );

-- RLS Policies for Job Applications
CREATE POLICY "Applicants can view their own applications" ON public.job_applications
  FOR SELECT USING (applicant_id = auth.uid());

CREATE POLICY "Applicants can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Applicants can update their own applications" ON public.job_applications
  FOR UPDATE USING (applicant_id = auth.uid());

CREATE POLICY "Organization members can view applications in their org" ON public.job_applications
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_jobs' = 'true'
      )
    )
  );

CREATE POLICY "Organization admins can manage applications" ON public.job_applications
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_jobs' = 'true'
      )
    )
  );

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_tags ON public.jobs USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_jobs_organization_id ON public.jobs (organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_poster_id ON public.jobs (poster_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON public.jobs (employment_type);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON public.jobs (featured);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs (created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_application_deadline ON public.jobs (application_deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON public.jobs (location);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON public.jobs (experience_level);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications (job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications (applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_organization_id ON public.job_applications (organization_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications (status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON public.job_applications (applied_at);

-- Function to automatically set organization context
CREATE OR REPLACE FUNCTION public.set_job_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from poster's primary organization if not provided
  IF NEW.organization_id IS NULL THEN
    SELECT primary_organization_id INTO NEW.organization_id
    FROM public.profiles
    WHERE id = NEW.poster_id;
  END IF;
  
  -- Set created_by_member_id if available
  IF NEW.created_by_member_id IS NULL AND NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.created_by_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.poster_id 
    AND om.organization_id = NEW.organization_id
    AND om.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_organization_trigger
  BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_job_organization();

-- Function to set application organization context
CREATE OR REPLACE FUNCTION public.set_job_application_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from the job
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.jobs
    WHERE id = NEW.job_id;
  END IF;
  
  -- Set applicant_member_id if available
  IF NEW.applicant_member_id IS NULL AND NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.applicant_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.applicant_id 
    AND om.organization_id = NEW.organization_id
    AND om.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_application_organization_trigger
  BEFORE INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_job_application_organization();

-- Function to get job application statistics
CREATE OR REPLACE FUNCTION public.get_job_application_stats(job_uuid uuid)
RETURNS TABLE(
  total_applications bigint,
  new_applications bigint,
  reviewed_count bigint,
  interviewed_count bigint,
  offered_count bigint,
  rejected_count bigint,
  average_rating decimal
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status = 'applied') as new_applications,
    COUNT(*) FILTER (WHERE status = 'reviewed') as reviewed_count,
    COUNT(*) FILTER (WHERE status = 'interviewed') as interviewed_count,
    COUNT(*) FILTER (WHERE status = 'offered') as offered_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    AVG(rating) as average_rating
  FROM public.job_applications
  WHERE job_id = job_uuid;
END;
$$;

-- View for enhanced job information
CREATE OR REPLACE VIEW public.job_details AS
SELECT 
  j.*,
  p.full_name as poster_name,
  p.email as poster_email,
  org.name as organization_name,
  om.title as poster_title,
  om.department as poster_department,
  public.get_job_application_stats(j.id) as application_stats,
  CASE 
    WHEN j.application_deadline < NOW() THEN 'expired'
    WHEN j.status = 'open' THEN 'active'
    ELSE j.status
  END as listing_status
FROM public.jobs j
JOIN public.profiles p ON j.poster_id = p.id
LEFT JOIN public.organizations org ON j.organization_id = org.id
LEFT JOIN public.organization_members om ON j.created_by_member_id = om.id;

-- View for application details
CREATE OR REPLACE VIEW public.job_application_details AS
SELECT 
  ja.*,
  j.title as job_title,
  j.company_name,
  j.employment_type,
  j.department as job_department,
  a.full_name as applicant_name,
  a.email as applicant_email,
  a.avatar_url as applicant_avatar,
  a.headline as applicant_headline,
  org.name as organization_name,
  am.title as applicant_title,
  am.department as applicant_department
FROM public.job_applications ja
JOIN public.jobs j ON ja.job_id = j.id
JOIN public.profiles a ON ja.applicant_id = a.id
LEFT JOIN public.organizations org ON ja.organization_id = org.id
LEFT JOIN public.organization_members am ON ja.applicant_member_id = am.id;

-- Function to close expired job listings
CREATE OR REPLACE FUNCTION public.close_expired_jobs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.jobs
  SET status = 'closed'
  WHERE status = 'open'
    AND application_deadline IS NOT NULL
    AND application_deadline < NOW();
END;
$$;