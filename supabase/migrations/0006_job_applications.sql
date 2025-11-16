-- 0006_job_applications.sql
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
  total_experience_years integer CHECK (total_experience_years >= 0),
  linkedin_url text,
  portfolio_url text,
  github_url text,
  website_url text,
  
  -- NEW: Application status tracking
  status text DEFAULT 'applied', -- applied, reviewed, phone_screen, interview, offer, rejected, withdrawn, hired
  application_stage text DEFAULT 'screening', -- screening, phone_screen, technical, onsite, offer, rejected
  
  -- NEW: Timeline tracking
  applied_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  phone_screen_at timestamptz,
  interview_at timestamptz,
  offered_at timestamptz,
  rejected_at timestamptz,
  hired_at timestamptz,
  withdrawn_at timestamptz,
  
  -- NEW: Interview and evaluation
  interview_notes text,
  hiring_manager_notes text,
  technical_skills_rating integer CHECK (technical_skills_rating >= 1 AND technical_skills_rating <= 5),
  cultural_fit_rating integer CHECK (cultural_fit_rating >= 1 AND cultural_fit_rating <= 5),
  communication_skills_rating integer CHECK (communication_skills_rating >= 1 AND communication_skills_rating <= 5),
  overall_rating integer CHECK (overall_rating >= 1 AND overall_rating <= 5),
  
  -- NEW: Salary expectations
  expected_salary jsonb, -- {min: number, max: number, currency: 'USD', period: 'yearly'}
  notice_period_days integer,
  
  -- NEW: Referral information
  referred_by uuid REFERENCES public.profiles(id),
  referral_notes text,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (job_id, applicant_id)
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Job Applications
CREATE POLICY "Applicants can view their own applications" ON public.job_applications
  FOR SELECT USING (applicant_id = auth.uid());

CREATE POLICY "Applicants can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Applicants can update their own applications" ON public.job_applications
  FOR UPDATE USING (applicant_id = auth.uid());

CREATE POLICY "Job posters can view applications for their jobs" ON public.job_applications
  FOR SELECT USING (
    job_id IN (
      SELECT id FROM public.jobs WHERE poster_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can view applications in their org" ON public.job_applications
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_jobs' = 'true'
        OR permissions->>'view_applications' = 'true'
      )
    )
  );

CREATE POLICY "Organization hiring managers can manage applications" ON public.job_applications
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_jobs' = 'true'
        OR permissions->>'manage_applications' = 'true'
      )
    )
  );

CREATE POLICY "Recruiters can update application status" ON public.job_applications
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_jobs' = 'true'
        OR permissions->>'review_applications' = 'true'
      )
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications (job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications (applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_organization_id ON public.job_applications (organization_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications (status);
CREATE INDEX IF NOT EXISTS idx_job_applications_application_stage ON public.job_applications (application_stage);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON public.job_applications (applied_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_member ON public.job_applications (applicant_member_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_referred_by ON public.job_applications (referred_by);
CREATE INDEX IF NOT EXISTS idx_job_applications_overall_rating ON public.job_applications (overall_rating);

-- Function to automatically set organization context
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

-- Function to update application timeline
CREATE OR REPLACE FUNCTION public.update_application_timeline()
RETURNS TRIGGER AS $$
BEGIN
  -- Set reviewed_at when status changes to reviewed
  IF NEW.status = 'reviewed' AND OLD.status != 'reviewed' THEN
    NEW.reviewed_at = NOW();
  END IF;
  
  -- Set phone_screen_at when stage changes to phone_screen
  IF NEW.application_stage = 'phone_screen' AND OLD.application_stage != 'phone_screen' THEN
    NEW.phone_screen_at = NOW();
  END IF;
  
  -- Set interview_at when stage changes to technical or onsite
  IF NEW.application_stage IN ('technical', 'onsite') AND OLD.application_stage NOT IN ('technical', 'onsite') THEN
    NEW.interview_at = NOW();
  END IF;
  
  -- Set offered_at when status changes to offer
  IF NEW.status = 'offer' AND OLD.status != 'offer' THEN
    NEW.offered_at = NOW();
  END IF;
  
  -- Set rejected_at when status changes to rejected
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    NEW.rejected_at = NOW();
  END IF;
  
  -- Set hired_at when status changes to hired
  IF NEW.status = 'hired' AND OLD.status != 'hired' THEN
    NEW.hired_at = NOW();
  END IF;
  
  -- Set withdrawn_at when status changes to withdrawn
  IF NEW.status = 'withdrawn' AND OLD.status != 'withdrawn' THEN
    NEW.withdrawn_at = NOW();
  END IF;
  
  -- Calculate overall rating if individual ratings are provided
  IF NEW.technical_skills_rating IS NOT NULL OR NEW.cultural_fit_rating IS NOT NULL OR NEW.communication_skills_rating IS NOT NULL THEN
    NEW.overall_rating = (
      COALESCE(NEW.technical_skills_rating, 0) + 
      COALESCE(NEW.cultural_fit_rating, 0) + 
      COALESCE(NEW.communication_skills_rating, 0)
    ) / 3;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_application_timeline_trigger
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_application_timeline();

-- Function to get application statistics for a job
CREATE OR REPLACE FUNCTION public.get_job_application_stats(job_uuid uuid)
RETURNS TABLE(
  total_applications bigint,
  new_applications bigint,
  reviewed_count bigint,
  interview_count bigint,
  offer_count bigint,
  hired_count bigint,
  rejected_count bigint,
  withdrawn_count bigint,
  average_rating decimal,
  referral_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status = 'applied') as new_applications,
    COUNT(*) FILTER (WHERE status = 'reviewed') as reviewed_count,
    COUNT(*) FILTER (WHERE application_stage IN ('technical', 'onsite')) as interview_count,
    COUNT(*) FILTER (WHERE status = 'offer') as offer_count,
    COUNT(*) FILTER (WHERE status = 'hired') as hired_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE status = 'withdrawn') as withdrawn_count,
    AVG(overall_rating) as average_rating,
    COUNT(*) FILTER (WHERE referred_by IS NOT NULL) as referral_count
  FROM public.job_applications
  WHERE job_id = job_uuid;
END;
$$;

-- Function to get applicant statistics
CREATE OR REPLACE FUNCTION public.get_applicant_stats(applicant_uuid uuid)
RETURNS TABLE(
  total_applications bigint,
  active_applications bigint,
  interview_count bigint,
  offer_count bigint,
  hired_count bigint,
  average_rating decimal
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status IN ('applied', 'reviewed', 'interview')) as active_applications,
    COUNT(*) FILTER (WHERE application_stage IN ('technical', 'onsite')) as interview_count,
    COUNT(*) FILTER (WHERE status = 'offer') as offer_count,
    COUNT(*) FILTER (WHERE status = 'hired') as hired_count,
    AVG(overall_rating) as average_rating
  FROM public.job_applications
  WHERE applicant_id = applicant_uuid;
END;
$$;

-- View for enhanced application details
CREATE OR REPLACE VIEW public.job_application_details AS
SELECT 
  ja.*,
  j.title as job_title,
  j.company_name,
  j.employment_type,
  j.department as job_department,
  j.experience_level as job_experience_level,
  j.location as job_location,
  a.full_name as applicant_name,
  a.email as applicant_email,
  a.avatar_url as applicant_avatar,
  a.headline as applicant_headline,
  a.location as applicant_location,
  a.graduation_year as applicant_graduation_year,
  a.skills as applicant_skills,
  org.name as organization_name,
  am.title as applicant_title,
  am.department as applicant_department,
  referrer.full_name as referred_by_name,
  referrer.email as referred_by_email
FROM public.job_applications ja
JOIN public.jobs j ON ja.job_id = j.id
JOIN public.profiles a ON ja.applicant_id = a.id
LEFT JOIN public.organizations org ON ja.organization_id = org.id
LEFT JOIN public.organization_members am ON ja.applicant_member_id = am.id
LEFT JOIN public.profiles referrer ON ja.referred_by = referrer.id;

-- Function to check if user has already applied to a job
CREATE OR REPLACE FUNCTION public.has_applied_to_job(
  p_applicant_id uuid,
  p_job_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.job_applications 
    WHERE applicant_id = p_applicant_id AND job_id = p_job_id
  );
END;
$$;

-- Function to withdraw application
CREATE OR REPLACE FUNCTION public.withdraw_application(
  p_application_id uuid,
  p_applicant_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.job_applications
  SET 
    status = 'withdrawn',
    withdrawn_at = NOW(),
    updated_at = NOW()
  WHERE id = p_application_id
    AND (p_applicant_id IS NULL OR applicant_id = p_applicant_id);
  
  RETURN FOUND;
END;
$$;