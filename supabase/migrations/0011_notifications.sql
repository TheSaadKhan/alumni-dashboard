-- 0011_notifications.sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipient_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  type text NOT NULL, -- connection_request, message, event_invite, job_application, donation_receipt, story_published
  category text DEFAULT 'general', -- social, system, marketing, alert, reminder
  
  -- NEW: Enhanced notification fields
  title text NOT NULL,
  body text,
  action_url text,
  action_label text,
  image_url text,
  
  -- NEW: Priority and grouping
  priority text DEFAULT 'medium', -- low, medium, high, urgent
  group_key text, -- For grouping related notifications
  thread_id uuid, -- For threaded notifications
  
  -- NEW: Delivery status
  is_read boolean DEFAULT false,
  read_at timestamptz,
  is_seen boolean DEFAULT false, -- Viewed in notification center but not necessarily read
  seen_at timestamptz,
  delivered boolean DEFAULT false,
  delivered_at timestamptz,
  
  -- NEW: Delivery methods
  delivery_methods text[] DEFAULT '{"in_app"}'::text[], -- in_app, email, push, sms
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  push_sent boolean DEFAULT false,
  push_sent_at timestamptz,
  sms_sent boolean DEFAULT false,
  sms_sent_at timestamptz,
  
  -- NEW: Expiration and scheduling
  expires_at timestamptz,
  scheduled_for timestamptz,
  sent_at timestamptz,
  
  -- NEW: Source tracking
  source_type text, -- user, system, organization, automated
  source_id uuid, -- ID of the user/organization that triggered the notification
  source_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Interaction tracking
  clicked_at timestamptz,
  dismissed_at timestamptz,
  archived_at timestamptz,
  
  payload jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Channel preferences
  preferences jsonb DEFAULT '{
    "in_app": true,
    "email": true,
    "push": true,
    "sms": false
  }'::jsonb,
  
  -- NEW: Category preferences
  category_preferences jsonb DEFAULT '{
    "social": {"in_app": true, "email": true, "push": true},
    "system": {"in_app": true, "email": false, "push": true},
    "marketing": {"in_app": true, "email": false, "push": false},
    "alert": {"in_app": true, "email": true, "push": true},
    "reminder": {"in_app": true, "email": true, "push": true}
  }'::jsonb,
  
  -- NEW: Type-specific preferences
  type_preferences jsonb DEFAULT '{
    "connection_request": {"in_app": true, "email": true, "push": true},
    "message": {"in_app": true, "email": true, "push": true},
    "event_invite": {"in_app": true, "email": true, "push": true},
    "job_application": {"in_app": true, "email": true, "push": false},
    "donation_receipt": {"in_app": true, "email": true, "push": false},
    "story_published": {"in_app": true, "email": false, "push": false}
  }'::jsonb,
  
  -- NEW: Quiet hours and scheduling
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '08:00',
  timezone text DEFAULT 'UTC',
  do_not_disturb boolean DEFAULT false,
  
  -- NEW: Digest preferences
  digest_frequency text DEFAULT 'daily', -- never, daily, weekly
  last_digest_sent_at timestamptz,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, organization_id)
);

-- Notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  name text NOT NULL,
  description text,
  type text NOT NULL,
  category text DEFAULT 'general',
  
  -- NEW: Template content
  subject_template text,
  title_template text NOT NULL,
  body_template text NOT NULL,
  action_url_template text,
  action_label_template text,
  
  -- NEW: Delivery settings
  default_priority text DEFAULT 'medium',
  default_delivery_methods text[] DEFAULT '{"in_app"}'::text[],
  is_active boolean DEFAULT true,
  
  -- NEW: Localization
  language_code text DEFAULT 'en',
  supported_locales text[] DEFAULT '{"en"}'::text[],
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id, type, language_code)
);