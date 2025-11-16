-- Insert default organization roles
INSERT INTO public.organization_roles (id, organization_id, name, display_name, hierarchy_level, permissions)
SELECT 
  gen_random_uuid(),
  o.id,
  role_data.name,
  role_data.display_name,
  role_data.hierarchy_level,
  role_data.permissions
FROM public.organizations o
CROSS JOIN (VALUES 
  ('super_admin', 'Super Admin', 1, '{"manage_organization": true, "manage_members": true, "manage_roles": true, "manage_events": true, "manage_jobs": true, "manage_content": true, "view_analytics": true, "manage_settings": true}'::jsonb),
  ('admin', 'Administrator', 2, '{"manage_members": true, "manage_events": true, "manage_jobs": true, "manage_content": true, "view_analytics": true}'::jsonb),
  ('manager', 'Manager', 3, '{"manage_events": true, "manage_jobs": true, "manage_content": true, "view_analytics": true}'::jsonb),
  ('member', 'Member', 4, '{"create_events": true, "create_content": true, "view_analytics": false}'::jsonb),
  ('guest', 'Guest', 5, '{"view_events": true, "view_content": true, "view_analytics": false}'::jsonb)
) AS role_data(name, display_name, hierarchy_level, permissions)
WHERE NOT EXISTS (SELECT 1 FROM public.organization_roles WHERE organization_id = o.id);

-- Insert default event types
INSERT INTO public.events (
  id, organizer_id, organization_id, created_by_member_id,
  title, description, event_type, status, visibility,
  starts_at, ends_at, is_virtual, location
)
SELECT 
  gen_random_uuid(),
  p.id,
  p.primary_organization_id,
  om.id,
  event_data.title,
  event_data.description,
  event_data.event_type,
  'published',
  'public',
  NOW() + (event_data.days_offset || ' days')::interval,
  NOW() + (event_data.days_offset || ' days')::interval + INTERVAL '2 hours',
  event_data.is_virtual,
  event_data.location
FROM public.profiles p
JOIN public.organization_members om ON p.id = om.user_id AND p.primary_organization_id = om.organization_id
CROSS JOIN (VALUES 
  ('Welcome Event', 'Organization onboarding and welcome session', 'meetup', 7, false, 'Main Conference Room'),
  ('Team Building', 'Quarterly team building activities', 'workshop', 14, false, 'Office Campus'),
  ('Tech Talk', 'Latest technology trends and discussions', 'conference', 21, true, 'Virtual'),
  ('Networking Mixer', 'Professional networking event', 'networking', 28, false, 'Downtown Hub')
) AS event_data(title, description, event_type, days_offset, is_virtual, location)
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE organizer_id = p.id LIMIT 1)
LIMIT 1;

-- Insert default job categories
INSERT INTO public.jobs (
  id, poster_id, organization_id, created_by_member_id,
  title, description, employment_type, experience_level,
  department, location, status, application_deadline
)
SELECT 
  gen_random_uuid(),
  p.id,
  p.primary_organization_id,
  om.id,
  job_data.title,
  job_data.description,
  job_data.employment_type,
  job_data.experience_level,
  job_data.department,
  job_data.location,
  'open',
  NOW() + INTERVAL '30 days'
FROM public.profiles p
JOIN public.organization_members om ON p.id = om.user_id AND p.primary_organization_id = om.organization_id
CROSS JOIN (VALUES 
  ('Software Engineer', 'Develop and maintain software solutions', 'full_time', 'mid_level', 'Engineering', 'Remote'),
  ('Product Manager', 'Lead product development and strategy', 'full_time', 'senior', 'Product', 'San Francisco'),
  ('Marketing Specialist', 'Drive marketing campaigns and outreach', 'full_time', 'entry_level', 'Marketing', 'New York'),
  ('Data Analyst', 'Analyze business data and provide insights', 'contract', 'mid_level', 'Analytics', 'Remote')
) AS job_data(title, description, employment_type, experience_level, department, location)
WHERE NOT EXISTS (SELECT 1 FROM public.jobs WHERE poster_id = p.id LIMIT 1)
LIMIT 1;

-- Insert default notification templates
INSERT INTO public.notification_templates (
  id, organization_id, name, type, category, 
  title_template, body_template, is_active
)
SELECT 
  gen_random_uuid(),
  o.id,
  template_data.name,
  template_data.type,
  template_data.category,
  template_data.title_template,
  template_data.body_template,
  true
FROM public.organizations o
CROSS JOIN (VALUES 
  ('welcome', 'email', 'user', 'Welcome to {{organization_name}}', 'Hello {{user_name}}, welcome to {{organization_name}}! We are excited to have you on board.'),
  ('event_invite', 'push', 'event', 'You are invited: {{event_title}}', 'You have been invited to {{event_title}} on {{event_date}}.'),
  ('application_received', 'email', 'job', 'Application Received', 'Thank you for applying to {{job_title}}. We will review your application shortly.'),
  ('new_message', 'push', 'message', 'New message from {{sender_name}}', '{{sender_name}} sent you a new message: {{message_preview}}')
) AS template_data(name, type, category, title_template, body_template)
WHERE NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE organization_id = o.id LIMIT 1);

-- Insert default donation campaigns
INSERT INTO public.donation_campaigns (
  id, organization_id, title, description,
  goal_amount, current_amount, start_date, end_date,
  is_active, donor_count
)
SELECT 
  gen_random_uuid(),
  o.id,
  campaign_data.title,
  campaign_data.description,
  campaign_data.goal_amount,
  0,
  NOW(),
  NOW() + INTERVAL '90 days',
  true,
  0
FROM public.organizations o
CROSS JOIN (VALUES 
  ('Annual Fundraiser', 'Support our annual fundraising campaign to continue our mission', 50000.00),
  ('Scholarship Program', 'Help provide scholarships for deserving students', 25000.00),
  ('Community Outreach', 'Fund our community outreach and support programs', 15000.00)
) AS campaign_data(title, description, goal_amount)
WHERE NOT EXISTS (SELECT 1 FROM public.donation_campaigns WHERE organization_id = o.id LIMIT 1);

-- Insert default asset collections
INSERT INTO public.asset_collections (
  id, organization_id, name, description,
  visibility, is_public, slug
)
SELECT 
  gen_random_uuid(),
  o.id,
  collection_data.name,
  collection_data.description,
  'organization',
  true,
  LOWER(REPLACE(collection_data.name, ' ', '-'))
FROM public.organizations o
CROSS JOIN (VALUES 
  ('Marketing Materials', 'Brand assets and marketing collateral'),
  ('Team Photos', 'Company team and event photos'),
  ('Document Templates', 'Standard document templates and forms'),
  ('Presentation Decks', 'Sales and presentation slide decks')
) AS collection_data(name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.asset_collections WHERE organization_id = o.id LIMIT 1);

-- Insert default analytics metrics
INSERT INTO public.analytics_metrics (
  id, organization_id, metric_name, metric_type,
  metric_category, description, calculation_query
)
SELECT 
  gen_random_uuid(),
  o.id,
  metric_data.metric_name,
  metric_data.metric_type,
  metric_data.metric_category,
  metric_data.description,
  metric_data.calculation_query
FROM public.organizations o
CROSS JOIN (VALUES 
  ('daily_active_users', 'unique', 'user', 'Number of unique active users per day', 'SELECT COUNT(DISTINCT actor_id) FROM analytics_events WHERE organization_id = {{organization_id}} AND DATE(created_at) = CURRENT_DATE'),
  ('user_registrations', 'count', 'user', 'New user registrations per day', 'SELECT COUNT(*) FROM profiles WHERE primary_organization_id = {{organization_id}} AND DATE(created_at) = CURRENT_DATE'),
  ('event_attendance_rate', 'rate', 'event', 'Percentage of registered users who attend events', 'SELECT (COUNT(*) FILTER (WHERE status = ''attended'')::decimal / COUNT(*)::decimal) * 100 FROM event_attendees WHERE organization_id = {{organization_id}}'),
  ('donation_conversion', 'rate', 'revenue', 'Percentage of visitors who make donations', 'SELECT (COUNT(DISTINCT CASE WHEN event_type = ''donation'' THEN actor_id END)::decimal / COUNT(DISTINCT actor_id)::decimal) * 100 FROM analytics_events WHERE organization_id = {{organization_id}}')
) AS metric_data(metric_name, metric_type, metric_category, description, calculation_query)
WHERE NOT EXISTS (SELECT 1 FROM public.analytics_metrics WHERE organization_id = o.id LIMIT 1);

-- Insert default audit log configurations
INSERT INTO public.audit_log_configurations (
  id, organization_id, name, description,
  is_active, severity_level, action_categories
)
SELECT 
  gen_random_uuid(),
  o.id,
  config_data.name,
  config_data.description,
  true,
  config_data.severity_level,
  config_data.action_categories
FROM public.organizations o
CROSS JOIN (VALUES 
  ('User Management', 'Track all user management activities', 'medium', '{"user_management", "authentication"}'::jsonb),
  ('Content Moderation', 'Monitor content creation and modifications', 'low', '{"content", "moderation"}'::jsonb),
  ('Financial Transactions', 'Audit all financial transactions', 'high', '{"donations", "payments"}'::jsonb),
  ('Security Events', 'Track security-related activities', 'critical', '{"security", "authentication"}'::jsonb)
) AS config_data(name, description, severity_level, action_categories)
WHERE NOT EXISTS (SELECT 1 FROM public.audit_log_configurations WHERE organization_id = o.id LIMIT 1);

-- Create default conversation for organization
INSERT INTO public.conversations (
  id, organization_id, created_by_member_id,
  title, description, is_public, is_archived
)
SELECT 
  gen_random_uuid(),
  o.id,
  om.id,
  'General Discussion',
  'General organization discussion and announcements',
  true,
  false
FROM public.organizations o
JOIN public.organization_members om ON o.id = om.organization_id
WHERE om.role_id IN (SELECT id FROM public.organization_roles WHERE name = 'super_admin')
  AND NOT EXISTS (SELECT 1 FROM public.conversations WHERE organization_id = o.id AND title = 'General Discussion')
LIMIT 1;

-- Add all organization members to general conversation
INSERT INTO public.conversation_participants (
  id, conversation_id, participant_id,
  role, is_active, settings
)
SELECT 
  gen_random_uuid(),
  c.id,
  om.user_id,
  'member',
  true,
  '{"muted": false, "notifications": true}'::jsonb
FROM public.conversations c
JOIN public.organization_members om ON c.organization_id = om.organization_id
WHERE c.title = 'General Discussion'
  AND om.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = c.id AND cp.participant_id = om.user_id
  );

-- Output success message
DO $$ 
BEGIN
    RAISE NOTICE 'Default data inserted successfully:';
    RAISE NOTICE '- Organization roles with permissions';
    RAISE NOTICE '- Sample events for testing';
    RAISE NOTICE '- Job listings for careers section';
    RAISE NOTICE '- Notification templates for communication';
    RAISE NOTICE '- Donation campaigns for fundraising';
    RAISE NOTICE '- Asset collections for file organization';
    RAISE NOTICE '- Analytics metrics for tracking';
    RAISE NOTICE '- Audit log configurations for security';
    RAISE NOTICE '- General conversation for team communication';
END $$;