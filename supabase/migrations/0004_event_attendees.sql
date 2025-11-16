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

