-- =========================================
-- 0000_init.sql
-- Initial Supabase database setup with Organization Hierarchy
-- =========================================

-- =========================================
-- Enable required extensions
-- =========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "citext";          -- for case-insensitive text
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- for fuzzy search (ILIKE, similarity)
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- for advanced indexing
CREATE EXTENSION IF NOT EXISTS "btree_gist";      -- for spatial indexes and constraints

-- =========================================
-- Core public schema setup
-- =========================================
SET search_path TO public;

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

-- =========================================
-- Function to create default organization roles
-- =========================================
CREATE OR REPLACE FUNCTION public.create_default_organization_roles(org_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Super Admin (can do everything)
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'super_admin',
    'Super Administrator',
    0,
    '{
      "manage_organization": true,
      "manage_members": true,
      "manage_roles": true,
      "manage_settings": true,
      "view_analytics": true,
      "manage_content": true,
      "manage_events": true,
      "manage_jobs": true,
      "manage_donations": true,
      "invite_members": true,
      "manage_network": true,
      "manage_stories": true
    }'::jsonb,
    ARRAY['sub_admin', 'faculty', 'staff', 'student', 'alumni', 'employee'],
    true
  );

  -- Sub Admin (Department Head/Dean)
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'sub_admin',
    'Sub Administrator',
    1,
    '{
      "manage_members": true,
      "manage_content": true,
      "manage_events": true,
      "manage_jobs": true,
      "view_analytics": true,
      "invite_members": true,
      "manage_network": true,
      "manage_stories": true
    }'::jsonb,
    ARRAY['faculty', 'staff', 'student', 'alumni', 'employee'],
    true
  );

  -- Faculty/Manager
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'faculty',
    'Faculty/Manager',
    2,
    '{
      "manage_content": true,
      "manage_events": true,
      "view_analytics": true,
      "invite_members": true,
      "manage_stories": true
    }'::jsonb,
    ARRAY['staff', 'student', 'alumni', 'employee'],
    true
  );

  -- Staff/Employee
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'staff',
    'Staff/Employee',
    3,
    '{
      "create_content": true,
      "create_events": true,
      "view_analytics": false,
      "apply_jobs": true,
      "network": true
    }'::jsonb,
    ARRAY['student', 'alumni'],
    true
  );

  -- Student
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'student',
    'Student',
    4,
    '{
      "view_content": true,
      "join_events": true,
      "apply_jobs": true,
      "network": true
    }'::jsonb,
    ARRAY[]::text[],
    true
  );

  -- Alumni
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'alumni',
    'Alumni',
    4,
    '{
      "view_content": true,
      "join_events": true,
      "apply_jobs": true,
      "network": true
    }'::jsonb,
    ARRAY[]::text[],
    true
  );

  -- Employee (for corporate organizations)
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'employee',
    'Employee',
    4,
    '{
      "view_content": true,
      "join_events": true,
      "apply_jobs": true,
      "network": true
    }'::jsonb,
    ARRAY[]::text[],
    true
  );
END;
$$;

-- =========================================
-- Trigger: auto-update updated_at column
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
DROP TRIGGER IF EXISTS update_organization_settings_updated_at ON public.organization_settings;
DROP TRIGGER IF EXISTS update_organization_roles_updated_at ON public.organization_roles;
DROP TRIGGER IF EXISTS update_organization_members_updated_at ON public.organization_members;
DROP TRIGGER IF EXISTS update_organization_invitations_updated_at ON public.organization_invitations;

-- Create triggers for all tables
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at
BEFORE UPDATE ON public.organization_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_roles_updated_at
BEFORE UPDATE ON public.organization_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
BEFORE UPDATE ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_invitations_updated_at
BEFORE UPDATE ON public.organization_invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- Row Level Security (RLS) - Enhanced for organizations
-- =========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Organizations policies
CREATE POLICY "Users can view active organizations" ON public.organizations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage their organization" ON public.organizations
  FOR ALL USING (
    id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
      AND role_id IN (SELECT id FROM public.organization_roles WHERE name = 'super_admin')
    )
  );

-- Organization members policies
CREATE POLICY "Members can view members in their organization" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage members in their organization" ON public.organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
      AND role_id IN (SELECT id FROM public.organization_roles WHERE name IN ('super_admin', 'sub_admin'))
    )
  );

-- Organization roles policies
CREATE POLICY "Members can view roles in their organization" ON public.organization_roles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
  );

-- Organization settings policies
CREATE POLICY "Members can view settings in their organization" ON public.organization_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
  );

-- Organization invitations policies
CREATE POLICY "Members can view invitations in their organization" ON public.organization_invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
  );

-- =========================================
-- Indexes for performance
-- =========================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_location_idx ON public.profiles (location);
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles (is_active);
CREATE INDEX IF NOT EXISTS profiles_graduation_year_idx ON public.profiles (graduation_year);
CREATE INDEX IF NOT EXISTS profiles_primary_organization_id_idx ON public.profiles (primary_organization_id);
CREATE INDEX IF NOT EXISTS profiles_user_type_idx ON public.profiles (user_type);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON public.organizations (slug);
CREATE INDEX IF NOT EXISTS organizations_is_active_idx ON public.organizations (is_active);
CREATE INDEX IF NOT EXISTS organizations_organization_type_idx ON public.organizations (organization_type);
CREATE INDEX IF NOT EXISTS organizations_created_by_idx ON public.organizations (created_by);

-- Organization members indexes
CREATE INDEX IF NOT EXISTS org_members_organization_id_idx ON public.organization_members (organization_id);
CREATE INDEX IF NOT EXISTS org_members_user_id_idx ON public.organization_members (user_id);
CREATE INDEX IF NOT EXISTS org_members_role_id_idx ON public.organization_members (role_id);
CREATE INDEX IF NOT EXISTS org_members_reports_to_idx ON public.organization_members (reports_to);
CREATE INDEX IF NOT EXISTS org_members_invited_by_idx ON public.organization_members (invited_by);
CREATE INDEX IF NOT EXISTS org_members_is_active_idx ON public.organization_members (is_active);

-- Organization roles indexes
CREATE INDEX IF NOT EXISTS org_roles_organization_id_idx ON public.organization_roles (organization_id);
CREATE INDEX IF NOT EXISTS org_roles_hierarchy_level_idx ON public.organization_roles (hierarchy_level);

-- Organization invitations indexes
CREATE INDEX IF NOT EXISTS org_invitations_organization_id_idx ON public.organization_invitations (organization_id);
CREATE INDEX IF NOT EXISTS org_invitations_token_idx ON public.organization_invitations (token);
CREATE INDEX IF NOT EXISTS org_invitations_email_idx ON public.organization_invitations (email);
CREATE INDEX IF NOT EXISTS org_invitations_status_idx ON public.organization_invitations (status);

-- =========================================
-- View for member hierarchy
-- =========================================
CREATE OR REPLACE VIEW public.organization_member_hierarchy AS
SELECT 
  om.id as member_id,
  om.organization_id,
  org.name as organization_name,
  om.user_id,
  p.full_name,
  p.email,
  om.role_id,
  orole.name as role_name,
  orole.display_name as role_display,
  orole.hierarchy_level,
  om.reports_to,
  reporter.full_name as reports_to_name,
  reporter_role.name as reports_to_role,
  om.invited_by,
  inviter.full_name as invited_by_name,
  om.title,
  om.department,
  om.membership_status,
  om.is_active,
  om.created_at
FROM public.organization_members om
JOIN public.organizations org ON om.organization_id = org.id
JOIN public.profiles p ON om.user_id = p.id
JOIN public.organization_roles orole ON om.role_id = orole.id
LEFT JOIN public.organization_members reporter ON om.reports_to = reporter.id
LEFT JOIN public.profiles reporter_p ON reporter.user_id = reporter_p.id
LEFT JOIN public.organization_roles reporter_role ON reporter.role_id = reporter_role.id
LEFT JOIN public.organization_members inviter ON om.invited_by = inviter.id
LEFT JOIN public.profiles inviter_p ON inviter.user_id = inviter_p.id;

-- =========================================
-- Audit metadata
-- =========================================
COMMENT ON TABLE public.profiles IS 'Stores user profile information with organization support';
COMMENT ON TABLE public.organizations IS 'Stores organization data for hierarchical management';
COMMENT ON TABLE public.organization_members IS 'Links users to organizations with hierarchical roles and reporting structure';
COMMENT ON TABLE public.organization_roles IS 'Defines hierarchical roles and permissions within organizations';
COMMENT ON TABLE public.organization_settings IS 'Organization-specific configuration and settings';
COMMENT ON TABLE public.organization_invitations IS 'Manages member invitation system for organizations';

COMMENT ON COLUMN public.profiles.auth_user_id IS 'References auth.users.id';
COMMENT ON COLUMN public.profiles.primary_organization_id IS 'Primary organization association for the user';
COMMENT ON COLUMN public.profiles.user_type IS 'User type: alumni, student, faculty, admin, employee';
COMMENT ON COLUMN public.organizations.created_by IS 'User who created this organization (becomes super admin)';
COMMENT ON COLUMN public.organization_members.reports_to IS 'Hierarchical reporting relationship within organization';
COMMENT ON COLUMN public.organization_roles.hierarchy_level IS 'Hierarchy level (0=highest, higher numbers=lower in hierarchy)';

-- =========================================
-- Grant permissions
-- =========================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organization_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organization_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organization_invitations TO authenticated;

-- =========================================
-- End of file
-- =========================================