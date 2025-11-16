-- RLS Policies for Events
DROP POLICY IF EXISTS "Users can view events in their organization" ON public.events;
CREATE POLICY "Users can view events in their organization" 
ON public.events
FOR SELECT USING (
  -- Public events
  visibility = 'public'
  OR 
  -- Organization events visible to members
  (visibility = 'organization_only' AND organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND is_active = true
  ))
  OR
  -- Private events visible to invited attendees
  (visibility = 'private' AND id IN (
    SELECT event_id FROM public.event_attendees 
    WHERE attendee_id = auth.uid()
  ))
  OR
  -- Events created by the user
  organizer_id = auth.uid()
  OR
  -- Users with event management permissions
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.is_active = true
      AND r.permissions->>'manage_events' = 'true'
  )
);

DROP POLICY IF EXISTS "Organization members can create events" ON public.events;
CREATE POLICY "Organization members can create events" 
ON public.events
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.is_active = true
      AND (
        r.permissions->>'manage_events' = 'true'
        OR r.permissions->>'create_events' = 'true'
        OR r.permissions->>'manage_content' = 'true'
      )
  )
  OR organizer_id = auth.uid()
);

DROP POLICY IF EXISTS "Event organizers can update their events" ON public.events;
CREATE POLICY "Event organizers can update their events" 
ON public.events
FOR UPDATE USING (
  organizer_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.is_active = true
      AND (
        r.permissions->>'manage_events' = 'true'
        OR r.permissions->>'manage_content' = 'true'
      )
  )
);

DROP POLICY IF EXISTS "Event organizers can delete their events" ON public.events;
CREATE POLICY "Event organizers can delete their events" 
ON public.events
FOR DELETE USING (
  organizer_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.is_active = true
      AND (
        r.permissions->>'manage_events' = 'true'
        OR r.permissions->>'manage_content' = 'true'
      )
  )
);

-- Additional policies for event management
DROP POLICY IF EXISTS "Users can register for public events" ON public.events;
CREATE POLICY "Users can register for public events" 
ON public.events
FOR SELECT USING (
  visibility = 'public'
  AND status = 'published'
);

DROP POLICY IF EXISTS "Organization members can view all organization events" ON public.events;
CREATE POLICY "Organization members can view all organization events" 
ON public.events
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
  AND visibility IN ('organization_only', 'public')
);

-- RLS Policies for Event Attendees
DROP POLICY IF EXISTS "Users can view their own event registrations" ON public.event_attendees;
CREATE POLICY "Users can view their own event registrations" 
ON public.event_attendees
FOR SELECT USING (attendee_id = auth.uid());

DROP POLICY IF EXISTS "Event organizers can view all attendees" ON public.event_attendees;
CREATE POLICY "Event organizers can view all attendees" 
ON public.event_attendees
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_attendees.event_id
      AND (
        e.organizer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.organization_roles r ON om.role_id = r.id
          WHERE om.user_id = auth.uid()
            AND om.organization_id = e.organization_id
            AND om.is_active = true
            AND r.permissions->>'manage_events' = 'true'
        )
      )
  )
);

DROP POLICY IF EXISTS "Users can register for events" ON public.event_attendees;
CREATE POLICY "Users can register for events" 
ON public.event_attendees
FOR INSERT WITH CHECK (
  attendee_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_attendees.event_id
      AND e.status = 'published'
      AND (
        e.visibility = 'public'
        OR (
          e.visibility = 'organization_only' 
          AND e.organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND is_active = true
          )
        )
        OR (
          e.visibility = 'private'
          AND EXISTS (
            SELECT 1 FROM public.event_attendees ea
            WHERE ea.event_id = e.id
              AND ea.attendee_id = auth.uid()
              AND ea.status = 'invited'
          )
        )
      )
  )
);

DROP POLICY IF EXISTS "Users can update their own registration" ON public.event_attendees;
CREATE POLICY "Users can update their own registration" 
ON public.event_attendees
FOR UPDATE USING (attendee_id = auth.uid());

DROP POLICY IF EXISTS "Event organizers can manage attendees" ON public.event_attendees;
CREATE POLICY "Event organizers can manage attendees" 
ON public.event_attendees
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_attendees.event_id
      AND (
        e.organizer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.organization_members om
          JOIN public.organization_roles r ON om.role_id = r.id
          WHERE om.user_id = auth.uid()
            AND om.organization_id = e.organization_id
            AND om.is_active = true
            AND r.permissions->>'manage_events' = 'true'
        )
      )
  )
);

-- Function to check if user can register for event
CREATE OR REPLACE FUNCTION public.can_register_for_event(
  p_user_id uuid,
  p_event_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_event_record RECORD;
  v_is_organization_member boolean;
  v_is_invited boolean;
  v_is_full boolean;
BEGIN
  -- Get event details
  SELECT * INTO v_event_record
  FROM public.events
  WHERE id = p_event_id;

  -- Check if event exists and is published
  IF v_event_record IS NULL OR v_event_record.status != 'published' THEN
    RETURN false;
  END IF;

  -- Check if event is full
  SELECT public.is_event_full(p_event_id) INTO v_is_full;
  IF v_is_full THEN
    RETURN false;
  END IF;

  -- Check registration based on visibility
  CASE v_event_record.visibility
    WHEN 'public' THEN
      RETURN true;
      
    WHEN 'organization_only' THEN
      -- Check if user is member of event's organization
      SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = p_user_id
          AND organization_id = v_event_record.organization_id
          AND is_active = true
      ) INTO v_is_organization_member;
      RETURN v_is_organization_member;
      
    WHEN 'private' THEN
      -- Check if user is invited
      SELECT EXISTS (
        SELECT 1 FROM public.event_attendees
        WHERE event_id = p_event_id
          AND attendee_id = p_user_id
          AND status = 'invited'
      ) INTO v_is_invited;
      RETURN v_is_invited;
      
    ELSE
      RETURN false;
  END CASE;
END;
$$;