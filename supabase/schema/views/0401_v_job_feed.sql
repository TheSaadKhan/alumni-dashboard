-- View for enhanced attendee information
CREATE OR REPLACE VIEW public.event_attendee_details AS
SELECT 
  ea.*,
  p.full_name as attendee_name,
  p.email as attendee_email,
  p.avatar_url as attendee_avatar,
  p.headline as attendee_headline,
  e.title as event_title,
  e.starts_at as event_starts_at,
  e.ends_at as event_ends_at,
  e.location as event_location,
  e.is_virtual as event_is_virtual,
  org.name as organization_name,
  om.title as attendee_title,
  om.department as attendee_department
FROM public.event_attendees ea
JOIN public.profiles p ON ea.attendee_id = p.id
JOIN public.events e ON ea.event_id = e.id
LEFT JOIN public.organizations org ON ea.organization_id = org.id
LEFT JOIN public.organization_members om ON ea.attendee_member_id = om.id;

-- View for enhanced job information
CREATE OR REPLACE VIEW public.job_details AS
SELECT 
  j.*,
  p.full_name as poster_name,
  p.email as poster_email,
  p.avatar_url as poster_avatar,
  org.name as organization_name,
  om.title as poster_title,
  om.department as poster_department,
  (SELECT COUNT(*) FROM public.job_applications WHERE job_id = j.id) as total_applications,
  (SELECT COUNT(*) FROM public.job_applications WHERE job_id = j.id AND status = 'applied') as new_applications,
  (SELECT COUNT(*) FROM public.job_applications WHERE job_id = j.id AND status = 'hired') as hired_count,
  CASE 
    WHEN j.application_deadline < NOW() THEN 'expired'
    WHEN j.status = 'open' THEN 'active'
    ELSE j.status
  END as listing_status
FROM public.jobs j
JOIN public.profiles p ON j.poster_id = p.id
LEFT JOIN public.organizations org ON j.organization_id = org.id
LEFT JOIN public.organization_members om ON j.created_by_member_id = om.id;

-- View for application details
CREATE OR REPLACE VIEW public.job_application_details AS
SELECT 
  ja.*,
  j.title as job_title,
  j.company_name,
  j.employment_type,
  j.department as job_department,
  j.experience_level as job_experience_level,
  j.location as job_location,
  j.salary_range as job_salary_range,
  a.full_name as applicant_name,
  a.email as applicant_email,
  a.avatar_url as applicant_avatar,
  a.headline as applicant_headline,
  a.location as applicant_location,
  a.graduation_year as applicant_graduation_year,
  a.skills as applicant_skills,
  a.experience as applicant_experience,
  org.name as organization_name,
  am.title as applicant_title,
  am.department as applicant_department,
  referrer.full_name as referred_by_name,
  referrer.email as referred_by_email,
  referrer.avatar_url as referred_by_avatar
FROM public.job_applications ja
JOIN public.jobs j ON ja.job_id = j.id
JOIN public.profiles a ON ja.applicant_id = a.id
LEFT JOIN public.organizations org ON ja.organization_id = org.id
LEFT JOIN public.organization_members am ON ja.applicant_member_id = am.id
LEFT JOIN public.profiles referrer ON ja.referred_by = referrer.id;

-- View for enhanced story details
CREATE OR REPLACE VIEW public.story_details AS
SELECT 
  s.*,
  p.full_name as author_name,
  p.avatar_url as author_avatar,
  p.headline as author_headline,
  org.name as organization_name,
  am.title as author_title,
  am.department as author_department,
  (SELECT COUNT(*) FROM public.story_likes WHERE story_id = s.id) as total_likes,
  (SELECT COUNT(*) FROM public.story_comments WHERE story_id = s.id AND status = 'published') as total_comments,
  (SELECT COUNT(*) FROM public.story_collaborators WHERE story_id = s.id) as total_collaborators,
  -- Calculate engagement rate
  CASE 
    WHEN s.view_count > 0 THEN 
      ((COALESCE(s.like_count, 0) + COALESCE(s.comment_count, 0))::decimal / s.view_count::decimal) * 100 
    ELSE 0 
  END as engagement_rate
FROM public.stories s
JOIN public.profiles p ON s.author_id = p.id
LEFT JOIN public.organizations org ON s.organization_id = org.id
LEFT JOIN public.organization_members am ON s.author_member_id = am.id;

-- View for story collaboration details
CREATE OR REPLACE VIEW public.story_collaboration_details AS
SELECT 
  sc.*,
  s.title as story_title,
  s.slug as story_slug,
  s.status as story_status,
  s.visibility as story_visibility,
  c.full_name as collaborator_name,
  c.avatar_url as collaborator_avatar,
  c.headline as collaborator_headline,
  c.email as collaborator_email,
  org.name as organization_name,
  cm.title as collaborator_title,
  cm.department as collaborator_department
FROM public.story_collaborators sc
JOIN public.stories s ON sc.story_id = s.id
JOIN public.profiles c ON sc.collaborator_id = c.id
LEFT JOIN public.organizations org ON sc.organization_id = org.id
LEFT JOIN public.organization_members cm ON sc.collaborator_member_id = cm.id;

-- View for story comment details
CREATE OR REPLACE VIEW public.story_comment_details AS
SELECT 
  sc.*,
  s.title as story_title,
  s.slug as story_slug,
  a.full_name as author_name,
  a.avatar_url as author_avatar,
  a.headline as author_headline,
  org.name as organization_name,
  am.title as author_title,
  parent_comment.body as parent_comment_body,
  parent_author.full_name as parent_author_name
FROM public.story_comments sc
JOIN public.stories s ON sc.story_id = s.id
JOIN public.profiles a ON sc.author_id = a.id
LEFT JOIN public.organizations org ON sc.organization_id = org.id
LEFT JOIN public.organization_members am ON sc.author_member_id = am.id
LEFT JOIN public.story_comments parent_comment ON sc.parent_comment_id = parent_comment.id
LEFT JOIN public.profiles parent_author ON parent_comment.author_id = parent_author.id;

-- View for story like details
CREATE OR REPLACE VIEW public.story_like_details AS
SELECT 
  sl.*,
  s.title as story_title,
  s.slug as story_slug,
  u.full_name as user_name,
  u.avatar_url as user_avatar,
  u.headline as user_headline,
  org.name as organization_name,
  um.title as user_title
FROM public.story_likes sl
JOIN public.stories s ON sl.story_id = s.id
JOIN public.profiles u ON sl.user_id = u.id
LEFT JOIN public.organizations org ON sl.organization_id = org.id
LEFT JOIN public.organization_members um ON sl.user_member_id = um.id;

-- View for asset details
CREATE OR REPLACE VIEW public.asset_details AS
SELECT 
  a.*,
  p.full_name as profile_name,
  p.avatar_url as profile_avatar,
  p.email as profile_email,
  org.name as organization_name,
  pm.title as profile_title,
  pm.department as profile_department,
  uploader.full_name as uploaded_by_name,
  uploader.avatar_url as uploaded_by_avatar,
  ac.name as collection_name,
  ac.slug as collection_slug
FROM public.assets a
JOIN public.profiles p ON a.profile_id = p.id
LEFT JOIN public.organizations org ON a.organization_id = org.id
LEFT JOIN public.organization_members pm ON a.profile_member_id = pm.id
LEFT JOIN public.profiles uploader ON a.uploaded_by = uploader.id
LEFT JOIN public.asset_collections ac ON a.collection_id = ac.id;

-- View for asset collection details
CREATE OR REPLACE VIEW public.asset_collection_details AS
SELECT 
  ac.*,
  org.name as organization_name,
  creator.full_name as created_by_name,
  creator.avatar_url as created_by_avatar,
  cm.title as created_by_title,
  COUNT(acm.asset_id) as total_assets,
  COALESCE(SUM(a.file_size), 0) as total_size_bytes
FROM public.asset_collections ac
JOIN public.organizations org ON ac.organization_id = org.id
LEFT JOIN public.profiles creator ON ac.created_by = creator.id
LEFT JOIN public.organization_members cm ON ac.created_by_member_id = cm.id
LEFT JOIN public.asset_collection_memberships acm ON ac.id = acm.collection_id
LEFT JOIN public.assets a ON acm.asset_id = a.id
GROUP BY ac.id, org.name, creator.id, cm.id;

-- Output success message
DO $$ 
BEGIN
    RAISE NOTICE 'Enhanced database views created successfully:';
    RAISE NOTICE '- Event attendee details with comprehensive information';
    RAISE NOTICE '- Job and application details with statistics';
    RAISE NOTICE '- Story system views with engagement metrics';
    RAISE NOTICE '- Collaboration and comment details';
    RAISE NOTICE '- Asset management views with collection information';
END $$;