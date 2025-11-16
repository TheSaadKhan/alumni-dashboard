-- 0004_event_attendees.sql
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  attendee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  attendee_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  status text NOT NULL DEFAULT 'registered', -- registered, attended, cancelled, waitlisted, no_show
  ticket_type text,
  
  -- NEW: Enhanced attendee fields
  num_guests integer DEFAULT 0 CHECK (num_guests >= 0),
  dietary_restrictions text[] DEFAULT '{}',
  accessibility_requirements text,
  emergency_contact jsonb,
  
  checked_in_at timestamptz,
  check_in_code text, -- For QR code or manual check-in
  checked_in_by uuid REFERENCES public.profiles(id), -- Who checked them in
  
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (event_id, attendee_id)
);

-- Enable RLS
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Event Attendees
CREATE POLICY "Users can view attendees for events they can access" ON public.event_attendees
  FOR SELECT USING (
    -- Users can see attendees for public events
    event_id IN (
      SELECT id FROM public.events 
      WHERE visibility = 'public'
    )
    OR
    -- Users can see attendees for their organization's events
    event_id IN (
      SELECT e.id FROM public.events e
      WHERE e.visibility = 'organization_only' 
      AND e.organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
    OR
    -- Users can see attendees for events they organized
    event_id IN (
      SELECT id FROM public.events 
      WHERE organizer_id = auth.uid()
    )
    OR
    -- Users can see their own registrations
    attendee_id = auth.uid()
    OR
    -- Organization admins can see all attendees in their org
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_events' = 'true'
      )
    )
  );

CREATE POLICY "Users can manage their own event registrations" ON public.event_attendees
  FOR ALL USING (attendee_id = auth.uid());

CREATE POLICY "Event organizers can manage attendees" ON public.event_attendees
  FOR ALL USING (
    event_id IN (
      SELECT id FROM public.events 
      WHERE organizer_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND is_active = true
        AND role_id IN (
          SELECT id FROM public.organization_roles 
          WHERE permissions->>'manage_events' = 'true'
        )
      )
    )
  );

CREATE POLICY "Check-in staff can update check-in status" ON public.event_attendees
  FOR UPDATE USING (
    event_id IN (
      SELECT e.id FROM public.events e
      WHERE e.organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND is_active = true
        AND role_id IN (
          SELECT id FROM public.organization_roles 
          WHERE permissions->>'manage_events' = 'true'
          OR permissions->>'check_in_attendees' = 'true'
        )
      )
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_event_attendees_updated_at
  BEFORE UPDATE ON public.event_attendees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees (event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_attendee_id ON public.event_attendees (attendee_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_organization_id ON public.event_attendees (organization_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_status ON public.event_attendees (status);
CREATE INDEX IF NOT EXISTS idx_event_attendees_checked_in_at ON public.event_attendees (checked_in_at);
CREATE INDEX IF NOT EXISTS idx_event_attendees_check_in_code ON public.event_attendees (check_in_code);
CREATE INDEX IF NOT EXISTS idx_event_attendees_attendee_member ON public.event_attendees (attendee_member_id);

-- Function to automatically set organization_id from event
CREATE OR REPLACE FUNCTION public.set_event_attendee_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from the event if not provided
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.events
    WHERE id = NEW.event_id;
  END IF;
  
  -- Set attendee_member_id if available
  IF NEW.attendee_member_id IS NULL THEN
    SELECT om.id INTO NEW.attendee_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.attendee_id 
    AND om.organization_id = NEW.organization_id
    AND om.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_event_attendee_organization_trigger
  BEFORE INSERT ON public.event_attendees
  FOR EACH ROW EXECUTE FUNCTION public.set_event_attendee_organization();

-- Function to check event capacity before registration
CREATE OR REPLACE FUNCTION public.check_event_capacity()
RETURNS TRIGGER AS $$
DECLARE
  event_capacity integer;
  current_attendees integer;
  event_organization_id uuid;
BEGIN
  -- Get event capacity and current attendee count
  SELECT e.capacity, e.organization_id, COUNT(ea.id)
  INTO event_capacity, event_organization_id, current_attendees
  FROM public.events e
  LEFT JOIN public.event_attendees ea ON e.id = ea.event_id 
    AND ea.status IN ('registered', 'attended')
  WHERE e.id = NEW.event_id
  GROUP BY e.id, e.capacity, e.organization_id;
  
  -- Check if event has capacity limits and is full
  IF event_capacity IS NOT NULL AND current_attendees >= event_capacity THEN
    -- Auto-waitlist new registrations if event is full
    NEW.status = 'waitlisted';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_event_capacity_trigger
  BEFORE INSERT ON public.event_attendees
  FOR EACH ROW EXECUTE FUNCTION public.check_event_capacity();

-- Function to get event attendance statistics
CREATE OR REPLACE FUNCTION public.get_event_attendance_stats(event_uuid uuid)
RETURNS TABLE(
  total_registered bigint,
  total_attended bigint,
  total_cancelled bigint,
  total_waitlisted bigint,
  attendance_rate decimal,
  checked_in_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status IN ('registered', 'attended')) as total_registered,
    COUNT(*) FILTER (WHERE status = 'attended') as total_attended,
    COUNT(*) FILTER (WHERE status = 'cancelled') as total_cancelled,
    COUNT(*) FILTER (WHERE status = 'waitlisted') as total_waitlisted,
    CASE 
      WHEN COUNT(*) FILTER (WHERE status IN ('registered', 'attended')) > 0 THEN
        (COUNT(*) FILTER (WHERE status = 'attended')::decimal / 
         COUNT(*) FILTER (WHERE status IN ('registered', 'attended'))::decimal) * 100
      ELSE 0 
    END as attendance_rate,
    COUNT(*) FILTER (WHERE checked_in_at IS NOT NULL) as checked_in_count
  FROM public.event_attendees
  WHERE event_id = event_uuid;
END;
$$;

-- View for enhanced attendee information
CREATE OR REPLACE VIEW public.event_attendee_details AS
SELECT 
  ea.*,
  p.full_name as attendee_name,
  p.email as attendee_email,
  p.avatar_url as attendee_avatar,
  e.title as event_title,
  e.starts_at as event_starts_at,
  e.ends_at as event_ends_at,
  org.name as organization_name,
  om.title as attendee_title,
  om.department as attendee_department
FROM public.event_attendees ea
JOIN public.profiles p ON ea.attendee_id = p.id
JOIN public.events e ON ea.event_id = e.id
LEFT JOIN public.organizations org ON ea.organization_id = org.id
LEFT JOIN public.organization_members om ON ea.attendee_member_id = om.id;

-- Function to handle attendee check-in
CREATE OR REPLACE FUNCTION public.check_in_attendee(
  p_attendee_id uuid,
  p_event_id uuid,
  p_check_in_code text DEFAULT NULL,
  p_checked_in_by uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.event_attendees
  SET 
    checked_in_at = NOW(),
    check_in_code = COALESCE(p_check_in_code, check_in_code),
    checked_in_by = COALESCE(p_checked_in_by, checked_in_by),
    status = 'attended'
  WHERE event_id = p_event_id 
    AND attendee_id = p_attendee_id
    AND checked_in_at IS NULL;
  
  IF FOUND THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;