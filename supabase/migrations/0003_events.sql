-- 0003_events.sql
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id uuid,
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  title text NOT NULL,
  description text,
  location text,
  address jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer CHECK (capacity >= 0),
  is_virtual boolean DEFAULT false,
  status text DEFAULT 'draft',
  
  -- NEW: Enhanced event fields
  event_type text DEFAULT 'general', -- conference, workshop, meeting, social, etc.
  visibility text DEFAULT 'public', -- public, private, organization_only
  registration_required boolean DEFAULT false,
  max_registrations integer,
  price numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  
  -- NEW: Media and branding
  banner_url text,
  tags text[] DEFAULT '{}',
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event attendees table (if not exists)
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  attendee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  attendee_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  status text NOT NULL DEFAULT 'registered', -- registered, attended, cancelled, waitlisted
  ticket_type text,
  num_guests integer DEFAULT 0,
  checked_in_at timestamptz,
  notes text,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(event_id, attendee_id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Events
CREATE POLICY "Users can view events in their organization" ON public.events
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
  );

CREATE POLICY "Organization members can create events" ON public.events
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_events' = 'true'
      )
    )
  );

CREATE POLICY "Event organizers can update their events" ON public.events
  FOR UPDATE USING (
    organizer_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_events' = 'true'
      )
    )
  );

CREATE POLICY "Event organizers can delete their events" ON public.events
  FOR DELETE USING (
    organizer_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_events' = 'true'
      )
    )
  );

-- RLS Policies for Event Attendees
CREATE POLICY "Users can view attendees for events they can access" ON public.event_attendees
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE 
        visibility = 'public'
        OR 
        (visibility = 'organization_only' AND organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid() AND is_active = true
        ))
        OR
        organizer_id = auth.uid()
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

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_event_attendees_updated_at
  BEFORE UPDATE ON public.event_attendees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON public.events (starts_at);
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON public.events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON public.events (organization_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events (organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events (status);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events (visibility);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_by_member ON public.events (created_by_member_id);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees (event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_attendee_id ON public.event_attendees (attendee_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_organization_id ON public.event_attendees (organization_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_status ON public.event_attendees (status);
CREATE INDEX IF NOT EXISTS idx_event_attendees_checked_in ON public.event_attendees (checked_in_at);

-- Function to get event attendee count
CREATE OR REPLACE FUNCTION public.get_event_attendee_count(event_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  attendee_count integer;
BEGIN
  SELECT COUNT(*) INTO attendee_count
  FROM public.event_attendees
  WHERE event_id = event_uuid AND status IN ('registered', 'attended');
  
  RETURN attendee_count;
END;
$$;

-- Function to check if event is full
CREATE OR REPLACE FUNCTION public.is_event_full(event_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  event_capacity integer;
  current_attendees integer;
BEGIN
  SELECT capacity, public.get_event_attendee_count(event_uuid)
  INTO event_capacity, current_attendees
  FROM public.events
  WHERE id = event_uuid;
  
  IF event_capacity IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN current_attendees >= event_capacity;
END;
$$;

-- View for event details with attendee counts
CREATE OR REPLACE VIEW public.event_details AS
SELECT 
  e.*,
  p.full_name as organizer_name,
  p.email as organizer_email,
  org.name as organization_name,
  public.get_event_attendee_count(e.id) as attendee_count,
  public.is_event_full(e.id) as is_full,
  CASE 
    WHEN e.starts_at > NOW() THEN 'upcoming'
    WHEN e.ends_at < NOW() THEN 'past'
    ELSE 'ongoing'
  END as event_timing
FROM public.events e
LEFT JOIN public.profiles p ON e.organizer_id = p.id
LEFT JOIN public.organizations org ON e.organization_id = org.id;

-- Insert default event types if needed
INSERT INTO public.events (id, organizer_id, title, description, status, visibility)
VALUES 
  (gen_random_uuid(), auth.uid(), 'Welcome Event', 'Organization welcome event', 'published', 'public')
ON CONFLICT DO NOTHING;