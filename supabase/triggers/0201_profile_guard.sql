-- 0018_profile_triggers.sql

-- Profile update triggers (Enhanced for organization system)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced email synchronization with organization context
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Update auth user email if profile email changes
    IF NEW.email <> OLD.email THEN
        UPDATE auth.users 
        SET email = NEW.email 
        WHERE id = NEW.auth_user_id;
        
        -- Update email in organization members if user is a member
        UPDATE public.organization_members om
        SET updated_at = NOW()
        WHERE om.user_id = NEW.id;
        
        -- Log email change in audit logs for security
        INSERT INTO public.admin_audit_logs (
            admin_user_id,
            organization_id,
            admin_member_id,
            action,
            resource_type,
            resource_id,
            action_category,
            action_severity,
            change_summary,
            before_snapshot,
            after_snapshot
        ) VALUES (
            NEW.id,
            NEW.primary_organization_id,
            (SELECT id FROM public.organization_members WHERE user_id = NEW.id AND organization_id = NEW.primary_organization_id LIMIT 1),
            'email_change',
            'profile',
            NEW.id,
            'security',
            'medium',
            'User changed email address',
            jsonb_build_object('old_email', OLD.email),
            jsonb_build_object('new_email', NEW.email)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profile_email_trigger ON public.profiles;
CREATE TRIGGER sync_profile_email_trigger
    AFTER UPDATE OF email ON public.profiles
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.sync_profile_email();

-- Trigger to maintain organization member data consistency
CREATE OR REPLACE FUNCTION public.sync_organization_member_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- When profile name or email changes, update organization member references
    IF NEW.full_name <> OLD.full_name OR NEW.email <> OLD.email THEN
        UPDATE public.organization_members
        SET updated_at = NOW()
        WHERE user_id = NEW.id AND is_active = true;
    END IF;
    
    -- When primary organization changes, update member status
    IF NEW.primary_organization_id IS DISTINCT FROM OLD.primary_organization_id THEN
        -- Deactivate members in old organization
        UPDATE public.organization_members
        SET 
            is_active = false,
            membership_status = 'inactive',
            left_at = NOW(),
            updated_at = NOW()
        WHERE user_id = NEW.id 
          AND organization_id = OLD.primary_organization_id
          AND is_active = true;
        
        -- Activate or create member in new organization
        INSERT INTO public.organization_members (
            organization_id,
            user_id,
            role_id,
            title,
            is_active,
            is_verified,
            membership_status,
            created_at,
            updated_at
        )
        SELECT 
            NEW.primary_organization_id,
            NEW.id,
            (SELECT id FROM public.organization_roles 
             WHERE organization_id = NEW.primary_organization_id AND name = 'alumni' 
             LIMIT 1),
            COALESCE(NEW.headline, 'Member'),
            true,
            NEW.is_verified,
            'active',
            NOW(),
            NOW()
        ON CONFLICT (organization_id, user_id) 
        DO UPDATE SET
            is_active = true,
            membership_status = 'active',
            left_at = NULL,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_organization_member_profile_trigger ON public.profiles;
CREATE TRIGGER sync_organization_member_profile_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (
        OLD.full_name IS DISTINCT FROM NEW.full_name OR
        OLD.email IS DISTINCT FROM NEW.email OR
        OLD.primary_organization_id IS DISTINCT FROM NEW.primary_organization_id OR
        OLD.is_verified IS DISTINCT FROM NEW.is_verified
    )
    EXECUTE FUNCTION public.sync_organization_member_profile();

-- Trigger to handle user soft deletion cascade
CREATE OR REPLACE FUNCTION public.handle_user_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = false AND OLD.is_active = true THEN
        -- Soft delete all organization memberships
        UPDATE public.organization_members
        SET 
            is_active = false,
            membership_status = 'inactive',
            left_at = NOW(),
            updated_at = NOW()
        WHERE user_id = NEW.id AND is_active = true;
        
        -- Withdraw all pending job applications
        UPDATE public.job_applications
        SET 
            status = 'withdrawn',
            withdrawn_at = NOW(),
            updated_at = NOW()
        WHERE applicant_id = NEW.id AND status IN ('applied', 'reviewed');
        
        -- Cancel all event registrations
        UPDATE public.event_attendees
        SET 
            status = 'cancelled',
            updated_at = NOW()
        WHERE attendee_id = NEW.id AND status = 'registered';
        
        -- Archive user's stories
        UPDATE public.stories
        SET 
            status = 'archived',
            updated_at = NOW()
        WHERE author_id = NEW.id AND status = 'published';
        
        -- Log user deactivation
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
            NEW.id,
            NEW.primary_organization_id,
            (SELECT id FROM public.organization_members WHERE user_id = NEW.id AND organization_id = NEW.primary_organization_id LIMIT 1),
            'user_deactivated',
            'profile',
            NEW.id,
            'user_management',
            'medium',
            'User account deactivated'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_user_soft_delete_trigger ON public.profiles;
CREATE TRIGGER handle_user_soft_delete_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (OLD.is_active = true AND NEW.is_active = false)
    EXECUTE FUNCTION public.handle_user_soft_delete();

-- Trigger to validate profile data integrity
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate email format
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format: %', NEW.email;
    END IF;
    
    -- Validate graduation year range
    IF NEW.graduation_year IS NOT NULL AND (
        NEW.graduation_year < 1900 OR NEW.graduation_year > EXTRACT(YEAR FROM NOW()) + 5
    ) THEN
        RAISE EXCEPTION 'Graduation year must be between 1900 and %', EXTRACT(YEAR FROM NOW()) + 5;
    END IF;
    
    -- Validate primary organization exists and is active
    IF NEW.primary_organization_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id = NEW.primary_organization_id AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Primary organization does not exist or is not active';
        END IF;
    END IF;
    
    -- Validate user_type is valid
    IF NEW.user_type IS NOT NULL AND NEW.user_type NOT IN (
        'alumni', 'student', 'faculty', 'staff', 'admin', 'employee'
    ) THEN
        RAISE EXCEPTION 'Invalid user type: %', NEW.user_type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_profile_data_trigger ON public.profiles;
CREATE TRIGGER validate_profile_data_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_profile_data();

-- Trigger to automatically create user settings
CREATE OR REPLACE FUNCTION public.create_user_settings_on_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default user settings when a new profile is created
    INSERT INTO public.user_settings (
        user_id,
        organization_id,
        user_member_id,
        preferences,
        created_at,
        updated_at
    )
    SELECT 
        NEW.id,
        NEW.primary_organization_id,
        om.id,
        '{
            "privacy": {
                "profile_visibility": "public",
                "email_visibility": "organization_only",
                "connections_visibility": "mutual"
            },
            "communication": {
                "email_frequency": "immediate",
                "push_notifications": true
            }
        }'::jsonb,
        NOW(),
        NOW()
    FROM public.organization_members om
    WHERE om.user_id = NEW.id 
      AND om.organization_id = NEW.primary_organization_id
      AND om.is_active = true
    LIMIT 1
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_user_settings_on_profile_trigger ON public.profiles;
CREATE TRIGGER create_user_settings_on_profile_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_settings_on_profile();

-- Trigger to update search vectors for full-text search
CREATE OR REPLACE FUNCTION public.update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the search vector for full-text search
    NEW.search_vector := 
        SETWEIGHT(TO_TSVECTOR('english', COALESCE(NEW.full_name, '')), 'A') ||
        SETWEIGHT(TO_TSVECTOR('english', COALESCE(NEW.headline, '')), 'B') ||
        SETWEIGHT(TO_TSVECTOR('english', COALESCE(NEW.bio, '')), 'C') ||
        SETWEIGHT(TO_TSVECTOR('english', COALESCE(NEW.location, '')), 'D') ||
        SETWEIGHT(TO_TSVECTOR('english', COALESCE(NEW.skills::text, '')), 'D');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add search_vector column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN search_vector TSVECTOR;
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_profile_search_vector_trigger ON public.profiles;
CREATE TRIGGER update_profile_search_vector_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (
        OLD.full_name IS DISTINCT FROM NEW.full_name OR
        OLD.headline IS DISTINCT FROM NEW.headline OR
        OLD.bio IS DISTINCT FROM NEW.bio OR
        OLD.location IS DISTINCT FROM NEW.location OR
        OLD.skills IS DISTINCT FROM NEW.skills
    )
    EXECUTE FUNCTION public.update_profile_search_vector();

-- Create index for search vector
DROP INDEX IF EXISTS idx_profiles_search_vector;
CREATE INDEX CONCURRENTLY idx_profiles_search_vector 
ON public.profiles USING GIN (search_vector);

-- Trigger to maintain user activity tracking
CREATE OR REPLACE FUNCTION public.update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_activity_at in user settings when user performs actions
    UPDATE public.user_settings
    SET 
        last_accessed_at = NOW(),
        updated_at = NOW()
    WHERE user_id = NEW.actor_id OR user_id = NEW.sender_id OR user_id = NEW.attendee_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply activity tracking to relevant tables
DROP TRIGGER IF EXISTS update_user_last_active_analytics ON public.analytics_events;
CREATE TRIGGER update_user_last_active_analytics
    AFTER INSERT ON public.analytics_events
    FOR EACH ROW
    WHEN (NEW.actor_id IS NOT NULL)
    EXECUTE FUNCTION public.update_user_last_active();

DROP TRIGGER IF EXISTS update_user_last_active_messages ON public.messages;
CREATE TRIGGER update_user_last_active_messages
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_last_active();

DROP TRIGGER IF EXISTS update_user_last_active_event_attendees ON public.event_attendees;
CREATE TRIGGER update_user_last_active_event_attendees
    AFTER INSERT ON public.event_attendees
    FOR EACH ROW
    WHEN (NEW.attendee_id IS NOT NULL)
    EXECUTE FUNCTION public.update_user_last_active();

-- Function to get user's complete profile with organization context
CREATE OR REPLACE FUNCTION public.get_user_profile_with_context(p_user_id uuid)
RETURNS TABLE(
    user_id uuid,
    email text,
    full_name text,
    headline text,
    bio text,
    location text,
    graduation_year integer,
    skills jsonb,
    user_type text,
    primary_organization_id uuid,
    primary_organization_name text,
    organization_role text,
    organization_title text,
    organization_department text,
    member_since timestamptz,
    is_verified boolean,
    is_active boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.email,
        p.full_name,
        p.headline,
        p.bio,
        p.location,
        p.graduation_year,
        p.skills,
        p.user_type,
        p.primary_organization_id,
        o.name as primary_organization_name,
        r.display_name as organization_role,
        om.title as organization_title,
        om.department as organization_department,
        om.created_at as member_since,
        p.is_verified,
        p.is_active
    FROM public.profiles p
    LEFT JOIN public.organizations o ON p.primary_organization_id = o.id
    LEFT JOIN public.organization_members om ON om.user_id = p.id AND om.organization_id = p.primary_organization_id AND om.is_active = true
    LEFT JOIN public.organization_roles r ON om.role_id = r.id
    WHERE p.id = p_user_id;
END;
$$;

-- Output success message
DO $$ 
BEGIN
    RAISE NOTICE 'Profile triggers and functions created successfully:';
    RAISE NOTICE '- Enhanced email synchronization with audit logging';
    RAISE NOTICE '- Organization member data consistency triggers';
    RAISE NOTICE '- Comprehensive user soft deletion cascade';
    RAISE NOTICE '- Data validation and integrity checks';
    RAISE NOTICE '- Automatic user settings creation';
    RAISE NOTICE '- Full-text search support with search vectors';
    RAISE NOTICE '- User activity tracking system';
    RAISE NOTICE '- Profile context retrieval function';
END $$;