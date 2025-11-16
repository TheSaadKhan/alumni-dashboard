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
  UPDATE public.assets
  SET 
    last_accessed_at = NOW(),
    view_count = view_count + CASE WHEN p_access_type = 'view' THEN 1 ELSE 0 END,
    download_count = download_count + CASE WHEN p_access_type = 'download' THEN 1 ELSE 0 END,
    last_downloaded_at = CASE 
      WHEN p_access_type = 'download' THEN NOW() 
      ELSE last_downloaded_at 
    END
  WHERE id = p_asset_id;
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
  v_password_hash text;
BEGIN
  -- Get asset details
  SELECT * INTO v_asset_record
  FROM public.assets
  WHERE id = p_asset_id;
  
  -- Generate unique share token
  v_share_token := encode(gen_random_bytes(16), 'hex');
  
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
    '/share/' || v_share_token,
    p_access_level,
    v_password_hash,
    p_max_uses,
    p_expires_at
  );
  
  RETURN v_share_token;
END;
$$;

-- Function to validate shared link access
CREATE OR REPLACE FUNCTION public.validate_shared_link_access(
  p_share_token text,
  p_password text DEFAULT NULL
)
RETURNS TABLE(
  is_valid boolean,
  asset_id uuid,
  access_level text,
  shared_link_id uuid,
  error_message text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_shared_link RECORD;
  v_is_password_valid boolean;
BEGIN
  -- Get shared link details
  SELECT * INTO v_shared_link
  FROM public.asset_shared_links
  WHERE share_token = p_share_token
    AND is_active = true;
  
  -- Check if link exists
  IF v_shared_link IS NULL THEN
    RETURN QUERY SELECT false, NULL, NULL, NULL, 'Shared link not found or inactive';
    RETURN;
  END IF;
  
  -- Check if link is expired
  IF v_shared_link.expires_at IS NOT NULL AND v_shared_link.expires_at < NOW() THEN
    RETURN QUERY SELECT false, NULL, NULL, NULL, 'Shared link has expired';
    RETURN;
  END IF;
  
  -- Check if max uses exceeded
  IF v_shared_link.max_uses IS NOT NULL AND v_shared_link.use_count >= v_shared_link.max_uses THEN
    RETURN QUERY SELECT false, NULL, NULL, NULL, 'Shared link usage limit exceeded';
    RETURN;
  END IF;
  
  -- Validate password if required
  IF v_shared_link.password_hash IS NOT NULL THEN
    IF p_password IS NULL THEN
      RETURN QUERY SELECT false, NULL, NULL, NULL, 'Password required';
      RETURN;
    END IF;
    
    SELECT (v_shared_link.password_hash = crypt(p_password, v_shared_link.password_hash)) 
    INTO v_is_password_valid;
    
    IF NOT v_is_password_valid THEN
      RETURN QUERY SELECT false, NULL, NULL, NULL, 'Invalid password';
      RETURN;
    END IF;
  END IF;
  
  -- Increment use count
  UPDATE public.asset_shared_links
  SET 
    use_count = use_count + 1,
    last_used_at = NOW()
  WHERE id = v_shared_link.id;
  
  RETURN QUERY SELECT true, v_shared_link.asset_id, v_shared_link.access_level, v_shared_link.id, NULL;
END;
$$;

-- Function to cleanup expired assets and links
CREATE OR REPLACE FUNCTION public.cleanup_expired_assets()
RETURNS TABLE(
  deleted_assets bigint,
  deleted_links bigint
)
LANGUAGE plpgsql
AS $$
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
  
  RETURN QUERY SELECT deleted_assets, deleted_links;
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
  recent_uploads bigint,
  top_file_types jsonb
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH asset_stats AS (
    SELECT 
      COUNT(*) as total_count,
      COALESCE(SUM(file_size_bytes), 0) as total_size,
      COALESCE(AVG(file_size_bytes), 0) as avg_size,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_count
    FROM public.assets
    WHERE organization_id = p_organization_id
  ),
  type_stats AS (
    SELECT 
      CASE 
        WHEN mime_type LIKE 'image/%' THEN 'image'
        WHEN mime_type LIKE 'video/%' THEN 'video'
        WHEN mime_type LIKE 'audio/%' THEN 'audio'
        WHEN mime_type LIKE 'application/pdf' THEN 'pdf'
        WHEN mime_type LIKE 'application/%' THEN 'document'
        WHEN mime_type LIKE 'text/%' THEN 'text'
        ELSE 'other'
      END as file_category,
      COUNT(*) as count,
      SUM(file_size_bytes) as total_size
    FROM public.assets
    WHERE organization_id = p_organization_id
    GROUP BY file_category
  )
  SELECT 
    asset_stats.total_count,
    asset_stats.total_size,
    asset_stats.avg_size,
    (
      SELECT jsonb_object_agg(file_category, jsonb_build_object(
        'count', count,
        'total_size', total_size,
        'percentage', ROUND((total_size::decimal / NULLIF(asset_stats.total_size, 0)) * 100, 2)
      ))
      FROM type_stats
    ) as storage_by_type,
    asset_stats.recent_count,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'mime_type', mime_type,
        'count', type_count
      ))
      FROM (
        SELECT mime_type, COUNT(*) as type_count
        FROM public.assets
        WHERE organization_id = p_organization_id
        GROUP BY mime_type
        ORDER BY type_count DESC
        LIMIT 5
      ) AS top_types
    ) as top_file_types
  FROM asset_stats;
END;
$$;

-- Function to update asset processing status
CREATE OR REPLACE FUNCTION public.update_asset_processing_status(
  p_asset_id uuid,
  p_processing_status text,
  p_processing_metadata jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.assets
  SET 
    processing_status = p_processing_status,
    processing_metadata = COALESCE(p_processing_metadata, processing_metadata),
    processed_at = CASE 
      WHEN p_processing_status = 'completed' THEN NOW()
      ELSE processed_at
    END,
    updated_at = NOW()
  WHERE id = p_asset_id;
  
  RETURN FOUND;
END;
$$;