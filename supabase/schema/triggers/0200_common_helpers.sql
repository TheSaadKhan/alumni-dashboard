-- 0017_utility_functions.sql

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle soft deletes
CREATE OR REPLACE FUNCTION public.soft_delete_record()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_active = false;
    NEW.updated_at = NOW();
    
    -- Set deleted_at timestamp if the column exists
    IF TG_TABLE_NAME = 'profiles' THEN
        NEW.deleted_at = NOW();
    ELSIF TG_TABLE_NAME = 'organizations' THEN
        NEW.deleted_at = NOW();
    ELSIF TG_TABLE_NAME = 'organization_members' THEN
        NEW.membership_status = 'inactive';
        NEW.left_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique slugs
CREATE OR REPLACE FUNCTION public.generate_slug(
    p_text text,
    p_table_name text,
    p_organization_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_slug text;
    v_counter integer := 1;
    v_base_slug text;
    v_exists boolean;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special chars
    v_base_slug := LOWER(REGEXP_REPLACE(p_text, '[^a-zA-Z0-9\s]', '', 'g'));
    v_base_slug := REGEXP_REPLACE(v_base_slug, '\s+', '-', 'g');
    v_base_slug := SUBSTRING(v_base_slug FROM 1 FOR 100); -- Limit length
    
    v_slug := v_base_slug;
    
    -- Check for uniqueness
    CASE p_table_name
        WHEN 'organizations' THEN
            SELECT EXISTS(SELECT 1 FROM public.organizations WHERE slug = v_slug) INTO v_exists;
        WHEN 'stories' THEN
            SELECT EXISTS(SELECT 1 FROM public.stories WHERE slug = v_slug) INTO v_exists;
        WHEN 'asset_collections' THEN
            SELECT EXISTS(SELECT 1 FROM public.asset_collections WHERE slug = v_slug AND organization_id = p_organization_id) INTO v_exists;
        ELSE
            v_exists := false;
    END CASE;
    
    -- Append counter if slug exists
    WHILE v_exists LOOP
        v_slug := v_base_slug || '-' || v_counter;
        v_counter := v_counter + 1;
        
        CASE p_table_name
            WHEN 'organizations' THEN
                SELECT EXISTS(SELECT 1 FROM public.organizations WHERE slug = v_slug) INTO v_exists;
            WHEN 'stories' THEN
                SELECT EXISTS(SELECT 1 FROM public.stories WHERE slug = v_slug) INTO v_exists;
            WHEN 'asset_collections' THEN
                SELECT EXISTS(SELECT 1 FROM public.asset_collections WHERE slug = v_slug AND organization_id = p_organization_id) INTO v_exists;
            ELSE
                v_exists := false;
        END CASE;
    END LOOP;
    
    RETURN v_slug;
END;
$$;

-- Function to validate email domain for organization
CREATE OR REPLACE FUNCTION public.validate_organization_email(
    p_email text,
    p_organization_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_allowed_domains jsonb;
    v_email_domain text;
BEGIN
    -- Extract domain from email
    v_email_domain := SPLIT_PART(p_email, '@', 2);
    
    -- Get allowed domains from organization settings
    SELECT settings->'allowed_domains' INTO v_allowed_domains
    FROM public.organization_settings
    WHERE organization_id = p_organization_id;
    
    -- If no domains are restricted, allow any email
    IF v_allowed_domains IS NULL OR jsonb_array_length(v_allowed_domains) = 0 THEN
        RETURN true;
    END IF;
    
    -- Check if email domain is in allowed domains
    RETURN v_allowed_domains ? v_email_domain;
END;
$$;

-- Function to cascade organization deletion
CREATE OR REPLACE FUNCTION public.cascade_organization_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Soft delete related records when organization is soft deleted
    IF NEW.is_active = false AND OLD.is_active = true THEN
        -- Soft delete organization members
        UPDATE public.organization_members
        SET is_active = false, membership_status = 'inactive', left_at = NOW()
        WHERE organization_id = NEW.id AND is_active = true;
        
        -- Archive organization events
        UPDATE public.events
        SET status = 'archived', updated_at = NOW()
        WHERE organization_id = NEW.id AND status != 'archived';
        
        -- Close organization jobs
        UPDATE public.jobs
        SET status = 'closed', updated_at = NOW()
        WHERE organization_id = NEW.id AND status = 'open';
        
        -- Archive organization stories
        UPDATE public.stories
        SET status = 'archived', updated_at = NOW()
        WHERE organization_id = NEW.id AND status = 'published';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function to handle user role changes
CREATE OR REPLACE FUNCTION public.handle_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_role_name text;
    v_new_role_name text;
BEGIN
    -- Get role names
    SELECT name INTO v_old_role_name
    FROM public.organization_roles
    WHERE id = OLD.role_id;
    
    SELECT name INTO v_new_role_name
    FROM public.organization_roles
    WHERE id = NEW.role_id;
    
    -- Log role change in audit logs
    IF v_old_role_name != v_new_role_name THEN
        INSERT INTO public.admin_audit_logs (
            admin_user_id,
            organization_id,
            admin_member_id,
            action,
            resource_type,
            resource_id,
            action_category,
            action_severity,
            change_summary
        ) VALUES (
            NEW.user_id,
            NEW.organization_id,
            NEW.id,
            'role_change',
            'organization_member',
            NEW.id,
            'user_management',
            'medium',
            'Role changed from ' || v_old_role_name || ' to ' || v_new_role_name
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function to check permission for actions
CREATE OR REPLACE FUNCTION public.check_permission(
    p_user_id uuid,
    p_organization_id uuid,
    p_permission_name text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_member_record RECORD;
    v_role_permissions jsonb;
BEGIN
    -- Get user's organization membership and role
    SELECT om.*, r.permissions
    INTO v_member_record
    FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = p_user_id 
      AND om.organization_id = p_organization_id
      AND om.is_active = true;
    
    -- Return false if user is not an active member
    IF v_member_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if permission exists in role permissions
    v_role_permissions := v_member_record.permissions;
    
    RETURN COALESCE((v_role_permissions ->> p_permission_name)::boolean, false);
END;
$$;

-- Function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations(p_user_id uuid)
RETURNS TABLE(
    organization_id uuid,
    organization_name text,
    organization_slug text,
    user_role text,
    user_title text,
    user_department text,
    membership_status text,
    is_primary boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as organization_id,
        o.name as organization_name,
        o.slug as organization_slug,
        r.display_name as user_role,
        om.title as user_title,
        om.department as user_department,
        om.membership_status,
        (p.primary_organization_id = o.id) as is_primary
    FROM public.organization_members om
    JOIN public.organizations o ON om.organization_id = o.id
    JOIN public.organization_roles r ON om.role_id = r.id
    JOIN public.profiles p ON om.user_id = p.id
    WHERE om.user_id = p_user_id
      AND om.is_active = true
      AND o.is_active = true
    ORDER BY is_primary DESC, o.name ASC;
END;
$$;

-- Function to transfer organization ownership
CREATE OR REPLACE FUNCTION public.transfer_organization_ownership(
    p_organization_id uuid,
    p_current_owner_id uuid,
    p_new_owner_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_super_admin_role_id uuid;
    v_current_owner_member_id uuid;
    v_new_owner_member_id uuid;
BEGIN
    -- Get super admin role ID
    SELECT id INTO v_super_admin_role_id
    FROM public.organization_roles
    WHERE organization_id = p_organization_id AND name = 'super_admin';
    
    -- Get current owner member ID
    SELECT id INTO v_current_owner_member_id
    FROM public.organization_members
    WHERE organization_id = p_organization_id 
      AND user_id = p_current_owner_id
      AND role_id = v_super_admin_role_id;
    
    -- Get new owner member ID
    SELECT id INTO v_new_owner_member_id
    FROM public.organization_members
    WHERE organization_id = p_organization_id 
      AND user_id = p_new_owner_id;
    
    -- Validate inputs
    IF v_super_admin_role_id IS NULL OR 
       v_current_owner_member_id IS NULL OR 
       v_new_owner_member_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update current owner to sub_admin role
    UPDATE public.organization_members
    SET role_id = (
        SELECT id FROM public.organization_roles 
        WHERE organization_id = p_organization_id AND name = 'sub_admin'
    ),
    updated_at = NOW()
    WHERE id = v_current_owner_member_id;
    
    -- Update new owner to super_admin role
    UPDATE public.organization_members
    SET role_id = v_super_admin_role_id,
    updated_at = NOW()
    WHERE id = v_new_owner_member_id;
    
    -- Update organization created_by reference
    UPDATE public.organizations
    SET created_by = p_new_owner_id,
    updated_at = NOW()
    WHERE id = p_organization_id;
    
    RETURN true;
END;
$$;

-- Function to cleanup inactive data
CREATE OR REPLACE FUNCTION public.cleanup_inactive_data()
RETURNS TABLE(
    deleted_organizations bigint,
    deleted_members bigint,
    archived_events bigint,
    closed_jobs bigint
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_org_count bigint;
    v_member_count bigint;
    v_event_count bigint;
    v_job_count bigint;
BEGIN
    -- Soft delete organizations inactive for more than 1 year
    WITH deleted_orgs AS (
        UPDATE public.organizations
        SET is_active = false, updated_at = NOW()
        WHERE is_active = true 
          AND updated_at < NOW() - INTERVAL '1 year'
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_org_count FROM deleted_orgs;
    
    -- Remove members from organizations that are inactive
    WITH deleted_members AS (
        UPDATE public.organization_members
        SET is_active = false, membership_status = 'inactive', left_at = NOW()
        WHERE is_active = true 
          AND organization_id IN (
              SELECT id FROM public.organizations WHERE is_active = false
          )
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_member_count FROM deleted_members;
    
    -- Archive old events
    WITH archived_events AS (
        UPDATE public.events
        SET status = 'archived', updated_at = NOW()
        WHERE status = 'published'
          AND ends_at < NOW() - INTERVAL '6 months'
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_event_count FROM archived_events;
    
    -- Close old job postings
    WITH closed_jobs AS (
        UPDATE public.jobs
        SET status = 'closed', updated_at = NOW()
        WHERE status = 'open'
          AND created_at < NOW() - INTERVAL '3 months'
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_job_count FROM closed_jobs;
    
    RETURN QUERY SELECT v_org_count, v_member_count, v_event_count, v_job_count;
END;
$$;

-- Function to get organization hierarchy
CREATE OR REPLACE FUNCTION public.get_organization_hierarchy(p_organization_id uuid)
RETURNS TABLE(
    member_id uuid,
    user_id uuid,
    full_name text,
    email text,
    role_name text,
    role_display text,
    hierarchy_level integer,
    reports_to uuid,
    reports_to_name text,
    title text,
    department text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        om.id as member_id,
        p.id as user_id,
        p.full_name,
        p.email,
        r.name as role_name,
        r.display_name as role_display,
        r.hierarchy_level,
        om.reports_to,
        reporter_p.full_name as reports_to_name,
        om.title,
        om.department
    FROM public.organization_members om
    JOIN public.profiles p ON om.user_id = p.id
    JOIN public.organization_roles r ON om.role_id = r.id
    LEFT JOIN public.organization_members reporter ON om.reports_to = reporter.id
    LEFT JOIN public.profiles reporter_p ON reporter.user_id = reporter_p.id
    WHERE om.organization_id = p_organization_id
      AND om.is_active = true
    ORDER BY r.hierarchy_level ASC, p.full_name ASC;
END;
$$;

-- Function to validate event capacity
CREATE OR REPLACE FUNCTION public.validate_event_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_attendees integer;
    v_event_capacity integer;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get event capacity and current attendee count
        SELECT capacity, COUNT(*) 
        INTO v_event_capacity, v_current_attendees
        FROM public.events e
        LEFT JOIN public.event_attendees ea ON e.id = ea.event_id AND ea.status IN ('registered', 'attended')
        WHERE e.id = NEW.event_id
        GROUP BY e.id, e.capacity;
        
        -- Check if event is at capacity
        IF v_event_capacity IS NOT NULL AND v_current_attendees >= v_event_capacity THEN
            RAISE EXCEPTION 'Event is at capacity';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function for organization slug generation
CREATE OR REPLACE FUNCTION public.generate_slug_from_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.slug := public.generate_slug(NEW.name, 'organizations');
    RETURN NEW;
END;
$$;

-- Function for story slug generation
CREATE OR REPLACE FUNCTION public.generate_story_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.generate_slug(NEW.title, 'stories');
    END IF;
    RETURN NEW;
END;
$$;

-- Create triggers for utility functions

-- Organization deletion cascade trigger
DROP TRIGGER IF EXISTS organization_deletion_cascade ON public.organizations;
CREATE TRIGGER organization_deletion_cascade
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    WHEN (OLD.is_active = true AND NEW.is_active = false)
    EXECUTE FUNCTION public.cascade_organization_deletion();

-- Role change audit trigger
DROP TRIGGER IF EXISTS role_change_audit ON public.organization_members;
CREATE TRIGGER role_change_audit
    AFTER UPDATE ON public.organization_members
    FOR EACH ROW
    WHEN (OLD.role_id IS DISTINCT FROM NEW.role_id)
    EXECUTE FUNCTION public.handle_role_change();

-- Event capacity validation trigger
DROP TRIGGER IF EXISTS event_capacity_validation ON public.event_attendees;
CREATE TRIGGER event_capacity_validation
    BEFORE INSERT ON public.event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_event_capacity();

-- Slug generation triggers
DROP TRIGGER IF EXISTS generate_organization_slug ON public.organizations;
CREATE TRIGGER generate_organization_slug
    BEFORE INSERT ON public.organizations
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION public.generate_slug_from_name();

DROP TRIGGER IF EXISTS generate_story_slug ON public.stories;
CREATE TRIGGER generate_story_slug
    BEFORE INSERT ON public.stories
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_story_slug();

-- Output success message
DO $$ 
BEGIN
    RAISE NOTICE 'Utility functions and triggers created successfully:';
    RAISE NOTICE '- Enhanced updated_at and soft delete functions';
    RAISE NOTICE '- Slug generation and validation';
    RAISE NOTICE '- Permission checking and role management';
    RAISE NOTICE '- Organization hierarchy and ownership transfer';
    RAISE NOTICE '- Data cleanup and maintenance functions';
    RAISE NOTICE '- Comprehensive trigger system';
END $$;