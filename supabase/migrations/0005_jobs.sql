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