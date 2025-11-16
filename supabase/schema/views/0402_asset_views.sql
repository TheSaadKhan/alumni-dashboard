-- View for enhanced asset details
CREATE OR REPLACE VIEW public.asset_details AS
SELECT 
  a.*,
  p.full_name as profile_name,
  p.email as profile_email,
  p.avatar_url as profile_avatar,
  p.headline as profile_headline,
  org.name as organization_name,
  pm.title as profile_title,
  pm.department as profile_department,
  uploader.full_name as uploaded_by_name,
  uploader.avatar_url as uploaded_by_avatar,
  ac.name as primary_collection_name,
  ac.slug as primary_collection_slug,
  COUNT(DISTINCT acm.id) as collection_count,
  COUNT(DISTINCT al.id) as total_access_count,
  COUNT(DISTINCT asl.id) as shared_link_count,
  -- Calculate human-readable file size
  CASE 
    WHEN a.file_size_bytes IS NULL THEN 'Unknown'
    WHEN a.file_size_bytes < 1024 THEN a.file_size_bytes || ' B'
    WHEN a.file_size_bytes < 1048576 THEN ROUND(a.file_size_bytes / 1024.0, 1) || ' KB'
    WHEN a.file_size_bytes < 1073741824 THEN ROUND(a.file_size_bytes / 1048576.0, 1) || ' MB'
    ELSE ROUND(a.file_size_bytes / 1073741824.0, 1) || ' GB'
  END as file_size_display
FROM public.assets a
JOIN public.profiles p ON a.profile_id = p.id
LEFT JOIN public.organizations org ON a.organization_id = org.id
LEFT JOIN public.organization_members pm ON a.profile_member_id = pm.id
LEFT JOIN public.profiles uploader ON a.uploaded_by = uploader.id
LEFT JOIN public.asset_collections ac ON a.collection_id = ac.id
LEFT JOIN public.asset_collection_memberships acm ON a.id = acm.asset_id
LEFT JOIN public.asset_access_logs al ON a.id = al.asset_id
LEFT JOIN public.asset_shared_links asl ON a.id = asl.asset_id AND asl.is_active = true
GROUP BY a.id, p.id, org.id, pm.id, uploader.id, ac.id;

-- View for enhanced collection details
CREATE OR REPLACE VIEW public.asset_collection_details AS
SELECT 
  ac.*,
  org.name as organization_name,
  creator.full_name as created_by_name,
  creator.avatar_url as created_by_avatar,
  creator.email as created_by_email,
  cm.title as created_by_title,
  cm.department as created_by_department,
  COUNT(DISTINCT acm.asset_id) as asset_count,
  COUNT(DISTINCT asl.id) as active_shared_links,
  COALESCE(SUM(a.file_size_bytes), 0) as total_size_bytes,
  -- Calculate human-readable total size
  CASE 
    WHEN COALESCE(SUM(a.file_size_bytes), 0) = 0 THEN 'Empty'
    WHEN COALESCE(SUM(a.file_size_bytes), 0) < 1024 THEN COALESCE(SUM(a.file_size_bytes), 0) || ' B'
    WHEN COALESCE(SUM(a.file_size_bytes), 0) < 1048576 THEN ROUND(COALESCE(SUM(a.file_size_bytes), 0) / 1024.0, 1) || ' KB'
    WHEN COALESCE(SUM(a.file_size_bytes), 0) < 1073741824 THEN ROUND(COALESCE(SUM(a.file_size_bytes), 0) / 1048576.0, 1) || ' MB'
    ELSE ROUND(COALESCE(SUM(a.file_size_bytes), 0) / 1073741824.0, 1) || ' GB'
  END as total_size_display,
  -- Get most recent asset upload
  MAX(a.uploaded_at) as last_asset_upload,
  -- Calculate collection age
  EXTRACT(DAYS FROM NOW() - ac.created_at) as age_in_days
FROM public.asset_collections ac
JOIN public.organizations org ON ac.organization_id = org.id
LEFT JOIN public.profiles creator ON ac.created_by = creator.id
LEFT JOIN public.organization_members cm ON ac.created_by_member_id = cm.id
LEFT JOIN public.asset_collection_memberships acm ON ac.id = acm.collection_id
LEFT JOIN public.assets a ON acm.asset_id = a.id
LEFT JOIN public.asset_shared_links asl ON ac.id = asl.collection_id AND asl.is_active = true
GROUP BY ac.id, org.id, creator.id, cm.id;

-- View for asset shared link details
CREATE OR REPLACE VIEW public.asset_shared_link_details AS
SELECT 
  asl.*,
  a.file_name,
  a.file_type,
  a.file_size_bytes,
  a.visibility as asset_visibility,
  ac.name as collection_name,
  ac.slug as collection_slug,
  creator.full_name as created_by_name,
  creator.avatar_url as created_by_avatar,
  org.name as organization_name,
  cm.title as created_by_title,
  -- Calculate days until expiration
  CASE 
    WHEN asl.expires_at IS NULL THEN NULL
    ELSE EXTRACT(DAYS FROM asl.expires_at - NOW())
  END as days_until_expiration,
  -- Check if link is expired
  (asl.expires_at IS NOT NULL AND asl.expires_at < NOW()) as is_expired,
  -- Calculate access rate (accesses per day since creation)
  CASE 
    WHEN asl.created_at IS NULL OR asl.access_count = 0 THEN 0
    ELSE asl.access_count / GREATEST(EXTRACT(DAYS FROM NOW() - asl.created_at), 1)
  END as daily_access_rate
FROM public.asset_shared_links asl
LEFT JOIN public.assets a ON asl.asset_id = a.id
LEFT JOIN public.asset_collections ac ON asl.collection_id = ac.id
LEFT JOIN public.profiles creator ON asl.created_by = creator.id
LEFT JOIN public.organizations org ON asl.organization_id = org.id
LEFT JOIN public.organization_members cm ON asl.created_by_member_id = cm.id;

-- View for asset access analytics
CREATE OR REPLACE VIEW public.asset_access_analytics AS
SELECT 
  a.id as asset_id,
  a.file_name,
  a.file_type,
  a.organization_id,
  org.name as organization_name,
  COUNT(al.id) as total_accesses,
  COUNT(DISTINCT al.accessed_by) as unique_visitors,
  COUNT(DISTINCT DATE(al.accessed_at)) as unique_access_days,
  MAX(al.accessed_at) as last_accessed,
  MIN(al.accessed_at) as first_accessed,
  -- Calculate average accesses per day
  CASE 
    WHEN MIN(al.accessed_at) IS NULL THEN 0
    ELSE COUNT(al.id) / GREATEST(EXTRACT(DAYS FROM NOW() - MIN(al.accessed_at)), 1)
  END as avg_daily_accesses,
  -- Most common access method
  MODE() WITHIN GROUP (ORDER BY al.accessed_via) as most_common_access_method
FROM public.assets a
LEFT JOIN public.organizations org ON a.organization_id = org.id
LEFT JOIN public.asset_access_logs al ON a.id = al.asset_id
GROUP BY a.id, org.id, org.name;

-- View for collection membership details
CREATE OR REPLACE VIEW public.asset_collection_membership_details AS
SELECT 
  acm.*,
  a.file_name,
  a.file_type,
  a.file_size_bytes,
  a.visibility as asset_visibility,
  a.uploaded_at as asset_uploaded_at,
  ac.name as collection_name,
  ac.slug as collection_slug,
  ac.visibility as collection_visibility,
  -- Calculate asset position in collection (if ordering is needed)
  ROW_NUMBER() OVER (PARTITION BY acm.collection_id ORDER BY acm.created_at) as collection_order
FROM public.asset_collection_memberships acm
JOIN public.assets a ON acm.asset_id = a.id
JOIN public.asset_collections ac ON acm.collection_id = ac.id;

-- Output success message
DO $$ 
BEGIN
    RAISE NOTICE 'Enhanced asset views created successfully:';
    RAISE NOTICE '- Asset details with comprehensive metadata and access analytics';
    RAISE NOTICE '- Collection details with size calculations and activity metrics';
    RAISE NOTICE '- Shared link management with expiration tracking and usage analytics';
    RAISE NOTICE '- Access analytics for performance and usage insights';
    RAISE NOTICE '- Collection membership details with organizational context';
END $$;