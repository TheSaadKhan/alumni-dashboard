-- 0006_job_applications.sql
-- Enhanced job applications table with additional fields
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS github_url text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS phone_screen_at timestamptz,
ADD COLUMN IF NOT EXISTS hired_at timestamptz,
ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
ADD COLUMN IF NOT EXISTS technical_skills_rating integer CHECK (technical_skills_rating >= 1 AND technical_skills_rating <= 5),
ADD COLUMN IF NOT EXISTS cultural_fit_rating integer CHECK (cultural_fit_rating >= 1 AND cultural_fit_rating <= 5),
ADD COLUMN IF NOT EXISTS communication_skills_rating integer CHECK (communication_skills_rating >= 1 AND communication_skills_rating <= 5),
ADD COLUMN IF NOT EXISTS overall_rating integer CHECK (overall_rating >= 1 AND overall_rating <= 5),
ADD COLUMN IF NOT EXISTS expected_salary jsonb,
ADD COLUMN IF NOT EXISTS notice_period_days integer,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS referral_notes text;

-- Add constraints if they don't exist
DO $$ 
BEGIN
    -- Add check constraint for total_experience_years if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'job_applications' 
        AND constraint_name = 'job_applications_total_experience_years_check'
    ) THEN
        ALTER TABLE public.job_applications 
        ADD CONSTRAINT job_applications_total_experience_years_check 
        CHECK (total_experience_years >= 0);
    END IF;
END $$;