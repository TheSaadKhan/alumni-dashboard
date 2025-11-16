-- 0015_assets.sql
CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  uploaded_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Enhanced file tracking
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes >= 0),
  mime_type text,
  
  -- NEW: Storage configuration
  bucket_name text NOT NULL,
  storage_provider text DEFAULT 'supabase', -- supabase, aws_s3, google_cloud, azure
  storage_region text,
  storage_tier text DEFAULT 'standard', -- standard, infrequent_access, archive
  
  -- NEW: File properties
  file_extension text,
  dimensions jsonb, -- {width: 1920, height: 1080} for images/videos
  duration_ms integer CHECK (duration_ms >= 0), -- For audio/video files
  checksum_sha256 text, -- File integrity check
  compression_ratio decimal CHECK (compression_ratio >= 0),
  
  -- NEW: Access and permissions
  is_public boolean DEFAULT false,
  visibility text DEFAULT 'private', -- private, organization, public
  access_level text DEFAULT 'view', -- view, download, edit
  password_hash text, -- For password-protected assets
  expires_at timestamptz, -- For temporary access links
  
  -- NEW: Version control
  version_number integer DEFAULT 1 CHECK (version_number >= 1),
  parent_asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL, -- For version history
  is_latest_version boolean DEFAULT true,
  
  -- NEW: Usage tracking
  download_count integer DEFAULT 0 CHECK (download_count >= 0),
  view_count integer DEFAULT 0 CHECK (view_count >= 0),
  last_accessed_at timestamptz,
  last_downloaded_at timestamptz,
  
  -- NEW: Processing status
  processing_status text DEFAULT 'pending', -- pending, processing, completed, failed
  processing_errors text[],
  processed_at timestamptz,
  
  -- NEW: Optimization data
  optimizations jsonb DEFAULT '{}'::jsonb, -- {thumbnail_generated: true, compressed: false}
  variants jsonb DEFAULT '[]'::jsonb, -- Different sizes/formats of the same asset
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Asset collections table
CREATE TABLE IF NOT EXISTS public.asset_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Collection details
  name text NOT NULL,
  description text,
  slug text NOT NULL,
  
  -- NEW: Collection settings
  is_public boolean DEFAULT false,
  visibility text DEFAULT 'private', -- private, organization, public
  allow_uploads boolean DEFAULT true,
  require_approval boolean DEFAULT false,
  
  -- NEW: Organization context
  department text,
  project_name text,
  collection_type text DEFAULT 'general', -- photos, documents, templates, branding
  
  -- NEW: Usage limits
  max_assets integer CHECK (max_assets >= 0),
  max_file_size_bytes bigint CHECK (max_file_size_bytes >= 0),
  allowed_mime_types text[] DEFAULT '{}',
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id, slug)
);

-- Asset collection memberships table
CREATE TABLE IF NOT EXISTS public.asset_collection_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.asset_collections(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- NEW: Membership details
  added_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(asset_id, collection_id)
);

-- Asset access logs table
CREATE TABLE IF NOT EXISTS public.asset_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  accessed_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  accessed_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Access details
  access_type text NOT NULL, -- view, download, share, preview
  access_method text DEFAULT 'direct', -- direct, shared_link, api
  ip_address inet,
  user_agent text,
  country_code char(2),
  
  -- NEW: Shared link context
  shared_link_id uuid, -- References shared_links table if accessed via share
  access_token text, -- Token used for access
  
  -- NEW: Performance data
  load_time_ms integer CHECK (load_time_ms >= 0),
  bytes_transferred bigint CHECK (bytes_transferred >= 0),
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Asset shared links table
CREATE TABLE IF NOT EXISTS public.asset_shared_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  created_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- NEW: Share settings
  share_token text NOT NULL UNIQUE,
  share_url text NOT NULL,
  is_active boolean DEFAULT true,
  
  -- NEW: Access controls
  access_level text DEFAULT 'view', -- view, download
  password_hash text,
  max_uses integer CHECK (max_uses >= 0),
  use_count integer DEFAULT 0 CHECK (use_count >= 0),
  
  -- NEW: Expiration
  expires_at timestamptz,
  last_used_at timestamptz,
  
  -- NEW: Security
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

-- RLS Policies for Assets
CREATE POLICY "Users can view assets based on visibility" ON public.assets
  FOR SELECT USING (
    -- Public assets
    visibility = 'public'
    OR 
    -- Organization assets visible to members
    (visibility = 'organization' AND organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    ))
    OR
    -- Private assets visible to owner
    (visibility = 'private' AND profile_id = auth.uid())
    OR
    -- Organization admins can view all assets in their org
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_assets' = 'true'
      )
    )
  );

CREATE POLICY "Users can create assets in their org" ON public.assets
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'upload_assets' = 'true'
      )
    )
    AND profile_id = auth.uid()
  );

CREATE POLICY "Asset owners can update their assets" ON public.assets
  FOR UPDATE USING (
    profile_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_assets' = 'true'
      )
    )
  );

CREATE POLICY "Asset owners can delete their assets" ON public.assets
  FOR DELETE USING (
    profile_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_assets' = 'true'
      )
    )
  );

-- RLS Policies for Asset Collections
CREATE POLICY "Users can view collections based on visibility" ON public.asset_collections
  FOR SELECT USING (
    visibility = 'public'
    OR 
    (visibility = 'organization' AND organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    ))
    OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_assets' = 'true'
      )
    )
  );

CREATE POLICY "Organization admins can manage collections" ON public.asset_collections
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_assets' = 'true'
      )
    )
  );

-- RLS Policies for Asset Collection Memberships
CREATE POLICY "Users can view collection memberships for accessible assets" ON public.asset_collection_memberships
  FOR SELECT USING (
    asset_id IN (
      SELECT id FROM public.assets WHERE 
        visibility = 'public'
        OR visibility = 'organization'
        OR profile_id = auth.uid()
    )
  );

CREATE POLICY "Collection owners can manage memberships" ON public.asset_collection_memberships
  FOR ALL USING (
    collection_id IN (
      SELECT id FROM public.asset_collections 
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND is_active = true
        AND role_id IN (
          SELECT id FROM public.organization_roles 
          WHERE permissions->>'manage_assets' = 'true'
        )
      )
    )
  );

-- RLS Policies for Asset Access Logs
CREATE POLICY "Organization admins can view access logs" ON public.asset_access_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'view_analytics' = 'true'
      )
    )
  );

-- RLS Policies for Asset Shared Links
CREATE POLICY "Link creators can manage their shared links" ON public.asset_shared_links
  FOR ALL USING (
    created_by_member_id IN (
      SELECT id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_assets' = 'true'
      )
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

CREATE TRIGGER handle_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_asset_collections_updated_at
  BEFORE UPDATE ON public.asset_collections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_asset_shared_links_updated_at
  BEFORE UPDATE ON public.asset_shared_links
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assets_profile_id ON public.assets (profile_id);
CREATE INDEX IF NOT EXISTS idx_assets_organization_id ON public.assets (organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_visibility ON public.assets (visibility);
CREATE INDEX IF NOT EXISTS idx_assets_mime_type ON public.assets (mime_type);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets (created_at);
CREATE INDEX IF NOT EXISTS idx_assets_processing_status ON public.assets (processing_status);
CREATE INDEX IF NOT EXISTS idx_assets_bucket_name ON public.assets (bucket_name);

CREATE INDEX IF NOT EXISTS idx_asset_collections_organization_id ON public.asset_collections (organization_id);
CREATE INDEX IF NOT EXISTS idx_asset_collections_slug ON public.asset_collections (slug);
CREATE INDEX IF NOT EXISTS idx_asset_collections_visibility ON public.asset_collections (visibility);

CREATE INDEX IF NOT EXISTS idx_asset_collection_memberships_asset_id ON public.asset_collection_memberships (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_collection_memberships_collection_id ON public.asset_collection_memberships (collection_id);

CREATE INDEX IF NOT EXISTS idx_asset_access_logs_asset_id ON public.asset_access_logs (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_access_logs_accessed_by_profile_id ON public.asset_access_logs (accessed_by_profile_id);
CREATE INDEX IF NOT EXISTS idx_asset_access_logs_created_at ON public.asset_access_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_asset_shared_links_asset_id ON public.asset_shared_links (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_shared_links_share_token ON public.asset_shared_links (share_token);
CREATE INDEX IF NOT EXISTS idx_asset_shared_links_is_active ON public.asset_shared_links (is_active);

-- Function to automatically set organization context
CREATE OR REPLACE FUNCTION public.set_asset_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from profile's primary organization if not provided
  IF NEW.organization_id IS NULL THEN
    SELECT primary_organization_id INTO NEW.organization_id
    FROM public.profiles
    WHERE id = NEW.profile_id;
  END IF;
  
  -- Set profile_member_id if organization is found
  IF NEW.organization_id IS NOT NULL THEN
    -- Set profile_member_id
    SELECT om.id INTO NEW.profile_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.profile_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
    
    -- Set uploaded_by_member_id to the same as profile_member_id initially
    NEW.uploaded_by_member_id := NEW.profile_member_id;
  END IF;
  
  -- Extract file extension from file_name
  IF NEW.file_extension IS NULL AND NEW.file_name IS NOT NULL THEN
    NEW.file_extension := LOWER(SUBSTRING(NEW.file_name FROM '\.([^\.]*)$'));
  END IF;
  
  -- Set default bucket name if not provided
  IF NEW.bucket_name IS NULL THEN
    NEW.bucket_name := 'assets';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_asset_organization_trigger
  BEFORE INSERT ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_asset_organization();

-- Function to create asset version
CREATE OR REPLACE FUNCTION public.create_asset_version(
  p_asset_id uuid,
  p_file_name text,
  p_file_path text,
  p_file_size_bytes bigint,
  p_mime_type text,
  p_profile_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_original_asset RECORD;
  v_new_asset_id uuid;
  v_profile_id uuid;
BEGIN
  -- Get original asset details
  SELECT * INTO v_original_asset
  FROM public.assets
  WHERE id = p_asset_id;
  
  -- Use provided profile_id or original asset's profile_id
  v_profile_id := COALESCE(p_profile_id, v_original_asset.profile_id);
  
  -- Mark original asset as not latest version
  UPDATE public.assets
  SET is_latest_version = false
  WHERE id = p_asset_id;
  
  -- Create new version
  INSERT INTO public.assets (
    profile_id,
    organization_id,
    profile_member_id,
    uploaded_by_member_id,
    file_name,
    file_path,
    file_size_bytes,
    mime_type,
    bucket_name,
    storage_provider,
    parent_asset_id,
    version_number,
    is_latest_version,
    visibility,
    metadata
  ) VALUES (
    v_profile_id,
    v_original_asset.organization_id,
    v_original_asset.profile_member_id,
    v_original_asset.uploaded_by_member_id,
    p_file_name,
    p_file_path,
    p_file_size_bytes,
    p_mime_type,
    v_original_asset.bucket_name,
    v_original_asset.storage_provider,
    p_asset_id,
    v_original_asset.version_number + 1,
    true,
    v_original_asset.visibility,
    v_original_asset.metadata
  ) RETURNING id INTO v_new_asset_id;
  
  RETURN v_new_asset_id;
END;
$$;

-- Function to log asset access
CREATE OR REPLACE FUNCTION public.log_asset_access(
  p_asset_id uuid,
  p_access_type text,
  p_accessed_by_profile_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_shared_link_id uuid DEFAULT NULL,
  p_access_token text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_asset_record RECORD;
  v_accessed_by_member_id uuid;
BEGIN
  -- Get asset details
  SELECT * INTO v_asset_record
  FROM public.assets
  WHERE id = p_asset_id;
  
  -- Get accessed_by_member_id if profile_id is provided
  IF p_accessed_by_profile_id IS NOT NULL AND v_asset_record.organization_id IS NOT NULL THEN
    SELECT om.id INTO v_accessed_by_member_id
    FROM public.organization_members om
    WHERE om.user_id = p_accessed_by_profile_id 
      AND om.organization_id = v_asset_record.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Log the access
  INSERT INTO public.asset_access_logs (
    asset_id,
    accessed_by_profile_id,
    organization_id,
    accessed_by_member_id,
    access_type,
    ip_address,
    user_agent,
    shared_link_id,
    access_token
  ) VALUES (
    p_asset_id,
    p_accessed_by_profile_id,
    v_asset_record.organization_id,
    v_accessed_by_member_id,
    p_access_type,
    p_ip_address,
    p_user_agent,
    p_shared_link_id,
    p_access_token
  );
  
  -- Update asset access counters
  IF p_access_type = 'view' THEN
    UPDATE public.assets
    SET 
      view_count = view_count + 1,
      last_accessed_at = NOW()
    WHERE id = p_asset_id;
  ELSIF p_access_type = 'download' THEN
    UPDATE public.assets
    SET 
      download_count = download_count + 1,
      last_downloaded_at = NOW(),
      last_accessed_at = NOW()
    WHERE id = p_asset_id;
  END IF;
END;
$$;

-- Function to create shared link
CREATE OR REPLACE FUNCTION public.create_asset_shared_link(
  p_asset_id uuid,
  p_created_by_member_id uuid,
  p_access_level text DEFAULT 'view',
  p_password text DEFAULT NULL,
  p_max_uses integer DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_asset_record RECORD;
  v_share_token text;
  v_share_url text;
  v_shared_link_id uuid;
  v_password_hash text;
BEGIN
  -- Get asset details
  SELECT * INTO v_asset_record
  FROM public.assets
  WHERE id = p_asset_id;
  
  -- Generate unique share token
  v_share_token := encode(gen_random_bytes(32), 'hex');
  v_share_url := '/share/' || v_share_token;
  
  -- Hash password if provided
  IF p_password IS NOT NULL THEN
    v_password_hash := crypt(p_password, gen_salt('bf'));
  END IF;
  
  -- Create shared link
  INSERT INTO public.asset_shared_links (
    asset_id,
    created_by_member_id,
    organization_id,
    share_token,
    share_url,
    access_level,
    password_hash,
    max_uses,
    expires_at
  ) VALUES (
    p_asset_id,
    p_created_by_member_id,
    v_asset_record.organization_id,
    v_share_token,
    v_share_url,
    p_access_level,
    v_password_hash,
    p_max_uses,
    p_expires_at
  ) RETURNING id INTO v_shared_link_id;
  
  RETURN v_share_token;
END;
$$;

-- Function to cleanup expired assets and links
CREATE OR REPLACE FUNCTION public.cleanup_expired_assets()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_assets integer;
  deleted_links integer;
BEGIN
  -- Delete expired shared links
  WITH deleted_links AS (
    DELETE FROM public.asset_shared_links
    WHERE expires_at < NOW()
      AND is_active = true
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_links FROM deleted_links;
  
  -- Delete temporary assets (you might want to archive instead of delete)
  WITH deleted_assets AS (
    DELETE FROM public.assets
    WHERE expires_at < NOW()
      AND processing_status = 'completed'
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_assets FROM deleted_assets;
  
  RETURN deleted_assets + deleted_links;
END;
$$;

-- Function to get asset storage statistics
CREATE OR REPLACE FUNCTION public.get_asset_storage_stats(
  p_organization_id uuid
)
RETURNS TABLE(
  total_assets bigint,
  total_storage_bytes bigint,
  average_file_size decimal,
  storage_by_type jsonb,
  recent_uploads bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_assets,
    COALESCE(SUM(file_size_bytes), 0) as total_storage_bytes,
    COALESCE(AVG(file_size_bytes), 0) as average_file_size,
    (
      SELECT jsonb_object_agg(mime_type, type_stats)
      FROM (
        SELECT 
          mime_type,
          jsonb_build_object(
            'count', COUNT(*),
            'total_size', SUM(file_size_bytes),
            'average_size', AVG(file_size_bytes)
          ) as type_stats
        FROM public.assets
        WHERE organization_id = p_organization_id
        GROUP BY mime_type
      ) AS type_breakdown
    ) as storage_by_type,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_uploads
  FROM public.assets
  WHERE organization_id = p_organization_id;
END;
$$;

-- View for enhanced asset details
CREATE OR REPLACE VIEW public.asset_details AS
SELECT 
  a.*,
  p.full_name as profile_name,
  p.email as profile_email,
  p.avatar_url as profile_avatar,
  org.name as organization_name,
  pm.title as profile_title,
  pm.department as profile_department,
  ubp.full_name as uploaded_by_name,
  COUNT(acm.id) as collection_count,
  COUNT(DISTINCT al.id) as total_access_count
FROM public.assets a
JOIN public.profiles p ON a.profile_id = p.id
LEFT JOIN public.organizations org ON a.organization_id = org.id
LEFT JOIN public.organization_members pm ON a.profile_member_id = pm.id
LEFT JOIN public.profiles ubp ON pm.user_id = ubp.id
LEFT JOIN public.asset_collection_memberships acm ON a.id = acm.asset_id
LEFT JOIN public.asset_access_logs al ON a.id = al.asset_id
GROUP BY a.id, p.id, org.id, pm.id, ubp.id;

-- View for collection details
CREATE OR REPLACE VIEW public.asset_collection_details AS
SELECT 
  ac.*,
  org.name as organization_name,
  cb.full_name as created_by_name,
  cb.email as created_by_email,
  COUNT(acm.id) as asset_count,
  COALESCE(SUM(a.file_size_bytes), 0) as total_size_bytes
FROM public.asset_collections ac
JOIN public.organizations org ON ac.organization_id = org.id
LEFT JOIN public.profiles cb ON ac.created_by_member_id = cb.id
LEFT JOIN public.asset_collection_memberships acm ON ac.id = acm.collection_id
LEFT JOIN public.assets a ON acm.asset_id = a.id
GROUP BY ac.id, org.id, cb.id;