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
  
  RETURN FOUND;
END;
$$;

-- Enhanced function to get job application statistics
CREATE OR REPLACE FUNCTION public.get_job_application_stats(job_uuid uuid)
RETURNS TABLE(
  total_applications bigint,
  new_applications bigint,
  reviewed_count bigint,
  interview_count bigint,
  offer_count bigint,
  hired_count bigint,
  rejected_count bigint,
  withdrawn_count bigint,
  average_rating decimal,
  referral_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status = 'applied') as new_applications,
    COUNT(*) FILTER (WHERE status = 'reviewed') as reviewed_count,
    COUNT(*) FILTER (WHERE application_stage IN ('technical', 'onsite')) as interview_count,
    COUNT(*) FILTER (WHERE status = 'offer') as offer_count,
    COUNT(*) FILTER (WHERE status = 'hired') as hired_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE status = 'withdrawn') as withdrawn_count,
    AVG(overall_rating) as average_rating,
    COUNT(*) FILTER (WHERE referred_by IS NOT NULL) as referral_count
  FROM public.job_applications
  WHERE job_id = job_uuid;
END;
$$;

-- Function to close expired job listings
CREATE OR REPLACE FUNCTION public.close_expired_jobs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.jobs
  SET status = 'closed'
  WHERE status = 'open'
    AND application_deadline IS NOT NULL
    AND application_deadline < NOW();
END;
$$;

-- Function to get applicant statistics
CREATE OR REPLACE FUNCTION public.get_applicant_stats(applicant_uuid uuid)
RETURNS TABLE(
  total_applications bigint,
  active_applications bigint,
  interview_count bigint,
  offer_count bigint,
  hired_count bigint,
  average_rating decimal
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status IN ('applied', 'reviewed', 'interview')) as active_applications,
    COUNT(*) FILTER (WHERE application_stage IN ('technical', 'onsite')) as interview_count,
    COUNT(*) FILTER (WHERE status = 'offer') as offer_count,
    COUNT(*) FILTER (WHERE status = 'hired') as hired_count,
    AVG(overall_rating) as average_rating
  FROM public.job_applications
  WHERE applicant_id = applicant_uuid;
END;
$$;

-- Function to check if user has already applied to a job
CREATE OR REPLACE FUNCTION public.has_applied_to_job(
  p_applicant_id uuid,
  p_job_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.job_applications 
    WHERE applicant_id = p_applicant_id AND job_id = p_job_id
  );
END;
$$;

-- Function to withdraw application
CREATE OR REPLACE FUNCTION public.withdraw_application(
  p_application_id uuid,
  p_applicant_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.job_applications
  SET 
    status = 'withdrawn',
    withdrawn_at = NOW(),
    updated_at = NOW()
  WHERE id = p_application_id
    AND (p_applicant_id IS NULL OR applicant_id = p_applicant_id);
  
  RETURN FOUND;
END;
$$;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number(
  p_organization_id uuid,
  p_fiscal_year integer
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_shortcode text;
  v_sequence_number integer;
  v_receipt_number text;
BEGIN
  -- Get organization shortcode (first 3 letters of name)
  SELECT UPPER(SUBSTRING(name FROM 1 FOR 3)) INTO v_org_shortcode
  FROM public.organizations
  WHERE id = p_organization_id;
  
  -- Get next sequence number for this org and fiscal year
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM '[0-9]+$') AS integer)), 0) + 1
  INTO v_sequence_number
  FROM public.donation_receipts
  WHERE organization_id = p_organization_id
    AND fiscal_year = p_fiscal_year;
  
  -- Format receipt number: ORG-YYYY-NNNN
  v_receipt_number := v_org_shortcode || '-' || p_fiscal_year || '-' || LPAD(v_sequence_number::text, 4, '0');
  
  RETURN v_receipt_number;
END;
$$;

-- Function to create receipt for donation
CREATE OR REPLACE FUNCTION public.create_donation_receipt(
  p_donation_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_donation_record RECORD;
  v_receipt_id uuid;
  v_fiscal_year integer;
  v_receipt_number text;
BEGIN
  -- Get donation details
  SELECT d.*, p.full_name, p.email, p.primary_organization_id
  INTO v_donation_record
  FROM public.donations d
  JOIN public.profiles p ON d.donor_id = p.id
  WHERE d.id = p_donation_id;
  
  -- Calculate fiscal year (assuming calendar year)
  v_fiscal_year := EXTRACT(YEAR FROM v_donation_record.created_at);
  
  -- Generate receipt number
  v_receipt_number := public.generate_receipt_number(v_donation_record.organization_id, v_fiscal_year);
  
  -- Create receipt
  INSERT INTO public.donation_receipts (
    donation_id,
    organization_id,
    receipt_number,
    receipt_date,
    fiscal_year,
    donor_name,
    donor_email,
    amount,
    currency,
    is_tax_deductible,
    tax_deductible_amount,
    status
  ) VALUES (
    p_donation_id,
    v_donation_record.organization_id,
    v_receipt_number,
    CURRENT_DATE,
    v_fiscal_year,
    v_donation_record.full_name,
    v_donation_record.email,
    v_donation_record.amount,
    v_donation_record.currency,
    v_donation_record.is_tax_deductible,
    CASE WHEN v_donation_record.is_tax_deductible THEN v_donation_record.amount ELSE 0 END,
    'draft'
  ) RETURNING id INTO v_receipt_id;
  
  -- Update donation with receipt sent time
  UPDATE public.donations
  SET receipt_sent_at = NOW()
  WHERE id = p_donation_id;
  
  RETURN v_receipt_id;
END;
$$;

-- Function to get donation statistics
CREATE OR REPLACE FUNCTION public.get_donation_stats(
  p_organization_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_donations bigint,
  total_amount numeric,
  average_donation numeric,
  largest_donation numeric,
  recurring_donations_count bigint,
  unique_donors_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_donations,
    COALESCE(SUM(amount), 0) as total_amount,
    COALESCE(AVG(amount), 0) as average_donation,
    COALESCE(MAX(amount), 0) as largest_donation,
    COUNT(*) FILTER (WHERE is_recurring = true) as recurring_donations_count,
    COUNT(DISTINCT donor_id) as unique_donors_count
  FROM public.donations
  WHERE organization_id = p_organization_id
    AND status = 'completed'
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_admin_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_before_snapshot jsonb DEFAULT NULL,
  p_after_snapshot jsonb DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_action_category text DEFAULT 'general',
  p_action_severity text DEFAULT 'info',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_log_id uuid;
  v_admin_member_id uuid;
  v_organization_id uuid;
BEGIN
  -- Determine organization context
  IF p_organization_id IS NULL THEN
    SELECT primary_organization_id INTO v_organization_id
    FROM public.profiles
    WHERE id = p_admin_user_id;
  ELSE
    v_organization_id := p_organization_id;
  END IF;
  
  -- Get admin member ID
  IF v_organization_id IS NOT NULL THEN
    SELECT om.id INTO v_admin_member_id
    FROM public.organization_members om
    WHERE om.user_id = p_admin_user_id 
      AND om.organization_id = v_organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Create audit log entry
  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    organization_id,
    admin_member_id,
    action,
    resource_type,
    resource_id,
    before_snapshot,
    after_snapshot,
    action_category,
    action_severity,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_user_id,
    v_organization_id,
    v_admin_member_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_before_snapshot,
    p_after_snapshot,
    p_action_category,
    p_action_severity,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  -- Check if this action should trigger an alert
  PERFORM public.check_audit_alert_conditions(v_log_id);
  
  RETURN v_log_id;
END;
$$;

-- Function to check alert conditions
CREATE OR REPLACE FUNCTION public.check_audit_alert_conditions(
  p_log_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_log_record RECORD;
  v_should_alert boolean := false;
  v_alert_type text;
  v_alert_severity text;
  v_alert_title text;
  v_alert_description text;
BEGIN
  -- Get the log record
  SELECT * INTO v_log_record
  FROM public.admin_audit_logs
  WHERE id = p_log_id;
  
  -- Check for failed login attempts
  IF v_log_record.action = 'login' AND v_log_record.status = 'failure' THEN
    -- Count recent failed logins for this user
    IF (
      SELECT COUNT(*) 
      FROM public.admin_audit_logs 
      WHERE admin_user_id = v_log_record.admin_user_id 
        AND action = 'login' 
        AND status = 'failure'
        AND created_at >= NOW() - INTERVAL '1 hour'
    ) >= 5 THEN
      v_should_alert := true;
      v_alert_type := 'failed_login';
      v_alert_severity := 'high';
      v_alert_title := 'Multiple failed login attempts detected';
      v_alert_description := 'User ' || v_log_record.admin_user_id || ' has multiple failed login attempts in a short period.';
    END IF;
  END IF;
  
  -- Check for sensitive operations
  IF v_log_record.action_severity IN ('high', 'critical') THEN
    v_should_alert := true;
    v_alert_type := 'sensitive_operation';
    v_alert_severity := v_log_record.action_severity;
    v_alert_title := 'Sensitive operation performed';
    v_alert_description := v_log_record.action || ' operation on ' || COALESCE(v_log_record.resource_type, 'system');
  END IF;
  
  -- Create alert if conditions are met
  IF v_should_alert THEN
    INSERT INTO public.audit_log_alerts (
      organization_id,
      triggered_by_member_id,
      alert_type,
      alert_severity,
      title,
      description,
      matched_logs,
      trigger_conditions
    ) VALUES (
      v_log_record.organization_id,
      v_log_record.admin_member_id,
      v_alert_type,
      v_alert_severity,
      v_alert_title,
      v_alert_description,
      jsonb_build_array(v_log_record.id),
      jsonb_build_object(
        'action', v_log_record.action,
        'severity', v_log_record.action_severity,
        'resource_type', v_log_record.resource_type
      )
    );
  END IF;
END;
$$;

-- Function to cleanup old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
  v_retention_days integer;
BEGIN
  -- Get retention period from configuration or use default
  SELECT COALESCE(
    (SELECT (rules->>'general_logs_retention')::integer 
     FROM public.audit_log_configurations 
     WHERE is_active = true 
     LIMIT 1),
    365
  ) INTO v_retention_days;
  
  WITH deleted AS (
    DELETE FROM public.admin_audit_logs
    WHERE created_at < NOW() - (v_retention_days || ' days')::interval
      AND is_sensitive = false
      AND is_archived = false
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- Function to get audit statistics
CREATE OR REPLACE FUNCTION public.get_audit_statistics(
  p_organization_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_actions bigint,
  successful_actions bigint,
  failed_actions bigint,
  unique_admins bigint,
  top_actions jsonb,
  action_categories jsonb,
  severity_distribution jsonb
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_actions,
    COUNT(*) FILTER (WHERE status = 'success') as successful_actions,
    COUNT(*) FILTER (WHERE status = 'failure') as failed_actions,
    COUNT(DISTINCT admin_user_id) as unique_admins,
    (
      SELECT jsonb_agg(jsonb_build_object('action', action, 'count', action_count))
      FROM (
        SELECT action, COUNT(*) as action_count
        FROM public.admin_audit_logs
        WHERE organization_id = p_organization_id
          AND (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY action
        ORDER BY action_count DESC
        LIMIT 10
      ) AS top_actions
    ) as top_actions,
    (
      SELECT jsonb_object_agg(action_category, category_count)
      FROM (
        SELECT action_category, COUNT(*) as category_count
        FROM public.admin_audit_logs
        WHERE organization_id = p_organization_id
          AND (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY action_category
      ) AS categories
    ) as action_categories,
    (
      SELECT jsonb_object_agg(action_severity, severity_count)
      FROM (
        SELECT action_severity, COUNT(*) as severity_count
        FROM public.admin_audit_logs
        WHERE organization_id = p_organization_id
          AND (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY action_severity
      ) AS severities
    ) as severity_distribution
  FROM public.admin_audit_logs
  WHERE organization_id = p_organization_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;

-- Function to create or update analytics session
CREATE OR REPLACE FUNCTION public.update_analytics_session(
  p_session_token text,
  p_user_id uuid DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_session_id uuid;
  v_user_member_id uuid;
  v_organization_id uuid;
BEGIN
  -- Determine organization context
  IF p_organization_id IS NULL AND p_user_id IS NOT NULL THEN
    SELECT primary_organization_id INTO v_organization_id
    FROM public.profiles
    WHERE id = p_user_id;
  ELSE
    v_organization_id := p_organization_id;
  END IF;
  
  -- Get user member ID
  IF v_organization_id IS NOT NULL AND p_user_id IS NOT NULL THEN
    SELECT om.id INTO v_user_member_id
    FROM public.organization_members om
    WHERE om.user_id = p_user_id 
      AND om.organization_id = v_organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Try to update existing session
  UPDATE public.analytics_sessions
  SET 
    last_activity_at = NOW(),
    page_views = page_views + 1,
    session_props = jsonb_set(
      COALESCE(session_props, '{}'::jsonb),
      '{exit_page}',
      to_jsonb(p_page_url)
    ),
    updated_at = NOW()
  WHERE session_token = p_session_token
    AND session_ended_at IS NULL
  RETURNING id INTO v_session_id;
  
  -- Create new session if not found
  IF NOT FOUND THEN
    INSERT INTO public.analytics_sessions (
      session_token,
      user_id,
      organization_id,
      user_member_id,
      user_agent,
      ip_address,
      session_props
    ) VALUES (
      p_session_token,
      p_user_id,
      v_organization_id,
      v_user_member_id,
      p_user_agent,
      p_ip_address,
      jsonb_set(
        '{"is_first_visit": true, "is_returning_user": false}'::jsonb,
        '{entry_page,exit_page}',
        to_jsonb(p_page_url)
      )
    ) RETURNING id INTO v_session_id;
  END IF;
  
  RETURN v_session_id;
END;
$$;

-- Function to calculate funnel conversion rates
CREATE OR REPLACE FUNCTION public.calculate_funnel_conversion(
  p_funnel_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  step_number integer,
  step_name text,
  user_count bigint,
  conversion_rate decimal,
  drop_off_rate decimal
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_funnel_record RECORD;
  v_steps jsonb;
  v_total_users bigint;
BEGIN
  -- Get funnel configuration
  SELECT * INTO v_funnel_record
  FROM public.analytics_funnels
  WHERE id = p_funnel_id;
  
  v_steps := v_funnel_record.steps;
  v_total_users := 0;
  
  -- For each step in the funnel, calculate conversion metrics
  FOR i IN 0..jsonb_array_length(v_steps) - 1 LOOP
    RETURN QUERY
    WITH step_users AS (
      SELECT DISTINCT actor_id
      FROM public.analytics_events
      WHERE event_type = (v_steps->i->>'event_type')::text
        AND organization_id = v_funnel_record.organization_id
        AND (p_start_date IS NULL OR created_at >= p_start_date)
        AND (p_end_date IS NULL OR created_at <= p_end_date)
        AND (v_steps->i->>'event_props' IS NULL OR 
             event_props @> (v_steps->i->>'event_props')::jsonb)
    )
    SELECT 
      (i + 1) as step_number,
      (v_steps->i->>'name')::text as step_name,
      COUNT(*) as user_count,
      CASE 
        WHEN i = 0 THEN 100.0
        ELSE (COUNT(*)::decimal / v_total_users::decimal) * 100
      END as conversion_rate,
      CASE 
        WHEN i = 0 THEN 0.0
        ELSE 100 - (COUNT(*)::decimal / v_total_users::decimal) * 100
      END as drop_off_rate
    FROM step_users;
    
    -- Store user count for next iteration
    SELECT COUNT(*) INTO v_total_users
    FROM (
      SELECT DISTINCT actor_id
      FROM public.analytics_events
      WHERE event_type = (v_steps->i->>'event_type')::text
        AND organization_id = v_funnel_record.organization_id
        AND (p_start_date IS NULL OR created_at >= p_start_date)
        AND (p_end_date IS NULL OR created_at <= p_end_date)
        AND (v_steps->i->>'event_props' IS NULL OR 
             event_props @> (v_steps->i->>'event_props')::jsonb)
    ) AS current_step;
  END LOOP;
END;
$$;

-- Function to cleanup old analytics data
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_data()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_events integer;
  deleted_sessions integer;
  retention_days integer := 365;
BEGIN
  -- Delete old events
  WITH deleted_events AS (
    DELETE FROM public.analytics_events
    WHERE created_at < NOW() - (retention_days || ' days')::interval
      AND is_processed = true
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_events FROM deleted_events;
  
  -- Delete old sessions
  WITH deleted_sessions AS (
    DELETE FROM public.analytics_sessions
    WHERE session_started_at < NOW() - (retention_days || ' days')::interval
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_sessions FROM deleted_sessions;
  
  RETURN deleted_events + deleted_sessions;
END;
$$;

-- Function to get organization analytics summary
CREATE OR REPLACE FUNCTION public.get_organization_analytics_summary(
  p_organization_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_events bigint,
  total_sessions bigint,
  unique_users bigint,
  average_session_duration decimal,
  most_popular_event_type text,
  top_country text,
  event_type_breakdown jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(DISTINCT actor_id) as unique_users,
    AVG(load_time_ms) as average_session_duration,
    MODE() WITHIN GROUP (ORDER BY event_type) as most_popular_event_type,
    MODE() WITHIN GROUP (ORDER BY country_code) as top_country,
    (
      SELECT jsonb_object_agg(event_type, event_count)
      FROM (
        SELECT event_type, COUNT(*) as event_count
        FROM public.analytics_events
        WHERE organization_id = p_organization_id
          AND (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
        GROUP BY event_type
        ORDER BY event_count DESC
        LIMIT 10
      ) AS event_breakdown
    ) as event_type_breakdown
  FROM public.analytics_events
  WHERE organization_id = p_organization_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;