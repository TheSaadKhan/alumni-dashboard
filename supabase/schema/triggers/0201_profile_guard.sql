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

-- Function to automatically set organization context for jobs
CREATE OR REPLACE FUNCTION public.set_job_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from poster's primary organization if not provided
  IF NEW.organization_id IS NULL THEN
    SELECT primary_organization_id INTO NEW.organization_id
    FROM public.profiles
    WHERE id = NEW.poster_id;
  END IF;
  
  -- Set created_by_member_id if available
  IF NEW.created_by_member_id IS NULL AND NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.created_by_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.poster_id 
    AND om.organization_id = NEW.organization_id
    AND om.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set application organization context
CREATE OR REPLACE FUNCTION public.set_job_application_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from the job
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.jobs
    WHERE id = NEW.job_id;
  END IF;
  
  -- Set applicant_member_id if available
  IF NEW.applicant_member_id IS NULL AND NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.applicant_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.applicant_id 
    AND om.organization_id = NEW.organization_id
    AND om.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update application timeline and ratings
CREATE OR REPLACE FUNCTION public.update_application_timeline()
RETURNS TRIGGER AS $$
BEGIN
  -- Set reviewed_at when status changes to reviewed
  IF NEW.status = 'reviewed' AND OLD.status != 'reviewed' THEN
    NEW.reviewed_at = NOW();
  END IF;
  
  -- Set phone_screen_at when stage changes to phone_screen
  IF NEW.application_stage = 'phone_screen' AND OLD.application_stage != 'phone_screen' THEN
    NEW.phone_screen_at = NOW();
  END IF;
  
  -- Set interview_at when stage changes to technical or onsite
  IF NEW.application_stage IN ('technical', 'onsite') AND OLD.application_stage NOT IN ('technical', 'onsite') THEN
    NEW.interview_at = NOW();
  END IF;
  
  -- Set offered_at when status changes to offer
  IF NEW.status = 'offer' AND OLD.status != 'offer' THEN
    NEW.offered_at = NOW();
  END IF;
  
  -- Set rejected_at when status changes to rejected
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    NEW.rejected_at = NOW();
  END IF;
  
  -- Set hired_at when status changes to hired
  IF NEW.status = 'hired' AND OLD.status != 'hired' THEN
    NEW.hired_at = NOW();
  END IF;
  
  -- Set withdrawn_at when status changes to withdrawn
  IF NEW.status = 'withdrawn' AND OLD.status != 'withdrawn' THEN
    NEW.withdrawn_at = NOW();
  END IF;
  
  -- Calculate overall rating if individual ratings are provided
  IF NEW.technical_skills_rating IS NOT NULL OR NEW.cultural_fit_rating IS NOT NULL OR NEW.communication_skills_rating IS NOT NULL THEN
    NEW.overall_rating = (
      COALESCE(NEW.technical_skills_rating, 0) + 
      COALESCE(NEW.cultural_fit_rating, 0) + 
      COALESCE(NEW.communication_skills_rating, 0)
    ) / 3;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set organization context for conversations
CREATE OR REPLACE FUNCTION public.set_conversation_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from created_by_member if available
  IF NEW.organization_id IS NULL AND NEW.created_by_member_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.organization_members
    WHERE id = NEW.created_by_member_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set organization context for messages
CREATE OR REPLACE FUNCTION public.set_message_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from conversation
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.conversations
    WHERE id = NEW.conversation_id;
  END IF;
  
  -- Set sender_member_id if available
  IF NEW.sender_member_id IS NULL AND NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.sender_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.sender_id 
    AND om.organization_id = NEW.organization_id
    AND om.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_id = NEW.id,
    last_message_preview = CASE 
      WHEN LENGTH(NEW.body) > 100 THEN LEFT(NEW.body, 100) || '...'
      ELSE NEW.body
    END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set organization context for network connections
CREATE OR REPLACE FUNCTION public.set_network_connection_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to find common organization between users
  IF NEW.organization_id IS NULL THEN
    SELECT om1.organization_id INTO NEW.organization_id
    FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = NEW.user_a 
      AND om2.user_id = NEW.user_b
      AND om1.is_active = true
      AND om2.is_active = true
    LIMIT 1;
  END IF;
  
  -- Set member IDs if organization is found
  IF NEW.organization_id IS NOT NULL THEN
    -- Set requester member ID
    SELECT id INTO NEW.requester_member_id
    FROM public.organization_members
    WHERE user_id = NEW.requester_id 
      AND organization_id = NEW.organization_id
      AND is_active = true
    LIMIT 1;
    
    -- Set receiver member ID
    SELECT id INTO NEW.receiver_member_id
    FROM public.organization_members
    WHERE user_id = NEW.receiver_id 
      AND organization_id = NEW.organization_id
      AND is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set organization context for donations
CREATE OR REPLACE FUNCTION public.set_donation_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from campaign if provided
  IF NEW.organization_id IS NULL AND NEW.campaign_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.donation_campaigns
    WHERE id = NEW.campaign_id;
  END IF;
  
  -- Set donor_member_id if organization is found
  IF NEW.organization_id IS NOT NULL AND NEW.donor_id IS NOT NULL THEN
    SELECT om.id INTO NEW.donor_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.donor_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Calculate net amount if not provided
  IF NEW.net_amount IS NULL THEN
    NEW.net_amount = NEW.amount - COALESCE(NEW.fee_amount, 0) - COALESCE(NEW.tax_amount, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update campaign totals
CREATE OR REPLACE FUNCTION public.update_campaign_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    UPDATE public.donation_campaigns
    SET 
      current_amount = current_amount + NEW.amount,
      donor_count = donor_count + 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    UPDATE public.donation_campaigns
    SET 
      current_amount = current_amount + NEW.amount,
      donor_count = donor_count + 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' THEN
    UPDATE public.donation_campaigns
    SET 
      current_amount = current_amount - OLD.amount,
      donor_count = donor_count - 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set organization context for stories
CREATE OR REPLACE FUNCTION public.set_story_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from author's primary organization if not provided
  IF NEW.organization_id IS NULL THEN
    SELECT primary_organization_id INTO NEW.organization_id
    FROM public.profiles
    WHERE id = NEW.author_id;
  END IF;
  
  -- Set author_member_id if organization is found
  IF NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.author_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.author_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Calculate reading time if content is provided (assuming 200 words per minute)
  IF NEW.content IS NOT NULL AND NEW.reading_time_minutes IS NULL THEN
    NEW.word_count := array_length(regexp_split_to_array(NEW.content, '\s+'), 1);
    NEW.reading_time_minutes := GREATEST(1, CEIL(NEW.word_count::decimal / 200));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update story engagement counts
CREATE OR REPLACE FUNCTION public.update_story_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'story_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.stories
      SET 
        like_count = like_count + 1,
        updated_at = NOW()
      WHERE id = NEW.story_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.stories
      SET 
        like_count = like_count - 1,
        updated_at = NOW()
      WHERE id = OLD.story_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'story_comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.stories
      SET 
        comment_count = comment_count + 1,
        updated_at = NOW()
      WHERE id = NEW.story_id;
      
      -- Update parent comment reply count if it's a reply
      IF NEW.parent_comment_id IS NOT NULL THEN
        UPDATE public.story_comments
        SET 
          reply_count = reply_count + 1,
          updated_at = NOW()
        WHERE id = NEW.parent_comment_id;
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.stories
      SET 
        comment_count = comment_count - 1,
        updated_at = NOW()
      WHERE id = OLD.story_id;
      
      -- Update parent comment reply count if it was a reply
      IF OLD.parent_comment_id IS NOT NULL THEN
        UPDATE public.story_comments
        SET 
          reply_count = reply_count - 1,
          updated_at = NOW()
        WHERE id = OLD.parent_comment_id;
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set organization context for notifications
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

-- Function to automatically set organization context for user settings
CREATE OR REPLACE FUNCTION public.set_user_settings_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from user's primary organization if not provided
  IF NEW.organization_id IS NULL THEN
    SELECT primary_organization_id INTO NEW.organization_id
    FROM public.profiles
    WHERE id = NEW.user_id;
  END IF;
  
  -- Set user_member_id if organization is found
  IF NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.user_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.user_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update last accessed time
CREATE OR REPLACE FUNCTION public.update_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create default settings for existing users
CREATE OR REPLACE FUNCTION public.create_default_user_settings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, organization_id, user_member_id)
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

-- Create default organization settings when user joins org
CREATE OR REPLACE FUNCTION public.create_default_org_user_settings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.organization_user_settings (user_id, organization_id, user_member_id)
  VALUES (NEW.user_id, NEW.organization_id, NEW.id)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Function to automatically set organization context for audit logs
CREATE OR REPLACE FUNCTION public.set_audit_log_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from admin_member if available
  IF NEW.organization_id IS NULL AND NEW.admin_member_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.organization_members
    WHERE id = NEW.admin_member_id;
  END IF;
  
  -- Set admin_member_id if admin_user_id is provided and organization is found
  IF NEW.admin_member_id IS NULL AND NEW.admin_user_id IS NOT NULL AND NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.admin_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.admin_user_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Generate request ID if not provided
  IF NEW.request_id IS NULL THEN
    NEW.request_id := encode(gen_random_bytes(16), 'hex');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create default audit configuration for organizations
CREATE OR REPLACE FUNCTION public.create_default_audit_configuration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.audit_log_configurations (
    organization_id,
    created_by_member_id,
    name,
    description
  ) VALUES (
    NEW.id,
    NULL, -- Will be set by the system
    'Default Audit Configuration',
    'Automatically created audit configuration for the organization'
  );
  
  RETURN NEW;
END;
$$;

-- Function to automatically set organization context for analytics
CREATE OR REPLACE FUNCTION public.set_analytics_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from actor's primary organization if not provided
  IF NEW.organization_id IS NULL AND NEW.actor_id IS NOT NULL THEN
    SELECT primary_organization_id INTO NEW.organization_id
    FROM public.profiles
    WHERE id = NEW.actor_id;
  END IF;
  
  -- Set actor_member_id if organization is found
  IF NEW.organization_id IS NOT NULL AND NEW.actor_id IS NOT NULL THEN
    SELECT om.id INTO NEW.actor_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.actor_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Generate session_id if not provided for page views
  IF NEW.session_id IS NULL AND NEW.event_type = 'page_view' THEN
    NEW.session_id := gen_random_uuid();
  END IF;
  
  -- Generate request_id if not provided
  IF NEW.request_id IS NULL THEN
    NEW.request_id := encode(gen_random_bytes(16), 'hex');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create default metrics for organizations
CREATE OR REPLACE FUNCTION public.create_default_analytics_metrics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create default business metrics
  INSERT INTO public.analytics_metrics (
    organization_id,
    metric_name,
    metric_type,
    metric_category,
    description,
    calculation_query
  ) VALUES 
  (
    NEW.id,
    'daily_active_users',
    'unique',
    'user',
    'Number of unique users with activity per day',
    'SELECT COUNT(DISTINCT actor_id) FROM analytics_events WHERE organization_id = {{organization_id}} AND DATE(created_at) = CURRENT_DATE'
  ),
  (
    NEW.id,
    'user_registrations',
    'count',
    'user',
    'Total number of user registrations',
    'SELECT COUNT(*) FROM profiles WHERE primary_organization_id = {{organization_id}} AND DATE(created_at) = CURRENT_DATE'
  ),
  (
    NEW.id,
    'donation_conversion_rate',
    'rate',
    'revenue',
    'Percentage of visitors who make a donation',
    'SELECT (COUNT(DISTINCT CASE WHEN event_type = ''donation'' THEN actor_id END)::decimal / COUNT(DISTINCT actor_id)::decimal) * 100 FROM analytics_events WHERE organization_id = {{organization_id}} AND DATE(created_at) = CURRENT_DATE'
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER set_event_attendee_organization_trigger
  BEFORE INSERT ON public.event_attendees
  FOR EACH ROW EXECUTE FUNCTION public.set_event_attendee_organization();

CREATE TRIGGER check_event_capacity_trigger
  BEFORE INSERT ON public.event_attendees
  FOR EACH ROW EXECUTE FUNCTION public.check_event_capacity();

CREATE TRIGGER set_job_organization_trigger
  BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_job_organization();

CREATE TRIGGER set_job_application_organization_trigger
  BEFORE INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_job_application_organization();

CREATE TRIGGER update_application_timeline_trigger
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_application_timeline();

CREATE TRIGGER set_conversation_organization_trigger
  BEFORE INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_conversation_organization();

CREATE TRIGGER set_message_organization_trigger
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_message_organization();

CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

CREATE TRIGGER set_network_connection_organization_trigger
  BEFORE INSERT ON public.network_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_network_connection_organization();

CREATE TRIGGER set_donation_organization_trigger
  BEFORE INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.set_donation_organization();

CREATE TRIGGER update_campaign_totals_trigger
  AFTER INSERT OR UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_totals();

CREATE TRIGGER set_story_organization_trigger
  BEFORE INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.set_story_organization();

CREATE TRIGGER update_story_likes_count_trigger
  AFTER INSERT OR DELETE ON public.story_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_story_engagement_counts();

CREATE TRIGGER update_story_comments_count_trigger
  AFTER INSERT OR DELETE ON public.story_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_story_engagement_counts();

CREATE TRIGGER set_notification_organization_trigger
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_notification_organization();

CREATE TRIGGER create_default_notification_preferences_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_preferences();

CREATE TRIGGER set_user_settings_organization_trigger
  BEFORE INSERT ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_user_settings_organization();

CREATE TRIGGER set_org_user_settings_organization_trigger
  BEFORE INSERT ON public.organization_user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_user_settings_organization();

CREATE TRIGGER set_user_sessions_organization_trigger
  BEFORE INSERT ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_user_settings_organization();

CREATE TRIGGER set_user_data_exports_organization_trigger
  BEFORE INSERT ON public.user_data_exports
  FOR EACH ROW EXECUTE FUNCTION public.set_user_settings_organization();

CREATE TRIGGER update_user_settings_last_accessed_trigger
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_last_accessed();

CREATE TRIGGER create_default_user_settings_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_user_settings();

CREATE TRIGGER create_default_org_user_settings_trigger
  AFTER INSERT ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.create_default_org_user_settings();

CREATE TRIGGER set_audit_log_organization_trigger
  BEFORE INSERT ON public.admin_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_log_organization();

CREATE TRIGGER create_default_audit_configuration_trigger
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.create_default_audit_configuration();

CREATE TRIGGER set_analytics_organization_trigger
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.set_analytics_organization();

CREATE TRIGGER create_default_analytics_metrics_trigger
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.create_default_analytics_metrics();