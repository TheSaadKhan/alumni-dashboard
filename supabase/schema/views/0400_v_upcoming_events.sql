-- View for member hierarchy
CREATE OR REPLACE VIEW public.organization_member_hierarchy AS
SELECT 
  om.id as member_id,
  om.organization_id,
  org.name as organization_name,
  om.user_id,
  p.full_name,
  p.email,
  om.role_id,
  orole.name as role_name,
  orole.display_name as role_display,
  orole.hierarchy_level,
  om.reports_to,
  reporter_p.full_name as reports_to_name,
  reporter_role.name as reports_to_role,
  om.invited_by,
  inviter_p.full_name as invited_by_name,
  om.title,
  om.department,
  om.membership_status,
  om.is_active,
  om.created_at
FROM public.organization_members om
JOIN public.organizations org ON om.organization_id = org.id
JOIN public.profiles p ON om.user_id = p.id
JOIN public.organization_roles orole ON om.role_id = orole.id
LEFT JOIN public.organization_members reporter ON om.reports_to = reporter.id
LEFT JOIN public.profiles reporter_p ON reporter.user_id = reporter_p.id
LEFT JOIN public.organization_roles reporter_role ON reporter.role_id = reporter_role.id
LEFT JOIN public.organization_members inviter ON om.invited_by = inviter.id
LEFT JOIN public.profiles inviter_p ON inviter.user_id = inviter_p.id;

-- View for event details with attendee counts
CREATE OR REPLACE VIEW public.event_details AS
SELECT 
  e.*,
  p.full_name as organizer_name,
  p.email as organizer_email,
  org.name as organization_name,
  (SELECT COUNT(*) FROM public.event_attendees WHERE event_id = e.id AND status IN ('registered', 'attended')) as attendee_count,
  (e.capacity IS NOT NULL AND (SELECT COUNT(*) FROM public.event_attendees WHERE event_id = e.id AND status IN ('registered', 'attended')) >= e.capacity) as is_full,
  CASE 
    WHEN e.starts_at > NOW() THEN 'upcoming'
    WHEN e.ends_at < NOW() THEN 'past'
    ELSE 'ongoing'
  END as event_timing
FROM public.events e
LEFT JOIN public.profiles p ON e.organizer_id = p.id
LEFT JOIN public.organizations org ON e.organization_id = org.id;

-- View for conversation details with participant count
CREATE OR REPLACE VIEW public.conversation_details AS
SELECT 
  c.*,
  COUNT(cp.id) as participant_count,
  ARRAY_AGG(DISTINCT jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'role', cp.role
  )) as participants
FROM public.conversations c
LEFT JOIN public.conversation_participants cp ON c.id = cp.conversation_id AND cp.is_active = true
LEFT JOIN public.profiles p ON cp.participant_id = p.id
GROUP BY c.id;

-- View for message details with sender information
CREATE OR REPLACE VIEW public.message_details AS
SELECT 
  m.*,
  p.full_name as sender_name,
  p.avatar_url as sender_avatar,
  p.email as sender_email,
  org.name as organization_name,
  om.title as sender_title,
  om.department as sender_department,
  rm.body as reply_to_body,
  rp.full_name as reply_to_sender_name
FROM public.messages m
JOIN public.profiles p ON m.sender_id = p.id
LEFT JOIN public.organizations org ON m.organization_id = org.id
LEFT JOIN public.organization_members om ON m.sender_member_id = om.id
LEFT JOIN public.messages rm ON m.reply_to_id = rm.id
LEFT JOIN public.profiles rp ON rm.sender_id = rp.id;

-- View for enhanced connection details
CREATE OR REPLACE VIEW public.connection_details AS
SELECT 
  nc.*,
  ua.full_name as user_a_name,
  ua.avatar_url as user_a_avatar,
  ua.headline as user_a_headline,
  ub.full_name as user_b_name,
  ub.avatar_url as user_b_avatar,
  ub.headline as user_b_headline,
  requester.full_name as requester_name,
  requester.avatar_url as requester_avatar,
  receiver.full_name as receiver_name,
  receiver.avatar_url as receiver_avatar,
  org.name as organization_name,
  (SELECT COUNT(*) FROM public.network_connections 
   WHERE (user_a = nc.user_a OR user_b = nc.user_a) 
     AND (user_a = nc.user_b OR user_b = nc.user_b)
     AND status = 'accepted') as mutual_connections_count
FROM public.network_connections nc
JOIN public.profiles ua ON nc.user_a = ua.id
JOIN public.profiles ub ON nc.user_b = ub.id
JOIN public.profiles requester ON nc.requester_id = requester.id
JOIN public.profiles receiver ON nc.receiver_id = receiver.id
LEFT JOIN public.organizations org ON nc.organization_id = org.id;

-- View for recommendation details
CREATE OR REPLACE VIEW public.recommendation_details AS
SELECT 
  cr.*,
  u.full_name as user_name,
  u.avatar_url as user_avatar,
  ru.full_name as recommended_user_name,
  ru.avatar_url as recommended_user_avatar,
  ru.headline as recommended_user_headline,
  org.name as organization_name,
  (SELECT COUNT(*) FROM public.network_connections 
   WHERE (user_a = cr.user_id OR user_b = cr.user_id) 
     AND (user_a = cr.recommended_user_id OR user_b = cr.recommended_user_id)
     AND status = 'accepted') as mutual_connections_count
FROM public.connection_recommendations cr
JOIN public.profiles u ON cr.user_id = u.id
JOIN public.profiles ru ON cr.recommended_user_id = ru.id
LEFT JOIN public.organizations org ON cr.organization_id = org.id;

-- View for enhanced donation details
CREATE OR REPLACE VIEW public.donation_details AS
SELECT 
  d.*,
  p.full_name as donor_name,
  p.email as donor_email,
  p.avatar_url as donor_avatar,
  org.name as organization_name,
  dc.title as campaign_title,
  dm.title as donor_title,
  dm.department as donor_department
FROM public.donations d
LEFT JOIN public.profiles p ON d.donor_id = p.id
LEFT JOIN public.organizations org ON d.organization_id = org.id
LEFT JOIN public.donation_campaigns dc ON d.campaign_id = dc.id
LEFT JOIN public.organization_members dm ON d.donor_member_id = dm.id;

-- View for campaign details with progress
CREATE OR REPLACE VIEW public.campaign_details AS
SELECT 
  dc.*,
  org.name as organization_name,
  COALESCE(dc.current_amount, 0) as raised_amount,
  CASE 
    WHEN dc.goal_amount > 0 THEN (COALESCE(dc.current_amount, 0) / dc.goal_amount) * 100 
    ELSE 0 
  END as progress_percentage,
  CASE 
    WHEN dc.end_date < NOW() THEN 'ended'
    WHEN dc.start_date > NOW() THEN 'upcoming'
    ELSE 'active'
  END as campaign_status,
  COUNT(DISTINCT d.donor_id) as actual_donor_count
FROM public.donation_campaigns dc
JOIN public.organizations org ON dc.organization_id = org.id
LEFT JOIN public.donations d ON dc.id = d.campaign_id AND d.status = 'completed'
GROUP BY dc.id, org.name;

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
  AVG(EXTRACT(EPOCH FROM (read_at - created_at))) FILTER (WHERE read_at IS NOT NULL) as avg_read_time_seconds
FROM public.notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY organization_id, type, category;

-- View for enhanced user settings
CREATE OR REPLACE VIEW public.user_settings_details AS
SELECT 
  us.*,
  p.full_name,
  p.email,
  p.avatar_url,
  org.name as organization_name,
  um.title as user_title,
  um.department as user_department
FROM public.user_settings us
JOIN public.profiles p ON us.user_id = p.id
LEFT JOIN public.organizations org ON us.organization_id = org.id
LEFT JOIN public.organization_members um ON us.user_member_id = um.id;

-- View for organization settings details
CREATE OR REPLACE VIEW public.organization_user_settings_details AS
SELECT 
  ous.*,
  p.full_name,
  p.email,
  org.name as organization_name,
  um.title as user_title,
  um.department as user_department
FROM public.organization_user_settings ous
JOIN public.profiles p ON ous.user_id = p.id
JOIN public.organizations org ON ous.organization_id = org.id
LEFT JOIN public.organization_members um ON ous.user_member_id = um.id;

-- View for active sessions
CREATE OR REPLACE VIEW public.active_sessions AS
SELECT 
  us.*,
  p.full_name,
  p.email,
  org.name as organization_name,
  EXTRACT(EPOCH FROM (us.expires_at - NOW())) as seconds_remaining
FROM public.user_sessions us
JOIN public.profiles p ON us.user_id = p.id
LEFT JOIN public.organizations org ON us.organization_id = org.id
WHERE us.is_active = true 
  AND us.expires_at > NOW();

-- View for enhanced audit log details
CREATE OR REPLACE VIEW public.audit_log_details AS
SELECT 
  al.*,
  p.full_name as admin_name,
  p.email as admin_email,
  org.name as organization_name,
  am.title as admin_title,
  am.department as admin_department
FROM public.admin_audit_logs al
LEFT JOIN public.profiles p ON al.admin_user_id = p.id
LEFT JOIN public.organizations org ON al.organization_id = org.id
LEFT JOIN public.organization_members am ON al.admin_member_id = am.id;

-- View for audit alert details
CREATE OR REPLACE VIEW public.audit_alert_details AS
SELECT 
  aa.*,
  org.name as organization_name,
  p.full_name as triggered_by_name,
  p.email as triggered_by_email,
  ack_p.full_name as acknowledged_by_name,
  res_p.full_name as resolved_by_name
FROM public.audit_log_alerts aa
JOIN public.organizations org ON aa.organization_id = org.id
LEFT JOIN public.profiles p ON aa.triggered_by_member_id = p.id
LEFT JOIN public.profiles ack_p ON aa.acknowledged_by = ack_p.id
LEFT JOIN public.profiles res_p ON aa.resolved_by = res_p.id;

-- View for enhanced analytics event details
CREATE OR REPLACE VIEW public.analytics_event_details AS
SELECT 
  ae.*,
  p.full_name as actor_name,
  p.email as actor_email,
  org.name as organization_name,
  am.title as actor_title,
  am.department as actor_department
FROM public.analytics_events ae
LEFT JOIN public.profiles p ON ae.actor_id = p.id
LEFT JOIN public.organizations org ON ae.organization_id = org.id
LEFT JOIN public.organization_members am ON ae.actor_member_id = am.id;

-- View for session analytics
CREATE OR REPLACE VIEW public.analytics_session_details AS
SELECT 
  s.*,
  p.full_name as user_name,
  p.email as user_email,
  org.name as organization_name,
  um.title as user_title,
  um.department as user_department,
  COUNT(e.id) as total_events,
  MAX(e.created_at) as last_event_at
FROM public.analytics_sessions s
LEFT JOIN public.profiles p ON s.user_id = p.id
LEFT JOIN public.organizations org ON s.organization_id = org.id
LEFT JOIN public.organization_members um ON s.user_member_id = um.id
LEFT JOIN public.analytics_events e ON s.id = e.session_id
GROUP BY s.id, p.id, org.id, um.id;

-- View for story details with engagement metrics
CREATE OR REPLACE VIEW public.story_details AS
SELECT 
  s.*,
  p.full_name as author_name,
  p.avatar_url as author_avatar,
  org.name as organization_name,
  am.title as author_title,
  am.department as author_department,
  (SELECT COUNT(*) FROM public.story_likes WHERE story_id = s.id) as total_likes,
  (SELECT COUNT(*) FROM public.story_comments WHERE story_id = s.id AND status = 'published') as total_comments,
  (SELECT COUNT(*) FROM public.story_collaborators WHERE story_id = s.id) as total_collaborators
FROM public.stories s
JOIN public.profiles p ON s.author_id = p.id
LEFT JOIN public.organizations org ON s.organization_id = org.id
LEFT JOIN public.organization_members am ON s.author_member_id = am.id;

-- View for job details with application counts
CREATE OR REPLACE VIEW public.job_details AS
SELECT 
  j.*,
  p.full_name as poster_name,
  p.avatar_url as poster_avatar,
  org.name as organization_name,
  pm.title as poster_title,
  pm.department as poster_department,
  (SELECT COUNT(*) FROM public.job_applications WHERE job_id = j.id) as total_applications,
  (SELECT COUNT(*) FROM public.job_applications WHERE job_id = j.id AND status = 'applied') as new_applications,
  (SELECT COUNT(*) FROM public.job_applications WHERE job_id = j.id AND status = 'hired') as hired_count
FROM public.jobs j
JOIN public.profiles p ON j.poster_id = p.id
JOIN public.organizations org ON j.organization_id = org.id
LEFT JOIN public.organization_members pm ON j.created_by_member_id = pm.id;

-- Output success message
DO $$ 
BEGIN
    RAISE NOTICE 'Database views created successfully:';
    RAISE NOTICE '- Organization member hierarchy with reporting structure';
    RAISE NOTICE '- Event details with attendee counts and timing';
    RAISE NOTICE '- Conversation and message details with participant info';
    RAISE NOTICE '- Network connection and recommendation details';
    RAISE NOTICE '- Donation and campaign details with progress tracking';
    RAISE NOTICE '- Notification details and statistics';
    RAISE NOTICE '- User settings and session management views';
    RAISE NOTICE '- Audit log and analytics event details';
    RAISE NOTICE '- Story and job details with engagement metrics';
END $$;