-- Updated_at triggers for assets (already covered in previous comprehensive script)
-- These are included for completeness but are redundant with the previous script

-- Function to automatically set organization context for assets
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

-- Create trigger for asset organization context
DROP TRIGGER IF EXISTS set_asset_organization_trigger ON public.assets;
CREATE TRIGGER set_asset_organization_trigger
  BEFORE INSERT ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_asset_organization();

-- Function to automatically set organization context for asset collections
CREATE OR REPLACE FUNCTION public.set_asset_collection_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set created_by_member_id if organization is found and created_by is provided
  IF NEW.created_by_member_id IS NULL AND NEW.organization_id IS NOT NULL AND NEW.created_by IS NOT NULL THEN
    SELECT om.id INTO NEW.created_by_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.created_by 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Generate slug from name if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.name, 'asset_collections', NEW.organization_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for asset collection organization context
DROP TRIGGER IF EXISTS set_asset_collection_organization_trigger ON public.asset_collections;
CREATE TRIGGER set_asset_collection_organization_trigger
  BEFORE INSERT ON public.asset_collections
  FOR EACH ROW EXECUTE FUNCTION public.set_asset_collection_organization();

-- Function to automatically set organization context for asset shared links
CREATE OR REPLACE FUNCTION public.set_asset_shared_link_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from asset if not provided
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.assets
    WHERE id = NEW.asset_id;
  END IF;
  
  -- Set created_by_member_id if organization is found
  IF NEW.organization_id IS NOT NULL AND NEW.created_by IS NOT NULL THEN
    SELECT om.id INTO NEW.created_by_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.created_by 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Generate unique token if not provided
  IF NEW.token IS NULL THEN
    NEW.token := encode(gen_random_bytes(16), 'hex');
  END IF;
  
  -- Set default expiration if not provided (30 days from now)
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '30 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for asset shared link organization context
DROP TRIGGER IF EXISTS set_asset_shared_link_organization_trigger ON public.asset_shared_links;
CREATE TRIGGER set_asset_shared_link_organization_trigger
  BEFORE INSERT ON public.asset_shared_links
  FOR EACH ROW EXECUTE FUNCTION public.set_asset_shared_link_organization();

-- Function to log asset access
CREATE OR REPLACE FUNCTION public.log_asset_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access when asset is viewed via shared link
  IF TG_OP = 'INSERT' AND NEW.accessed_via = 'shared_link' THEN
    INSERT INTO public.asset_access_logs (
      asset_id,
      organization_id,
      accessed_by,
      accessed_via,
      shared_link_id,
      ip_address,
      user_agent
    ) VALUES (
      NEW.asset_id,
      NEW.organization_id,
      NEW.accessed_by,
      NEW.accessed_via,
      NEW.id, -- This is the shared link ID
      NEW.ip_address,
      NEW.user_agent
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for asset access logging
DROP TRIGGER IF EXISTS log_asset_access_trigger ON public.asset_shared_links;
CREATE TRIGGER log_asset_access_trigger
  AFTER UPDATE OF access_count ON public.asset_shared_links
  FOR EACH ROW
  WHEN (OLD.access_count IS DISTINCT FROM NEW.access_count)
  EXECUTE FUNCTION public.log_asset_access();

-- Function to update asset collection statistics
CREATE OR REPLACE FUNCTION public.update_asset_collection_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'asset_collection_memberships' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.asset_collections
      SET 
        asset_count = asset_count + 1,
        updated_at = NOW()
      WHERE id = NEW.collection_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.asset_collections
      SET 
        asset_count = asset_count - 1,
        updated_at = NOW()
      WHERE id = OLD.collection_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for asset collection statistics
DROP TRIGGER IF EXISTS update_asset_collection_stats_insert_trigger ON public.asset_collection_memberships;
CREATE TRIGGER update_asset_collection_stats_insert_trigger
  AFTER INSERT ON public.asset_collection_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_asset_collection_stats();

DROP TRIGGER IF EXISTS update_asset_collection_stats_delete_trigger ON public.asset_collection_memberships;
CREATE TRIGGER update_asset_collection_stats_delete_trigger
  AFTER DELETE ON public.asset_collection_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_asset_collection_stats();

-- Output success message
DO $$ 
BEGIN
    RAISE NOTICE 'Asset triggers and functions created successfully:';
    RAISE NOTICE '- Organization context automation for assets, collections, and shared links';
    RAISE NOTICE '- File metadata extraction (extension, bucket names)';
    RAISE NOTICE '- Shared link token generation and expiration management';
    RAISE NOTICE '- Asset access logging for analytics';
    RAISE NOTICE '- Collection statistics automation';
    RAISE NOTICE '- Slug generation for asset collections';
END $$;