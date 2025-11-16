-- Core tables creation
CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  uploaded_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes >= 0),
  mime_type text,
  bucket_name text NOT NULL,
  storage_provider text DEFAULT 'supabase',
  storage_region text,
  storage_tier text DEFAULT 'standard',
  file_extension text,
  dimensions jsonb,
  duration_ms integer CHECK (duration_ms >= 0),
  checksum_sha256 text,
  compression_ratio decimal CHECK (compression_ratio >= 0),
  is_public boolean DEFAULT false,
  visibility text DEFAULT 'private',
  access_level text DEFAULT 'view',
  password_hash text,
  expires_at timestamptz,
  version_number integer DEFAULT 1 CHECK (version_number >= 1),
  parent_asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  is_latest_version boolean DEFAULT true,
  download_count integer DEFAULT 0 CHECK (download_count >= 0),
  view_count integer DEFAULT 0 CHECK (view_count >= 0),
  last_accessed_at timestamptz,
  last_downloaded_at timestamptz,
  processing_status text DEFAULT 'pending',
  processing_errors text[],
  processed_at timestamptz,
  optimizations jsonb DEFAULT '{}'::jsonb,
  variants jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asset_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  slug text NOT NULL,
  is_public boolean DEFAULT false,
  visibility text DEFAULT 'private',
  allow_uploads boolean DEFAULT true,
  require_approval boolean DEFAULT false,
  department text,
  project_name text,
  collection_type text DEFAULT 'general',
  max_assets integer CHECK (max_assets >= 0),
  max_file_size_bytes bigint CHECK (max_file_size_bytes >= 0),
  allowed_mime_types text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE IF NOT EXISTS public.asset_collection_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.asset_collections(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  added_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(asset_id, collection_id)
);

CREATE TABLE IF NOT EXISTS public.asset_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  accessed_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  accessed_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  access_type text NOT NULL,
  access_method text DEFAULT 'direct',
  ip_address inet,
  user_agent text,
  country_code char(2),
  shared_link_id uuid,
  access_token text,
  load_time_ms integer CHECK (load_time_ms >= 0),
  bytes_transferred bigint CHECK (bytes_transferred >= 0),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asset_shared_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  created_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE,
  share_url text NOT NULL,
  is_active boolean DEFAULT true,
  access_level text DEFAULT 'view',
  password_hash text,
  max_uses integer CHECK (max_uses >= 0),
  use_count integer DEFAULT 0 CHECK (use_count >= 0),
  expires_at timestamptz,
  last_used_at timestamptz,
  require_email boolean DEFAULT false,
  allowed_emails text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_collection_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_shared_links ENABLE ROW LEVEL SECURITY;