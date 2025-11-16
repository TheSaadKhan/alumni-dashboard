-- 0002_organizations.sql
-- This file ensures organizations tables are created with proper constraints

-- Add UNIQUE constraint to organizations.slug if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'organizations' 
        AND constraint_name = 'organizations_slug_key'
    ) THEN
        ALTER TABLE public.organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);
    END IF;
END $$;

-- Ensure all organization tables exist with proper structure
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