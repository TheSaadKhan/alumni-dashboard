-- =========================================
-- Core public schema setup
-- =========================================
SET search_path TO public;
CREATE EXTENSION IF NOT EXISTS citext;

-- =========================================
-- Organizations table: core organization data
-- =========================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug citext NOT NULL UNIQUE,
  website text,
  logo_url text,
  address jsonb,
  contact_email citext,
  phone_number text,
  description text,
  organization_type text NOT NULL DEFAULT 'educational',
  employee_count_range text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  created_by uuid, -- References profiles.id
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================================
-- Organization Settings table
-- =========================================
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{
    "allow_member_invites": true,
    "require_approval": false,
    "max_members": null,
    "allowed_domains": [],
    "theme": "default",
    "features": {
      "alumni_network": true,
      "events": true,
      "job_postings": true,
      "donations": true
    }
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id)
);

-- =========================================
-- Organization Roles table: hierarchical role definitions
-- =========================================
CREATE TABLE IF NOT EXISTS public.organization_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text NOT NULL,
  hierarchy_level integer NOT NULL DEFAULT 0,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  can_invite_roles text[] DEFAULT '{}',
  max_invites_per_month integer,
  is_system_role boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- =========================================
-- Organization Members table: member assignments with hierarchy
-- =========================================
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, -- Will reference profiles.id after profiles table is created
  role_id uuid NOT NULL REFERENCES public.organization_roles(id),
  invited_by uuid REFERENCES public.organization_members(id),
  reports_to uuid REFERENCES public.organization_members(id),
  title text,
  department text,
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  membership_status text DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- =========================================
-- Organization Invitations table
-- =========================================
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by_member_id uuid NOT NULL REFERENCES public.organization_members(id),
  target_role_id uuid NOT NULL REFERENCES public.organization_roles(id),
  email citext NOT NULL,
  token text NOT NULL UNIQUE,
  status text DEFAULT 'pending',
  custom_message text,
  expires_at timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================================
-- Profiles table: core user identity data (UPDATED)
-- =========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,              -- linked to Supabase auth.users.id
  email citext NOT NULL UNIQUE,
  full_name text,
  headline text,
  avatar_url text,
  bio text,
  location text,
  graduation_year smallint CHECK (
    graduation_year >= 1900 AND graduation_year <= 2100
  ),
  skills jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  tenant_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- NEW COLUMNS FOR ORGANIZATION SUPPORT
  primary_organization_id uuid REFERENCES public.organizations(id),
  user_type text DEFAULT 'alumni',
  degree text
);

-- =========================================
-- Now add foreign key constraint for organization_members.user_id
-- =========================================
ALTER TABLE public.organization_members 
ADD CONSTRAINT organization_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =========================================
-- Update organizations.created_by foreign key
-- =========================================
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id);