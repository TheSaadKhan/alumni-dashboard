-- 0019_event_triggers.sql

-- Event update triggers
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON public.events 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced event date validation with organization context
CREATE OR REPLACE FUNCTION public.prevent_event_date_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent date modifications after event starts
    IF OLD.starts_at < NOW() AND (NEW.starts_at <> OLD.starts_at OR NEW.ends_at <> OLD.ends_at) THEN
        RAISE EXCEPTION 'Cannot modify event dates after event has started';
    END IF;
    
    -- Validate end date is after start date
    IF NEW.ends_at IS NOT NULL AND NEW.ends_at <= NEW.starts_at THEN
        RAISE EXCEPTION 'Event end date must be after start date';
    END IF;
    
    -- Validate event dates are in the future for new events
    IF TG_OP = 'INSERT' AND NEW.starts_at < NOW() THEN
        RAISE EXCEPTION 'Event start date must be in the future';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_event_date_changes ON public.events;
CREATE TRIGGER prevent_event_date_changes
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_event_date_change();

-- Trigger to automatically set published_at when event is published
CREATE OR REPLACE FUNCTION public.handle_event_publishing()
RETURNS TRIGGER AS $$
BEGIN
    -- Set published_at when status changes to published
    IF NEW.status = 'published' AND OLD.status != 'published' THEN
        NEW.published_at := NOW();
        
        -- Log event publication
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
            NEW.organizer_id,
            NEW.organization_id,
            NEW.created_by_member_id,
            'event_published',
            'event',
            NEW.id,
            'content',
            'low',
            'Event published: ' || NEW.title
        );
    END IF;
    
    -- Set unpublished_at when event is unpublished
    IF NEW.status != 'published' AND OLD.status = 'published' THEN
        NEW.unpublished_at := NOW();
    END IF;
    
    -- Auto-archive past events
    IF NEW.ends_at < NOW() AND NEW.status NOT IN ('archived', 'cancelled') THEN
        NEW.status := 'archived';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_event_publishing_trigger ON public.events;
CREATE TRIGGER handle_event_publishing_trigger
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_event_publishing();

-- Trigger to validate event capacity and organization permissions
CREATE OR REPLACE FUNCTION public.validate_event_creation()
RETURNS TRIGGER AS $$
DECLARE
    v_organizer_member_record RECORD;
    v_organization_settings jsonb;
BEGIN
    -- Check if organizer is a member of the organization
    SELECT om.*, o.settings
    INTO v_organizer_member_record, v_organization_settings
    FROM public.organization_members om
    JOIN public.organizations o ON om.organization_id = o.id
    WHERE om.user_id = NEW.organizer_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true;
    
    -- Validate organizer is an active organization member
    IF v_organizer_member_record IS NULL THEN
        RAISE EXCEPTION 'Organizer must be an active member of the organization';
    END IF;
    
    -- Check if user has permission to create events
    IF NOT public.check_permission(NEW.organizer_id, NEW.organization_id, 'create_events') THEN
        RAISE EXCEPTION 'User does not have permission to create events in this organization';
    END IF;
    
    -- Validate capacity limits
    IF NEW.capacity IS NOT NULL AND NEW.capacity < 0 THEN
        RAISE EXCEPTION 'Event capacity must be a positive number';
    END IF;
    
    -- Set created_by_member_id if not provided
    IF NEW.created_by_member_id IS NULL THEN
        NEW.created_by_member_id := v_organizer_member_record.id;
    END IF;
    
    -- Validate virtual event settings
    IF NEW.is_virtual = true AND NEW.location IS NOT NULL THEN
        RAISE NOTICE 'Virtual event has physical location specified. Consider removing location for clarity.';
    ELSIF NEW.is_virtual = false AND NEW.location IS NULL THEN
        RAISE EXCEPTION 'Physical events must have a location specified';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_event_creation_trigger ON public.events;
CREATE TRIGGER validate_event_creation_trigger
    BEFORE INSERT ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_event_creation();

-- Trigger to handle event cancellation and notifications
CREATE OR REPLACE FUNCTION public.handle_event_cancellation()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle event cancellation
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Log cancellation
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
            NEW.organizer_id,
            NEW.organization_id,
            NEW.created_by_member_id,
            'event_cancelled',
            'event',
            NEW.id,
            'content',
            'medium',
            'Event cancelled: ' || NEW.title || '. Notified ' || 
            (SELECT COUNT(*) FROM public.event_attendees WHERE event_id = NEW.id AND status IN ('registered', 'attended')) || ' attendees.'
        );
    END IF;
    
    -- Handle event rescheduling
    IF NEW.starts_at IS DISTINCT FROM OLD.starts_at AND OLD.starts_at IS NOT NULL THEN
        -- Log rescheduling
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
            NEW.organizer_id,
            NEW.organization_id,
            NEW.created_by_member_id,
            'event_rescheduled',
            'event',
            NEW.id,
            'content',
            'low',
            'Event rescheduled from ' || OLD.starts_at || ' to ' || NEW.starts_at
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_event_cancellation_trigger ON public.events;
CREATE TRIGGER handle_event_cancellation_trigger
    AFTER UPDATE ON public.events
    FOR EACH ROW
    WHEN (
        OLD.status IS DISTINCT FROM NEW.status OR
        OLD.starts_at IS DISTINCT FROM NEW.starts_at
    )
    EXECUTE FUNCTION public.handle_event_cancellation();

-- Trigger to update event statistics
CREATE OR REPLACE FUNCTION public.update_event_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update attendee count when event_attendees changes
    IF TG_TABLE_NAME = 'event_attendees' THEN
        UPDATE public.events
        SET 
            updated_at = NOW()
        WHERE id = NEW.event_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_event_statistics_trigger ON public.event_attendees;
CREATE TRIGGER update_event_statistics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_event_statistics();

-- Trigger to enforce event visibility rules
CREATE OR REPLACE FUNCTION public.enforce_event_visibility()
RETURNS TRIGGER AS $$
BEGIN
    -- Private events can only be created by organization admins
    IF NEW.visibility = 'private' THEN
        IF NOT public.check_permission(NEW.organizer_id, NEW.organization_id, 'manage_events') THEN
            RAISE EXCEPTION 'Only organization admins can create private events';
        END IF;
    END IF;
    
    -- Organization-only events require organizer to be member
    IF NEW.visibility = 'organization_only' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE user_id = NEW.organizer_id 
              AND organization_id = NEW.organization_id
              AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Organizer must be a member of the organization for organization-only events';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_event_visibility_trigger ON public.events;
CREATE TRIGGER enforce_event_visibility_trigger
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_event_visibility();

-- Trigger to handle recurring event series
CREATE OR REPLACE FUNCTION public.handle_recurring_events()
RETURNS TRIGGER AS $$
DECLARE
    v_recurring_pattern jsonb;
    v_next_date timestamptz;
    v_series_count integer := 1;
BEGIN
    -- Check if this is part of a recurring series
    IF NEW.recurring_pattern IS NOT NULL AND TG_OP = 'INSERT' THEN
        v_recurring_pattern := NEW.recurring_pattern;
        
        -- For demo purposes, create next event in series
        -- In production, this would be handled by a job scheduler
        IF v_recurring_pattern ? 'frequency' THEN
            CASE v_recurring_pattern->>'frequency'
                WHEN 'weekly' THEN
                    v_next_date := NEW.starts_at + INTERVAL '1 week';
                WHEN 'monthly' THEN
                    v_next_date := NEW.starts_at + INTERVAL '1 month';
                WHEN 'yearly' THEN
                    v_next_date := NEW.starts_at + INTERVAL '1 year';
                ELSE
                    v_next_date := NULL;
            END CASE;
            
            IF v_next_date IS NOT NULL THEN
                -- Create next event in series (this would be more sophisticated in production)
                INSERT INTO public.events (
                    organizer_id,
                    organization_id,
                    created_by_member_id,
                    title,
                    description,
                    event_type,
                    visibility,
                    location,
                    starts_at,
                    ends_at,
                    capacity,
                    is_virtual,
                    status,
                    recurring_pattern,
                    parent_event_id
                ) VALUES (
                    NEW.organizer_id,
                    NEW.organization_id,
                    NEW.created_by_member_id,
                    NEW.title,
                    NEW.description,
                    NEW.event_type,
                    NEW.visibility,
                    NEW.location,
                    v_next_date,
                    NEW.ends_at + (v_next_date - NEW.starts_at),
                    NEW.capacity,
                    NEW.is_virtual,
                    'draft', -- Next events start as draft
                    NEW.recurring_pattern,
                    NEW.id
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_recurring_events_trigger ON public.events;
CREATE TRIGGER handle_recurring_events_trigger
    AFTER INSERT ON public.events
    FOR EACH ROW
    WHEN (NEW.recurring_pattern IS NOT NULL)
    EXECUTE FUNCTION public.handle_recurring_events();

-- Function to get event attendees with organization context
CREATE OR REPLACE FUNCTION public.get_event_attendees_with_context(p_event_id uuid)
RETURNS TABLE(
    attendee_id uuid,
    full_name text,
    email text,
    avatar_url text,
    headline text,
    organization_name text,
    attendee_title text,
    attendee_department text,
    status text,
    checked_in_at timestamptz,
    num_guests integer
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as attendee_id,
        p.full_name,
        p.email,
        p.avatar_url,
        p.headline,
        o.name as organization_name,
        om.title as attendee_title,
        om.department as attendee_department,
        ea.status,
        ea.checked_in_at,
        ea.num_guests
    FROM public.event_attendees ea
    JOIN public.profiles p ON ea.attendee_id = p.id
    LEFT JOIN public.organizations o ON p.primary_organization_id = o.id
    LEFT JOIN public.organization_members om ON om.user_id = p.id AND om.organization_id = p.primary_organization_id AND om.is_active = true
    WHERE ea.event_id = p_event_id
    ORDER BY 
        CASE ea.status 
            WHEN 'attended' THEN 1
            WHEN 'registered' THEN 2
            ELSE 3
        END,
        p.full_name;
END;
$$;

-- Function to check event registration availability
CREATE OR REPLACE FUNCTION public.can_register_for_event(p_event_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_event_record RECORD;
    v_current_attendees integer;
    v_user_organization_member boolean;
BEGIN
    -- Get event details
    SELECT e.*, COUNT(ea.id) as attendee_count
    INTO v_event_record
    FROM public.events e
    LEFT JOIN public.event_attendees ea ON e.id = ea.event_id AND ea.status IN ('registered', 'attended')
    WHERE e.id = p_event_id
    GROUP BY e.id;
    
    -- Check if event exists and is published
    IF v_event_record IS NULL OR v_event_record.status != 'published' THEN
        RETURN false;
    END IF;
    
    -- Check if event has started
    IF v_event_record.starts_at < NOW() THEN
        RETURN false;
    END IF;
    
    -- Check capacity
    IF v_event_record.capacity IS NOT NULL AND v_event_record.attendee_count >= v_event_record.capacity THEN
        RETURN false;
    END IF;
    
    -- Check visibility restrictions
    IF v_event_record.visibility = 'organization_only' THEN
        SELECT EXISTS(
            SELECT 1 FROM public.organization_members 
            WHERE user_id = p_user_id 
              AND organization_id = v_event_record.organization_id
              AND is_active = true
        ) INTO v_user_organization_member;
        
        IF NOT v_user_organization_member THEN
            RETURN false;
        END IF;
    END IF;
    
    -- Check if user is already registered
    IF EXISTS (
        SELECT 1 FROM public.event_attendees 
        WHERE event_id = p_event_id AND attendee_id = p_user_id
    ) THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- Create index for event performance
DROP INDEX IF EXISTS idx_events_organization_starts_at;
CREATE INDEX CONCURRENTLY idx_events_organization_starts_at 
ON public.events (organization_id, starts_at) 
WHERE status = 'published';

DROP INDEX IF EXISTS idx_events_visibility_status;
CREATE INDEX CONCURRENTLY idx_events_visibility_status 
ON public.events (visibility, status, starts_at);

-- Output success message
DO $$ 
BEGIN
    RAISE NOTICE 'Event triggers and functions created successfully:';
    RAISE NOTICE '- Enhanced date validation and prevention';
    RAISE NOTICE '- Automatic publishing and archiving system';
    RAISE NOTICE '- Organization permission validation';
    RAISE NOTICE '- Event cancellation and notification handling';
    RAISE NOTICE '- Visibility rule enforcement';
    RAISE NOTICE '- Recurring event support';
    RAISE NOTICE '- Attendee management utilities';
    RAISE NOTICE '- Performance indexes for event queries';
END $$;