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

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true); -- Managed by backend/service role

CREATE POLICY "Organization admins can view notifications in their org" ON public.notifications
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_notifications' = 'true'
      )
    )
  );

-- RLS Policies for Notification Preferences
CREATE POLICY "Users can manage their own preferences" ON public.notification_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view preferences in their org" ON public.notification_preferences
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_notifications' = 'true'
      )
    )
  );

-- RLS Policies for Notification Templates
CREATE POLICY "Organization members can view templates in their org" ON public.notification_templates
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Organization admins can manage templates" ON public.notification_templates
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_notifications' = 'true'
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

CREATE TRIGGER handle_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications (recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON public.notifications (organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications (category);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_is_seen ON public.notifications (is_seen);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications (priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_group_key ON public.notifications (group_key);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON public.notifications (scheduled_for);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_organization_id ON public.notification_preferences (organization_id);

CREATE INDEX IF NOT EXISTS idx_notification_templates_organization_id ON public.notification_templates (organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON public.notification_templates (type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_is_active ON public.notification_templates (is_active);

-- Function to automatically set organization context
CREATE OR REPLACE FUNCTION public.set_notification_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from recipient's primary organization if not provided
  IF NEW.organization_id IS NULL THEN
    SELECT primary_organization_id INTO NEW.organization_id
    FROM public.profiles
    WHERE id = NEW.recipient_id;
  END IF;
  
  -- Set recipient_member_id if organization is found
  IF NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.recipient_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.recipient_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Set source_member_id if source_id is provided and organization is found
  IF NEW.source_id IS NOT NULL AND NEW.organization_id IS NOT NULL AND NEW.source_member_id IS NULL THEN
    SELECT om.id INTO NEW.source_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.source_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notification_organization_trigger
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_notification_organization();

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  p_notification_id uuid,
  p_recipient_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.notifications
  SET 
    is_read = true,
    read_at = NOW(),
    updated_at = NOW()
  WHERE id = p_notification_id
    AND recipient_id = COALESCE(p_recipient_id, auth.uid())
    AND is_read = false;
  
  RETURN FOUND;
END;
$$;

-- Function to mark notification as seen
CREATE OR REPLACE FUNCTION public.mark_notification_seen(
  p_notification_id uuid,
  p_recipient_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.notifications
  SET 
    is_seen = true,
    seen_at = NOW(),
    updated_at = NOW()
  WHERE id = p_notification_id
    AND recipient_id = COALESCE(p_recipient_id, auth.uid())
    AND is_seen = false;
  
  RETURN FOUND;
END;
$$;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(
  p_recipient_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count integer;
BEGIN
  WITH updated AS (
    UPDATE public.notifications
    SET 
      is_read = true,
      read_at = NOW(),
      updated_at = NOW()
    WHERE recipient_id = COALESCE(p_recipient_id, auth.uid())
      AND is_read = false
    RETURNING 1
  )
  SELECT COUNT(*) INTO updated_count FROM updated;
  
  RETURN updated_count;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(
  p_recipient_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM public.notifications
  WHERE recipient_id = COALESCE(p_recipient_id, auth.uid())
    AND is_read = false;
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function to create notification with template
CREATE OR REPLACE FUNCTION public.create_notification_from_template(
  p_recipient_id uuid,
  p_template_type text,
  p_template_variables jsonb DEFAULT '{}'::jsonb,
  p_organization_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_template_record RECORD;
  v_notification_id uuid;
  v_organization_id uuid;
BEGIN
  -- Determine organization context
  IF p_organization_id IS NULL THEN
    SELECT primary_organization_id INTO v_organization_id
    FROM public.profiles
    WHERE id = p_recipient_id;
  ELSE
    v_organization_id := p_organization_id;
  END IF;
  
  -- Get template
  SELECT * INTO v_template_record
  FROM public.notification_templates
  WHERE type = p_template_type
    AND organization_id = v_organization_id
    AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active template found for type: % in organization: %', p_template_type, v_organization_id;
  END IF;
  
  -- Create notification
  INSERT INTO public.notifications (
    recipient_id,
    organization_id,
    type,
    category,
    title,
    body,
    action_url,
    action_label,
    priority,
    delivery_methods
  ) VALUES (
    p_recipient_id,
    v_organization_id,
    v_template_record.type,
    v_template_record.category,
    -- In a real implementation, you'd use a template engine here
    v_template_record.title_template,
    v_template_record.body_template,
    v_template_record.action_url_template,
    v_template_record.action_label_template,
    v_template_record.default_priority,
    v_template_record.default_delivery_methods
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(
  p_retention_days integer DEFAULT 90
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.notifications
    WHERE created_at < NOW() - (p_retention_days || ' days')::interval
      AND is_read = true
      AND archived_at IS NOT NULL
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- View for enhanced notification details
CREATE OR REPLACE VIEW public.notification_details AS
SELECT 
  n.*,
  p.full_name as recipient_name,
  p.email as recipient_email,
  org.name as organization_name,
  rm.title as recipient_title,
  rm.department as recipient_department,
  source_p.full_name as source_name,
  source_p.avatar_url as source_avatar,
  source_m.title as source_title
FROM public.notifications n
JOIN public.profiles p ON n.recipient_id = p.id
LEFT JOIN public.organizations org ON n.organization_id = org.id
LEFT JOIN public.organization_members rm ON n.recipient_member_id = rm.id
LEFT JOIN public.profiles source_p ON n.source_id = source_p.id
LEFT JOIN public.organization_members source_m ON n.source_member_id = source_m.id;

-- View for notification statistics
CREATE OR REPLACE VIEW public.notification_stats AS
SELECT 
  organization_id,
  type,
  category,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_read = true) as read_count,
  COUNT(*) FILTER (WHERE is_seen = true) as seen_count,
  COUNT(*) FILTER (WHERE delivered = true) as delivered_count,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked_count,
  AVG(EXTRACT(EPOCH FROM (read_at - created_at))) as avg_read_time_seconds
FROM public.notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY organization_id, type, category;

-- Create default notification preferences for existing users
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id, organization_id, user_member_id)
  SELECT 
    NEW.id,
    NEW.primary_organization_id,
    om.id
  FROM public.organization_members om
  WHERE om.user_id = NEW.id 
    AND om.organization_id = NEW.primary_organization_id
    AND om.is_active = true
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_default_notification_preferences_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_preferences();