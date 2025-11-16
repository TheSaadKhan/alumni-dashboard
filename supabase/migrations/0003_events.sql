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