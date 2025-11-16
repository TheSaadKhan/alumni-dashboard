-- =========================================
-- Function to create default organization roles
-- =========================================
CREATE OR REPLACE FUNCTION public.create_default_organization_roles(org_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Super Admin (can do everything)
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'super_admin',
    'Super Administrator',
    0,
    '{
      "manage_organization": true,
      "manage_members": true,
      "manage_roles": true,
      "manage_settings": true,
      "view_analytics": true,
      "manage_content": true,
      "manage_events": true,
      "manage_jobs": true,
      "manage_donations": true,
      "invite_members": true,
      "manage_network": true,
      "manage_stories": true
    }'::jsonb,
    ARRAY['sub_admin', 'faculty', 'staff', 'student', 'alumni', 'employee'],
    true
  );

  -- Sub Admin (Department Head/Dean)
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'sub_admin',
    'Sub Administrator',
    1,
    '{
      "manage_members": true,
      "manage_content": true,
      "manage_events": true,
      "manage_jobs": true,
      "view_analytics": true,
      "invite_members": true,
      "manage_network": true,
      "manage_stories": true
    }'::jsonb,
    ARRAY['faculty', 'staff', 'student', 'alumni', 'employee'],
    true
  );

  -- Faculty/Manager
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'faculty',
    'Faculty/Manager',
    2,
    '{
      "manage_content": true,
      "manage_events": true,
      "view_analytics": true,
      "invite_members": true,
      "manage_stories": true
    }'::jsonb,
    ARRAY['staff', 'student', 'alumni', 'employee'],
    true
  );

  -- Staff/Employee
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'staff',
    'Staff/Employee',
    3,
    '{
      "create_content": true,
      "create_events": true,
      "view_analytics": false,
      "apply_jobs": true,
      "network": true
    }'::jsonb,
    ARRAY['student', 'alumni'],
    true
  );

  -- Student
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'student',
    'Student',
    4,
    '{
      "view_content": true,
      "join_events": true,
      "apply_jobs": true,
      "network": true
    }'::jsonb,
    ARRAY[]::text[],
    true
  );

  -- Alumni
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'alumni',
    'Alumni',
    4,
    '{
      "view_content": true,
      "join_events": true,
      "apply_jobs": true,
      "network": true
    }'::jsonb,
    ARRAY[]::text[],
    true
  );

  -- Employee (for corporate organizations)
  INSERT INTO public.organization_roles (organization_id, name, display_name, hierarchy_level, permissions, can_invite_roles, is_system_role)
  VALUES (
    org_id,
    'employee',
    'Employee',
    4,
    '{
      "view_content": true,
      "join_events": true,
      "apply_jobs": true,
      "network": true
    }'::jsonb,
    ARRAY[]::text[],
    true
  );
END;
$$;

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

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(
  p_conversation_id uuid,
  p_participant_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_participant_id uuid := COALESCE(p_participant_id, auth.uid());
  v_last_message_id uuid;
BEGIN
  -- Get the latest message ID in the conversation
  SELECT id INTO v_last_message_id
  FROM public.messages
  WHERE conversation_id = p_conversation_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Update participant's last read
  UPDATE public.conversation_participants
  SET 
    last_read_at = NOW(),
    last_read_message_id = v_last_message_id,
    updated_at = NOW()
  WHERE conversation_id = p_conversation_id 
    AND participant_id = v_participant_id;
  
  -- Mark messages as read in read_by array
  UPDATE public.messages
  SET 
    read_by = COALESCE(read_by, '[]'::jsonb) || 
    jsonb_build_object('user_id', v_participant_id, 'read_at', NOW()::text)::jsonb,
    is_read = true
  WHERE conversation_id = p_conversation_id 
    AND NOT (read_by @> jsonb_build_array(jsonb_build_object('user_id', v_participant_id)));
END;
$$;

-- Function to add participant to conversation
CREATE OR REPLACE FUNCTION public.add_conversation_participant(
  p_conversation_id uuid,
  p_participant_id uuid,
  p_role text DEFAULT 'member'
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.conversation_participants (
    conversation_id,
    participant_id,
    role,
    organization_id,
    participant_member_id
  )
  SELECT 
    p_conversation_id,
    p_participant_id,
    p_role,
    c.organization_id,
    om.id
  FROM public.conversations c
  LEFT JOIN public.organization_members om ON om.user_id = p_participant_id AND om.organization_id = c.organization_id
  WHERE c.id = p_conversation_id;
  
  RETURN FOUND;
END;
$$;

-- Function to handle connection acceptance
CREATE OR REPLACE FUNCTION public.accept_connection_request(
  p_connection_id uuid,
  p_receiver_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.network_connections
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_connection_id
    AND receiver_id = COALESCE(p_receiver_id, auth.uid())
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

-- Function to reject connection request
CREATE OR REPLACE FUNCTION public.reject_connection_request(
  p_connection_id uuid,
  p_receiver_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.network_connections
  SET 
    status = 'rejected',
    rejected_at = NOW(),
    updated_at = NOW()
  WHERE id = p_connection_id
    AND receiver_id = COALESCE(p_receiver_id, auth.uid())
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

-- Function to block a connection
CREATE OR REPLACE FUNCTION public.block_connection(
  p_connection_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.network_connections
  SET 
    status = 'blocked',
    blocked_at = NOW(),
    updated_at = NOW()
  WHERE id = p_connection_id
    AND (user_a = COALESCE(p_user_id, auth.uid()) OR user_b = COALESCE(p_user_id, auth.uid()));
  
  RETURN FOUND;
END;
$$;

-- Function to get mutual connections count
CREATE OR REPLACE FUNCTION public.get_mutual_connections_count(
  p_user_a uuid,
  p_user_b uuid
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  mutual_count integer;
BEGIN
  SELECT COUNT(*) INTO mutual_count
  FROM (
    -- Connections of user_a
    SELECT 
      CASE WHEN user_a = p_user_a THEN user_b ELSE user_a END as connected_user
    FROM public.network_connections
    WHERE (user_a = p_user_a OR user_b = p_user_a)
      AND status = 'accepted'
  ) AS user_a_connections
  JOIN (
    -- Connections of user_b
    SELECT 
      CASE WHEN user_a = p_user_b THEN user_b ELSE user_a END as connected_user
    FROM public.network_connections
    WHERE (user_a = p_user_b OR user_b = p_user_b)
      AND status = 'accepted'
  ) AS user_b_connections
  ON user_a_connections.connected_user = user_b_connections.connected_user;
  
  RETURN COALESCE(mutual_count, 0);
END;
$$;

-- Function to get connection suggestions
CREATE OR REPLACE FUNCTION public.get_connection_suggestions(
  p_user_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  suggested_user_id uuid,
  full_name text,
  avatar_url text,
  headline text,
  mutual_connections_count integer,
  shared_interests text[],
  confidence_score decimal
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as suggested_user_id,
    p.full_name,
    p.avatar_url,
    p.headline,
    public.get_mutual_connections_count(p_user_id, p.id) as mutual_connections_count,
    (
      SELECT ARRAY_AGG(DISTINCT interest)
      FROM (
        SELECT UNNEST(p1.skills->'interests') as interest
        FROM public.profiles p1
        WHERE p1.id = p_user_id
        UNION
        SELECT UNNEST(p2.skills->'interests') as interest
        FROM public.profiles p2
        WHERE p2.id = p.id
      ) AS shared
    ) as shared_interests,
    RANDOM() as confidence_score -- Simplified, would be more complex in reality
  FROM public.profiles p
  WHERE p.id != p_user_id
    AND p.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.network_connections nc
      WHERE (nc.user_a = p_user_id AND nc.user_b = p.id)
         OR (nc.user_a = p.id AND nc.user_b = p_user_id)
    )
  ORDER BY 
    public.get_mutual_connections_count(p_user_id, p.id) DESC,
    confidence_score DESC
  LIMIT p_limit;
END;
$$;

-- Function to publish a story
CREATE OR REPLACE FUNCTION public.publish_story(
  p_story_id uuid,
  p_publish_at timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.stories
  SET 
    status = 'published',
    published_at = COALESCE(p_publish_at, NOW()),
    updated_at = NOW()
  WHERE id = p_story_id
    AND status IN ('draft', 'scheduled');
  
  RETURN FOUND;
END;
$$;

-- Function to get story statistics
CREATE OR REPLACE FUNCTION public.get_story_stats(
  p_organization_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_stories bigint,
  published_stories bigint,
  total_views bigint,
  total_likes bigint,
  total_comments bigint,
  average_reading_time decimal,
  most_popular_category text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_stories,
    COUNT(*) FILTER (WHERE status = 'published') as published_stories,
    COALESCE(SUM(view_count), 0) as total_views,
    COALESCE(SUM(like_count), 0) as total_likes,
    COALESCE(SUM(comment_count), 0) as total_comments,
    COALESCE(AVG(reading_time_minutes), 0) as average_reading_time,
    MODE() WITHIN GROUP (ORDER BY category) as most_popular_category
  FROM public.stories
  WHERE organization_id = p_organization_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;

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

-- Function to get user preference with fallback
CREATE OR REPLACE FUNCTION public.get_user_preference(
  p_user_id uuid,
  p_preference_path text, -- e.g., 'privacy.profile_visibility'
  p_default_value jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_value jsonb;
  v_path_elements text[];
  v_current jsonb;
BEGIN
  -- Split the path into elements
  v_path_elements := string_to_array(p_preference_path, '.');
  
  -- Get user settings
  SELECT preferences INTO v_current
  FROM public.user_settings
  WHERE user_id = p_user_id;
  
  -- Navigate through the JSON path
  FOR i IN 1..array_length(v_path_elements, 1) LOOP
    IF v_current IS NULL THEN
      RETURN p_default_value;
    END IF;
    v_current := v_current -> v_path_elements[i];
  END LOOP;
  
  RETURN COALESCE(v_current, p_default_value);
END;
$$;

-- Function to set user preference
CREATE OR REPLACE FUNCTION public.set_user_preference(
  p_user_id uuid,
  p_preference_path text,
  p_value jsonb
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.user_settings
  SET 
    preferences = jsonb_set(
      COALESCE(preferences, '{}'::jsonb),
      ('{' || p_preference_path || '}')::text[],
      p_value,
      true
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create settings record if it doesn't exist
    INSERT INTO public.user_settings (user_id, preferences)
    VALUES (p_user_id, jsonb_build_object(p_preference_path, p_value))
    ON CONFLICT (user_id) DO UPDATE SET
      preferences = jsonb_set(
        COALESCE(user_settings.preferences, '{}'::jsonb),
        ('{' || p_preference_path || '}')::text[],
        p_value,
        true
      ),
      updated_at = NOW();
  END IF;
  
  RETURN true;
END;
$$;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.user_sessions
    WHERE expires_at < NOW()
      AND is_active = true
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- Function to cleanup expired data exports
CREATE OR REPLACE FUNCTION public.cleanup_expired_exports()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.user_data_exports
    WHERE expires_at < NOW()
      AND status = 'completed'
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- Function to create data export request
CREATE OR REPLACE FUNCTION public.create_data_export_request(
  p_user_id uuid,
  p_export_type text DEFAULT 'full',
  p_format text DEFAULT 'json',
  p_data_scope jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_export_id uuid;
  v_default_scope jsonb := '{
    "include_profile": true,
    "include_connections": true,
    "include_messages": true,
    "include_activity": true,
    "include_preferences": true
  }'::jsonb;
BEGIN
  INSERT INTO public.user_data_exports (
    user_id,
    export_type,
    format,
    data_scope,
    expires_at
  ) VALUES (
    p_user_id,
    p_export_type,
    p_format,
    COALESCE(p_data_scope, v_default_scope),
    NOW() + INTERVAL '30 days'
  ) RETURNING id INTO v_export_id;
  
  RETURN v_export_id;
END;
$$;