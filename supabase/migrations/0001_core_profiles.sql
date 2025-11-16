-- =========================================
-- profiles table setup with Organization Hierarchy (safe, idempotent)
-- =========================================

-- Drop any duplicate or conflicting policies first (optional but safe)
DROP POLICY IF EXISTS "Users can view active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create the profiles table with organization support
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  headline text,
  avatar_url text,
  bio text,
  location text,
  graduation_year smallint CHECK (graduation_year >= 1900 AND graduation_year <= 2100),
  skills jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  tenant_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- NEW COLUMNS FOR ORGANIZATION SUPPORT
  primary_organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_type text DEFAULT 'alumni',
  degree text
);