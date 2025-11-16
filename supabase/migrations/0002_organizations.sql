-- 0002_organizations.sql
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  website text,
  logo_url text,
  address jsonb,
  contact_email text,
  phone_number text,
  description text,
  organization_type text NOT NULL DEFAULT 'educational',
  employee_count_range text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (slug)
);

-- Create organization settings table
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

-- Create organization roles table
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

-- Create organization members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Create organization invitations table
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by_member_id uuid NOT NULL REFERENCES public.organization_members(id),
  target_role_id uuid NOT NULL REFERENCES public.organization_roles(id),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  status text DEFAULT 'pending',
  custom_message text,
  expires_at timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view active organizations" ON public.organizations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Organization members can manage their organization" ON public.organizations
  FOR ALL USING (
    id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view settings in their organization" ON public.organization_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view roles in their organization" ON public.organization_roles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view members in their organization" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can manage organization members" ON public.organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE name IN ('super_admin', 'sub_admin')
      )
    )
  );

CREATE POLICY "Users can view invitations in their organization" ON public.organization_invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
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

CREATE TRIGGER handle_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_organization_roles_updated_at
  BEFORE UPDATE ON public.organization_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_organization_invitations_updated_at
  BEFORE UPDATE ON public.organization_invitations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create default organization roles
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

-- Indexes
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_is_active_idx ON public.organizations(is_active);
CREATE INDEX IF NOT EXISTS organizations_created_by_idx ON public.organizations(created_by);
CREATE INDEX IF NOT EXISTS organizations_organization_type_idx ON public.organizations(organization_type);

CREATE INDEX IF NOT EXISTS org_members_organization_id_idx ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS org_members_user_id_idx ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS org_members_role_id_idx ON public.organization_members(role_id);
CREATE INDEX IF NOT EXISTS org_members_reports_to_idx ON public.organization_members(reports_to);
CREATE INDEX IF NOT EXISTS org_members_is_active_idx ON public.organization_members(is_active);

CREATE INDEX IF NOT EXISTS org_roles_organization_id_idx ON public.organization_roles(organization_id);
CREATE INDEX IF NOT EXISTS org_roles_hierarchy_level_idx ON public.organization_roles(hierarchy_level);

CREATE INDEX IF NOT EXISTS org_invitations_organization_id_idx ON public.organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS org_invitations_token_idx ON public.organization_invitations(token);
CREATE INDEX IF NOT EXISTS org_invitations_email_idx ON public.organization_invitations(email);
CREATE INDEX IF NOT EXISTS org_invitations_status_idx ON public.organization_invitations(status);

-- View for member hierarchy
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