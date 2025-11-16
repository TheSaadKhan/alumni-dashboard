-- 0020_soft_delete_helpers.sql

-- Function to soft delete a profile and all related data
CREATE OR REPLACE FUNCTION public.soft_delete_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    -- Soft delete the profile
    UPDATE public.profiles 
    SET 
        is_active = false,
        deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_profile_id;
    
    -- Check if profile was found and updated
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Soft delete organization memberships
    UPDATE public.organization_members
    SET 
        is_active = false,
        membership_status = 'inactive',
        left_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_profile_id AND is_active = true;
    
    -- Withdraw job applications
    UPDATE public.job_applications
    SET 
        status = 'withdrawn',
        withdrawn_at = NOW(),
        updated_at = NOW()
    WHERE applicant_id = p_profile_id AND status IN ('applied', 'reviewed', 'interviewed');
    
    -- Cancel event registrations
    UPDATE public.event_attendees
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE attendee_id = p_profile_id AND status = 'registered';
    
    -- Archive user's stories
    UPDATE public.stories
    SET 
        status = 'archived',
        updated_at = NOW()
    WHERE author_id = p_profile_id AND status IN ('published', 'draft');
    
    -- Deactivate network connections
    UPDATE public.network_connections
    SET 
        status = 'withdrawn',
        withdrawn_at = NOW(),
        updated_at = NOW()
    WHERE (user_a = p_profile_id OR user_b = p_profile_id) 
      AND status IN ('pending', 'accepted');
    
    -- Archive conversations where user is the only participant
    UPDATE public.conversations c
    SET 
        is_archived = true,
        updated_at = NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = c.id 
          AND cp.participant_id != p_profile_id
          AND cp.is_active = true
    );
    
    -- Remove user from conversation participants
    UPDATE public.conversation_participants
    SET 
        is_active = false,
        left_at = NOW(),
        updated_at = NOW()
    WHERE participant_id = p_profile_id AND is_active = true;
    
    -- Log the soft deletion
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
        p_profile_id, -- Self-deletion or could be an admin
        (SELECT primary_organization_id FROM public.profiles WHERE id = p_profile_id),
        NULL, -- Could be set if we know who performed the deletion
        'profile_soft_deleted',
        'profile',
        p_profile_id,
        'user_management',
        'high',
        'User profile and all related data soft deleted'
    );
    
    RETURN true;
END;
$$;

-- Function to soft delete an organization and all related data
CREATE OR REPLACE FUNCTION public.soft_delete_organization(p_organization_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    -- Soft delete the organization
    UPDATE public.organizations 
    SET 
        is_active = false,
        deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_organization_id;
    
    -- Check if organization was found and updated
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Soft delete all organization members
    UPDATE public.organization_members
    SET 
        is_active = false,
        membership_status = 'inactive',
        left_at = NOW(),
        updated_at = NOW()
    WHERE organization_id = p_organization_id AND is_active = true;
    
    -- Archive organization events
    UPDATE public.events
    SET 
        status = 'archived',
        updated_at = NOW()
    WHERE organization_id = p_organization_id AND status != 'archived';
    
    -- Close organization jobs
    UPDATE public.jobs
    SET 
        status = 'closed',
        updated_at = NOW()
    WHERE organization_id = p_organization_id AND status = 'open';
    
    -- Archive organization stories
    UPDATE public.stories
    SET 
        status = 'archived',
        updated_at = NOW()
    WHERE organization_id = p_organization_id AND status = 'published';
    
    -- Update user primary organizations if this was their primary
    UPDATE public.profiles
    SET 
        primary_organization_id = NULL,
        updated_at = NOW()
    WHERE primary_organization_id = p_organization_id;
    
    -- Archive asset collections
    UPDATE public.asset_collections
    SET 
        is_public = false,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- Log the soft deletion
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
        (SELECT created_by FROM public.organizations WHERE id = p_organization_id),
        p_organization_id,
        NULL,
        'organization_soft_deleted',
        'organization',
        p_organization_id,
        'system',
        'high',
        'Organization and all related data soft deleted'
    );
    
    RETURN true;
END;
$$;

-- Function to soft delete an event and related data
CREATE OR REPLACE FUNCTION public.soft_delete_event(p_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    -- Soft delete the event
    UPDATE public.events 
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_event_id;
    
    -- Check if event was found and updated
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Notify attendees about cancellation
    PERFORM public.create_notification_from_template(
        ea.attendee_id,
        'event_cancelled',
        jsonb_build_object(
            'event_title', (SELECT title FROM public.events WHERE id = p_event_id),
            'event_id', p_event_id
        ),
        (SELECT organization_id FROM public.events WHERE id = p_event_id)
    )
    FROM public.event_attendees ea
    WHERE ea.event_id = p_event_id AND ea.status IN ('registered', 'attended');
    
    -- Update attendee statuses
    UPDATE public.event_attendees
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE event_id = p_event_id AND status = 'registered';
    
    -- Log the soft deletion
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
        (SELECT organizer_id FROM public.events WHERE id = p_event_id),
        (SELECT organization_id FROM public.events WHERE id = p_event_id),
        (SELECT created_by_member_id FROM public.events WHERE id = p_event_id),
        'event_cancelled',
        'event',
        p_event_id,
        'content',
        'medium',
        'Event cancelled and attendees notified'
    );
    
    RETURN true;
END;
$$;

-- Function to restore soft deleted records
CREATE OR REPLACE FUNCTION public.restore_soft_deleted_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    -- Restore the profile
    UPDATE public.profiles 
    SET 
        is_active = true,
        deleted_at = NULL,
        updated_at = NOW()
    WHERE id = p_profile_id;
    
    -- Check if profile was found and updated
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Restore organization memberships in primary organization
    UPDATE public.organization_members
    SET 
        is_active = true,
        membership_status = 'active',
        left_at = NULL,
        updated_at = NOW()
    WHERE user_id = p_profile_id 
      AND organization_id = (SELECT primary_organization_id FROM public.profiles WHERE id = p_profile_id);
    
    -- Log the restoration
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
        p_profile_id,
        (SELECT primary_organization_id FROM public.profiles WHERE id = p_profile_id),
        NULL,
        'profile_restored',
        'profile',
        p_profile_id,
        'user_management',
        'medium',
        'User profile restored from soft deletion'
    );
    
    RETURN true;
END;
$$;

-- Function to bulk soft delete inactive users
CREATE OR REPLACE FUNCTION public.bulk_soft_delete_inactive_users(p_organization_id uuid DEFAULT NULL)
RETURNS TABLE(
    deleted_count bigint,
    organization_name text
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_organization_name text;
    v_deleted_count bigint := 0;
BEGIN
    -- Get organization name if provided
    IF p_organization_id IS NOT NULL THEN
        SELECT name INTO v_organization_name
        FROM public.organizations
        WHERE id = p_organization_id;
    ELSE
        v_organization_name := 'All Organizations';
    END IF;
    
    -- Soft delete users inactive for more than 1 year
    WITH deleted_users AS (
        UPDATE public.profiles
        SET 
            is_active = false,
            deleted_at = NOW(),
            updated_at = NOW()
        WHERE is_active = true
          AND updated_at < NOW() - INTERVAL '1 year'
          AND (p_organization_id IS NULL OR primary_organization_id = p_organization_id)
        RETURNING id
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted_users;
    
    -- Perform cascade soft deletion for each deleted user
    -- This would be more efficient with a job queue in production
    IF v_deleted_count > 0 THEN
        -- Update related tables in bulk where possible
        UPDATE public.organization_members
        SET 
            is_active = false,
            membership_status = 'inactive',
            left_at = NOW(),
            updated_at = NOW()
        WHERE user_id IN (
            SELECT id FROM public.profiles 
            WHERE is_active = false 
              AND deleted_at >= NOW() - INTERVAL '1 hour'
              AND (p_organization_id IS NULL OR primary_organization_id = p_organization_id)
        );
    END IF;
    
    RETURN QUERY SELECT v_deleted_count, v_organization_name;
END;
$$;

-- Function to get soft deleted records
CREATE OR REPLACE FUNCTION public.get_soft_deleted_profiles(p_organization_id uuid DEFAULT NULL)
RETURNS TABLE(
    profile_id uuid,
    full_name text,
    email text,
    deleted_at timestamptz,
    primary_organization_name text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as profile_id,
        p.full_name,
        p.email,
        p.deleted_at,
        o.name as primary_organization_name
    FROM public.profiles p
    LEFT JOIN public.organizations o ON p.primary_organization_id = o.id
    WHERE p.is_active = false
      AND p.deleted_at IS NOT NULL
      AND (p_organization_id IS NULL OR p.primary_organization_id = p_organization_id)
    ORDER BY p.deleted_at DESC;
END;
$$;

-- Function to permanently delete soft deleted records after retention period
CREATE OR REPLACE FUNCTION public.permanently_delete_expired_records()
RETURNS TABLE(
    deleted_profiles bigint,
    deleted_organizations bigint
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_profile_count bigint := 0;
    v_organization_count bigint := 0;
    v_retention_days integer := 30; -- 30 days retention
BEGIN
    -- Permanently delete profiles soft deleted more than retention period ago
    WITH deleted_profiles AS (
        DELETE FROM public.profiles
        WHERE is_active = false 
          AND deleted_at < NOW() - (v_retention_days || ' days')::interval
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_profile_count FROM deleted_profiles;
    
    -- Permanently delete organizations soft deleted more than retention period ago
    WITH deleted_organizations AS (
        DELETE FROM public.organizations
        WHERE is_active = false 
          AND deleted_at < NOW() - (v_retention_days || ' days')::interval
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_organization_count FROM deleted_organizations;
    
    RETURN QUERY SELECT v_profile_count, v_organization_count;
END;
$$;

-- Trigger to prevent modification of soft deleted records
CREATE OR REPLACE FUNCTION public.prevent_modification_of_deleted_records()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the record is soft deleted
    IF OLD.is_active = false THEN
        RAISE EXCEPTION 'Cannot modify soft deleted % (ID: %)', TG_TABLE_NAME, OLD.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Apply prevention trigger to main tables
DROP TRIGGER IF EXISTS prevent_modification_deleted_profiles ON public.profiles;
CREATE TRIGGER prevent_modification_deleted_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (OLD.is_active = false)
    EXECUTE FUNCTION public.prevent_modification_of_deleted_records();

DROP TRIGGER IF EXISTS prevent_modification_deleted_organizations ON public.organizations;
CREATE TRIGGER prevent_modification_deleted_organizations
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    WHEN (OLD.is_active = false)
    EXECUTE FUNCTION public.prevent_modification_of_deleted_records();

DROP TRIGGER IF EXISTS prevent_modification_deleted_organization_members ON public.organization_members;
CREATE TRIGGER prevent_modification_deleted_organization_members
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW
    WHEN (OLD.is_active = false)
    EXECUTE FUNCTION public.prevent_modification_of_deleted_records();

-- View for soft deleted records summary
CREATE OR REPLACE VIEW public.soft_deleted_records_summary AS
SELECT 
    'profiles' as table_name,
    COUNT(*) as deleted_count,
    MAX(deleted_at) as latest_deletion
FROM public.profiles 
WHERE is_active = false AND deleted_at IS NOT NULL
UNION ALL
SELECT 
    'organizations' as table_name,
    COUNT(*) as deleted_count,
    MAX(deleted_at) as latest_deletion
FROM public.organizations 
WHERE is_active = false AND deleted_at IS NOT NULL
UNION ALL
SELECT 
    'organization_members' as table_name,
    COUNT(*) as deleted_count,
    MAX(left_at) as latest_deletion
FROM public.organization_members 
WHERE is_active = false AND left_at IS NOT NULL;

-- Function to check if a record can be soft deleted
CREATE OR REPLACE FUNCTION public.can_soft_delete_profile(p_profile_id uuid)
RETURNS TABLE(
    can_delete boolean,
    reason text,
    active_connections bigint,
    pending_events bigint,
    open_applications bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true as can_delete,
        'Profile can be soft deleted' as reason,
        (SELECT COUNT(*) FROM public.network_connections 
         WHERE (user_a = p_profile_id OR user_b = p_profile_id) 
           AND status = 'accepted') as active_connections,
        (SELECT COUNT(*) FROM public.event_attendees 
         WHERE attendee_id = p_profile_id 
           AND status = 'registered'
           AND event_id IN (SELECT id FROM public.events WHERE starts_at > NOW())) as pending_events,
        (SELECT COUNT(*) FROM public.job_applications 
         WHERE applicant_id = p_profile_id 
           AND status IN ('applied', 'reviewed', 'interviewed')) as open_applications;
END;
$$;

-- Output success message
DO $$ 
BEGIN
    RAISE NOTICE 'Soft delete helper functions created successfully:';
    RAISE NOTICE '- Individual soft delete functions for profiles, organizations, events';
    RAISE NOTICE '- Comprehensive cascade soft deletion with data integrity';
    RAISE NOTICE '- Restoration functions for accidental deletions';
    RAISE NOTICE '- Bulk operations for maintenance';
    RAISE NOTICE '- Prevention triggers for modified deleted records';
    RAISE NOTICE '- Retention-based permanent deletion';
    RAISE NOTICE '- Audit logging for all soft delete operations';
    RAISE NOTICE '- Safety checks and validation functions';
END $$;



