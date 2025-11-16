-- Organization Members Policies
DROP POLICY IF EXISTS "Users can view members in their organization" ON public.organization_members;
CREATE POLICY "Users can view members in their organization"
ON public.organization_members
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Admins can manage organization members" ON public.organization_members;
CREATE POLICY "Admins can manage organization members"
ON public.organization_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
      AND om.is_active = true
      AND r.permissions->>'manage_members' = 'true'
  )
);

DROP POLICY IF EXISTS "Users can update their own membership" ON public.organization_members;
CREATE POLICY "Users can update their own membership"
ON public.organization_members
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can invite members" ON public.organization_members;
CREATE POLICY "Admins can invite members"
ON public.organization_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
      AND om.is_active = true
      AND (
        r.permissions->>'manage_members' = 'true'
        OR r.permissions->>'invite_members' = 'true'
      )
  )
);

-- RLS Policies for Jobs
DROP POLICY IF EXISTS "Users can view jobs based on visibility" ON public.jobs;
CREATE POLICY "Users can view jobs based on visibility" 
ON public.jobs
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
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = jobs.organization_id
      AND om.is_active = true
      AND (
        r.permissions->>'manage_jobs' = 'true'
        OR r.permissions->>'manage_content' = 'true'
      )
  )
);

DROP POLICY IF EXISTS "Organization members can create jobs" ON public.jobs;
CREATE POLICY "Organization members can create jobs" 
ON public.jobs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = jobs.organization_id
      AND om.is_active = true
      AND (
        r.permissions->>'manage_jobs' = 'true'
        OR r.permissions->>'create_content' = 'true'
        OR r.permissions->>'manage_content' = 'true'
      )
  )
  AND poster_id = auth.uid()
);

DROP POLICY IF EXISTS "Job posters can update their jobs" ON public.jobs;
CREATE POLICY "Job posters can update their jobs" 
ON public.jobs
FOR UPDATE USING (
  poster_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = jobs.organization_id
      AND om.is_active = true
      AND (
        r.permissions->>'manage_jobs' = 'true'
        OR r.permissions->>'manage_content' = 'true'
      )
  )
);

DROP POLICY IF EXISTS "Job posters can delete their jobs" ON public.jobs;
CREATE POLICY "Job posters can delete their jobs" 
ON public.jobs
FOR DELETE USING (
  poster_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = jobs.organization_id
      AND om.is_active = true
      AND (
        r.permissions->>'manage_jobs' = 'true'
        OR r.permissions->>'manage_content' = 'true'
      )
  )
);

-- Additional job policies for better control
DROP POLICY IF EXISTS "Users can view published jobs" ON public.jobs;
CREATE POLICY "Users can view published jobs" 
ON public.jobs
FOR SELECT USING (
  status = 'published'
  AND (
    visibility = 'public'
    OR (
      visibility = 'organization_only' 
      AND organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
);

DROP POLICY IF EXISTS "Admins can manage all jobs in organization" ON public.jobs;
CREATE POLICY "Admins can manage all jobs in organization" 
ON public.jobs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = jobs.organization_id
      AND om.is_active = true
      AND r.permissions->>'manage_jobs' = 'true'
  )
);

-- RLS Policies for Job Applications
DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;
CREATE POLICY "Users can view their own applications" 
ON public.job_applications
FOR SELECT USING (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Users can create job applications" ON public.job_applications;
CREATE POLICY "Users can create job applications" 
ON public.job_applications
FOR INSERT WITH CHECK (
  applicant_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_applications.job_id
      AND j.status = 'published'
      AND (
        j.visibility = 'public'
        OR (
          j.visibility = 'organization_only'
          AND j.organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND is_active = true
          )
        )
      )
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.job_applications ja
    WHERE ja.applicant_id = auth.uid()
      AND ja.job_id = job_applications.job_id
  )
);

DROP POLICY IF EXISTS "Recruiters can view applications for their jobs" ON public.job_applications;
CREATE POLICY "Recruiters can view applications for their jobs" 
ON public.job_applications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.organization_members om ON om.organization_id = j.organization_id
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.is_active = true
      AND j.id = job_applications.job_id
      AND (
        r.permissions->>'manage_jobs' = 'true'
        OR j.poster_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "Applicants can update their own applications" ON public.job_applications;
CREATE POLICY "Applicants can update their own applications" 
ON public.job_applications
FOR UPDATE USING (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Recruiters can manage applications" ON public.job_applications;
CREATE POLICY "Recruiters can manage applications" 
ON public.job_applications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.organization_members om ON om.organization_id = j.organization_id
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.is_active = true
      AND j.id = job_applications.job_id
      AND (
        r.permissions->>'manage_jobs' = 'true'
        OR j.poster_id = auth.uid()
      )
  )
);

-- Function to check if user can apply to job
CREATE OR REPLACE FUNCTION public.can_apply_to_job(
  p_user_id uuid,
  p_job_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_job_record RECORD;
  v_is_organization_member boolean;
  v_has_applied boolean;
BEGIN
  -- Get job details
  SELECT * INTO v_job_record
  FROM public.jobs
  WHERE id = p_job_id;

  -- Check if job exists and is published
  IF v_job_record IS NULL OR v_job_record.status != 'published' THEN
    RETURN false;
  END IF;

  -- Check if user has already applied
  SELECT EXISTS (
    SELECT 1 FROM public.job_applications
    WHERE applicant_id = p_user_id AND job_id = p_job_id
  ) INTO v_has_applied;

  IF v_has_applied THEN
    RETURN false;
  END IF;

  -- Check application eligibility based on visibility
  CASE v_job_record.visibility
    WHEN 'public' THEN
      RETURN true;
      
    WHEN 'organization_only' THEN
      -- Check if user is member of job's organization
      SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = p_user_id
          AND organization_id = v_job_record.organization_id
          AND is_active = true
      ) INTO v_is_organization_member;
      RETURN v_is_organization_member;
      
    WHEN 'private' THEN
      -- Only job poster can view private jobs, but they typically don't apply to their own jobs
      RETURN false;
      
    ELSE
      RETURN false;
  END CASE;
END;
$$;