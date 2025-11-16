-- 0601_seed_orgs.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Insert sample organizations with different types
INSERT INTO public.organizations (
  id, 
  name, 
  slug, 
  organization_type, 
  description, 
  website, 
  contact_email, 
  is_active, 
  is_verified,
  created_at,
  updated_at
) VALUES 
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Stanford University Alumni', 
  'stanford-university', 
  'educational',
  'Official alumni network for Stanford University graduates. Connecting leaders, innovators, and change-makers worldwide.',
  'https://alumni.stanford.edu',
  'alumni@stanford.edu',
  true,
  true,
  now(),
  now()
),
(
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  'Tech Innovators Inc.', 
  'tech-innovators', 
  'corporate',
  'Leading technology company focused on AI and machine learning solutions for enterprise clients.',
  'https://techinnovators.com',
  'careers@techinnovators.com',
  true,
  true,
  now(),
  now()
),
(
  'c3d4e5f6-g7h8-9012-cdef-345678901234',
  'Global Health Foundation', 
  'global-health', 
  'non_profit',
  'Non-profit organization dedicated to improving healthcare access in underserved communities worldwide.',
  'https://globalhealth.org',
  'info@globalhealth.org',
  true,
  true,
  now(),
  now()
),
(
  'd4e5f6g7-h8i9-0123-defg-456789012345',
  'MIT Engineering Alumni', 
  'mit-engineering', 
  'educational',
  'MIT School of Engineering alumni community. Fostering innovation and collaboration among engineering graduates.',
  'https://engineering.mit.edu/alumni',
  'engineering-alumni@mit.edu',
  true,
  true,
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  organization_type = EXCLUDED.organization_type,
  description = EXCLUDED.description,
  website = EXCLUDED.website,
  contact_email = EXCLUDED.contact_email,
  updated_at = now();

-- Create organization settings for each organization
INSERT INTO public.organization_settings (
  organization_id,
  settings,
  created_at,
  updated_at
) 
SELECT 
  id,
  jsonb_build_object(
    'allow_member_invites', true,
    'require_approval', false,
    'max_members', null,
    'allowed_domains', CASE 
      WHEN slug = 'stanford-university' THEN '["stanford.edu", "alumni.stanford.edu"]'::jsonb
      WHEN slug = 'mit-engineering' THEN '["mit.edu", "alum.mit.edu"]'::jsonb
      ELSE '[]'::jsonb
    END,
    'theme', 'default',
    'features', jsonb_build_object(
      'alumni_network', true,
      'events', true,
      'job_postings', true,
      'donations', true,
      'mentorship', true
    )
  ),
  now(),
  now()
FROM public.organizations
ON CONFLICT (organization_id) DO UPDATE SET
  settings = EXCLUDED.settings,
  updated_at = now();

-- Create default roles for each organization using the function
DO $$ 
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM public.organizations 
  LOOP
    -- Call the function to create default roles for this organization
    PERFORM public.create_default_organization_roles(org_record.id);
  END LOOP;
END $$;

-- Create sample admin users for each organization
INSERT INTO public.profiles (
  id,
  auth_user_id,
  email,
  full_name,
  headline,
  user_type,
  primary_organization_id,
  is_active,
  is_verified,
  created_at,
  updated_at
) VALUES 
-- Stanford University Admins
(
  'f1a2b3c4-d5e6-7890-abcd-ef1234567890',
  gen_random_uuid(),
  'president@stanford.edu',
  'Dr. Sarah Chen',
  'President - Stanford Alumni Association',
  'admin',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  true,
  true,
  now(),
  now()
),
(
  'f2b3c4d5-e6f7-8901-bcde-f23456789012',
  gen_random_uuid(),
  'dean.engineering@stanford.edu',
  'Dr. Michael Rodriguez',
  'Dean of Engineering - Stanford University',
  'admin',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  true,
  true,
  now(),
  now()
),
-- Tech Innovators Admins
(
  'f3c4d5e6-f7g8-9012-cdef-345678901234',
  gen_random_uuid(),
  'ceo@techinnovators.com',
  'Jennifer Parker',
  'CEO - Tech Innovators Inc.',
  'admin',
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  true,
  true,
  now(),
  now()
),
(
  'f4d5e6f7-g8h9-0123-defg-456789012345',
  gen_random_uuid(),
  'cto@techinnovators.com',
  'David Kim',
  'CTO - Tech Innovators Inc.',
  'admin',
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  true,
  true,
  now(),
  now()
),
-- Global Health Foundation Admins
(
  'f5e6f7g8-h9i0-1234-efgh-567890123456',
  gen_random_uuid(),
  'director@globalhealth.org',
  'Dr. Maria Gonzalez',
  'Executive Director - Global Health Foundation',
  'admin',
  'c3d4e5f6-g7h8-9012-cdef-345678901234',
  true,
  true,
  now(),
  now()
),
-- MIT Engineering Admins
(
  'f6f7g8h9-i0j1-2345-fghi-678901234567',
  gen_random_uuid(),
  'chair@mit.edu',
  'Dr. Robert Thompson',
  'Department Chair - MIT Engineering',
  'admin',
  'd4e5f6g7-h8i9-0123-defg-456789012345',
  true,
  true,
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  headline = EXCLUDED.headline,
  primary_organization_id = EXCLUDED.primary_organization_id,
  updated_at = now();

-- Create organization members for admin users
INSERT INTO public.organization_members (
  organization_id,
  user_id,
  role_id,
  title,
  department,
  is_active,
  is_verified,
  membership_status,
  created_at,
  updated_at
)
SELECT 
  p.primary_organization_id,
  p.id,
  r.id,
  CASE 
    WHEN p.email = 'president@stanford.edu' THEN 'President'
    WHEN p.email = 'dean.engineering@stanford.edu' THEN 'Dean of Engineering'
    WHEN p.email = 'ceo@techinnovators.com' THEN 'Chief Executive Officer'
    WHEN p.email = 'cto@techinnovators.com' THEN 'Chief Technology Officer'
    WHEN p.email = 'director@globalhealth.org' THEN 'Executive Director'
    WHEN p.email = 'chair@mit.edu' THEN 'Department Chair'
    ELSE 'Administrator'
  END,
  CASE 
    WHEN p.email = 'president@stanford.edu' THEN 'Alumni Association'
    WHEN p.email = 'dean.engineering@stanford.edu' THEN 'School of Engineering'
    WHEN p.email LIKE '%@techinnovators.com' THEN 'Executive Leadership'
    WHEN p.email = 'director@globalhealth.org' THEN 'Executive Office'
    WHEN p.email = 'chair@mit.edu' THEN 'Engineering Department'
    ELSE 'Administration'
  END,
  true,
  true,
  'active',
  now(),
  now()
FROM public.profiles p
JOIN public.organizations o ON p.primary_organization_id = o.id
JOIN public.organization_roles r ON r.organization_id = o.id AND r.name = 'super_admin'
WHERE p.email IN (
  'president@stanford.edu',
  'dean.engineering@stanford.edu',
  'ceo@techinnovators.com',
  'cto@techinnovators.com',
  'director@globalhealth.org',
  'chair@mit.edu'
)
ON CONFLICT (organization_id, user_id) DO UPDATE SET
  role_id = EXCLUDED.role_id,
  title = EXCLUDED.title,
  department = EXCLUDED.department,
  updated_at = now();

-- Update organizations with created_by references
UPDATE public.organizations 
SET created_by = p.id
FROM public.profiles p
WHERE (organizations.slug = 'stanford-university' AND p.email = 'president@stanford.edu')
   OR (organizations.slug = 'tech-innovators' AND p.email = 'ceo@techinnovators.com')
   OR (organizations.slug = 'global-health' AND p.email = 'director@globalhealth.org')
   OR (organizations.slug = 'mit-engineering' AND p.email = 'chair@mit.edu');

-- Create sample department/sub-admin roles for larger organizations
INSERT INTO public.organization_roles (
  organization_id,
  name,
  display_name,
  hierarchy_level,
  permissions,
  can_invite_roles,
  is_system_role,
  created_at,
  updated_at
) 
SELECT 
  o.id,
  'department_head',
  'Department Head',
  1, -- Between super_admin and faculty
  '{
    "manage_members": true,
    "manage_content": true,
    "manage_events": true,
    "view_analytics": true,
    "invite_members": true,
    "manage_stories": true
  }'::jsonb,
  ARRAY['faculty', 'staff', 'student', 'alumni'],
  false,
  now(),
  now()
FROM public.organizations o
WHERE o.slug IN ('stanford-university', 'mit-engineering')
ON CONFLICT (organization_id, name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  permissions = EXCLUDED.permissions,
  updated_at = now();

-- Create sample faculty/staff members
INSERT INTO public.profiles (
  id,
  auth_user_id,
  email,
  full_name,
  headline,
  user_type,
  primary_organization_id,
  graduation_year,
  location,
  is_active,
  is_verified,
  created_at,
  updated_at
) VALUES 
-- Stanford Faculty/Staff
(
  gen_random_uuid(),
  gen_random_uuid(),
  'professor.miller@stanford.edu',
  'Dr. James Miller',
  'Professor of Computer Science',
  'faculty',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  1995,
  'Stanford, CA',
  true,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'alumni.coordinator@stanford.edu',
  'Lisa Wong',
  'Alumni Relations Coordinator',
  'staff',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  2010,
  'Palo Alto, CA',
  true,
  true,
  now(),
  now()
),
-- Tech Innovators Employees
(
  gen_random_uuid(),
  gen_random_uuid(),
  'engineering.manager@techinnovators.com',
  'Alex Johnson',
  'Engineering Manager',
  'employee',
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  2012,
  'San Francisco, CA',
  true,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'hr.director@techinnovators.com',
  'Sarah Williams',
  'HR Director',
  'employee',
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  2008,
  'San Francisco, CA',
  true,
  true,
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;

-- Add faculty/staff to organization members with appropriate roles
INSERT INTO public.organization_members (
  organization_id,
  user_id,
  role_id,
  title,
  department,
  reports_to,
  is_active,
  is_verified,
  membership_status,
  created_at,
  updated_at
)
SELECT 
  p.primary_organization_id,
  p.id,
  r.id,
  CASE 
    WHEN p.email = 'professor.miller@stanford.edu' THEN 'Professor'
    WHEN p.email = 'alumni.coordinator@stanford.edu' THEN 'Alumni Relations Coordinator'
    WHEN p.email = 'engineering.manager@techinnovators.com' THEN 'Engineering Manager'
    WHEN p.email = 'hr.director@techinnovators.com' THEN 'HR Director'
  END,
  CASE 
    WHEN p.email = 'professor.miller@stanford.edu' THEN 'Computer Science'
    WHEN p.email = 'alumni.coordinator@stanford.edu' THEN 'Alumni Relations'
    WHEN p.email = 'engineering.manager@techinnovators.com' THEN 'Engineering'
    WHEN p.email = 'hr.director@techinnovators.com' THEN 'Human Resources'
  END,
  om.id, -- Report to the super admin
  true,
  true,
  'active',
  now(),
  now()
FROM public.profiles p
JOIN public.organizations o ON p.primary_organization_id = o.id
JOIN public.organization_roles r ON r.organization_id = o.id AND (
  (p.user_type = 'faculty' AND r.name = 'faculty') OR
  (p.user_type = 'staff' AND r.name = 'staff') OR
  (p.user_type = 'employee' AND r.name = 'employee')
)
JOIN public.organization_members om ON om.organization_id = o.id AND om.role_id IN (
  SELECT id FROM public.organization_roles WHERE name = 'super_admin'
)
WHERE p.email IN (
  'professor.miller@stanford.edu',
  'alumni.coordinator@stanford.edu',
  'engineering.manager@techinnovators.com',
  'hr.director@techinnovators.com'
)
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Create sample events for organizations
INSERT INTO public.events (
  id,
  organizer_id,
  organization_id,
  created_by_member_id,
  title,
  description,
  event_type,
  visibility,
  location,
  starts_at,
  ends_at,
  capacity,
  is_virtual,
  status,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  p.id,
  o.id,
  om.id,
  CASE 
    WHEN o.slug = 'stanford-university' THEN 'Annual Alumni Reunion 2024'
    WHEN o.slug = 'tech-innovators' THEN 'Tech Innovation Summit 2024'
    WHEN o.slug = 'global-health' THEN 'Global Health Conference 2024'
    WHEN o.slug = 'mit-engineering' THEN 'Engineering Symposium 2024'
  END,
  CASE 
    WHEN o.slug = 'stanford-university' THEN 'Join us for the annual Stanford University alumni reunion. Network with fellow graduates and celebrate our shared legacy.'
    WHEN o.slug = 'tech-innovators' THEN 'Annual technology summit featuring the latest innovations in AI, machine learning, and cloud computing.'
    WHEN o.slug = 'global-health' THEN 'International conference on global health challenges and innovative solutions for healthcare access.'
    WHEN o.slug = 'mit-engineering' THEN 'Symposium showcasing cutting-edge research and developments in engineering disciplines.'
  END,
  'conference',
  'public',
  CASE 
    WHEN o.slug = 'stanford-university' THEN 'Stanford Campus, Palo Alto, CA'
    WHEN o.slug = 'tech-innovators' THEN 'Moscone Center, San Francisco, CA'
    WHEN o.slug = 'global-health' THEN 'Virtual Event'
    WHEN o.slug = 'mit-engineering' THEN 'MIT Campus, Cambridge, MA'
  END,
  now() + INTERVAL '30 days',
  now() + INTERVAL '31 days',
  500,
  o.slug = 'global-health',
  'published',
  now(),
  now()
FROM public.organizations o
JOIN public.profiles p ON p.primary_organization_id = o.id AND p.email LIKE '%@' || 
  CASE 
    WHEN o.slug = 'stanford-university' THEN 'stanford.edu'
    WHEN o.slug = 'tech-innovators' THEN 'techinnovators.com'
    WHEN o.slug = 'global-health' THEN 'globalhealth.org'
    WHEN o.slug = 'mit-engineering' THEN 'mit.edu'
  END
JOIN public.organization_members om ON om.user_id = p.id AND om.organization_id = o.id
WHERE p.email IN (
  'president@stanford.edu',
  'ceo@techinnovators.com',
  'director@globalhealth.org',
  'chair@mit.edu'
)
ON CONFLICT DO NOTHING;

-- Create sample job postings
INSERT INTO public.jobs (
  id,
  poster_id,
  organization_id,
  created_by_member_id,
  title,
  company_name,
  location,
  description,
  employment_type,
  experience_level,
  department,
  salary_range,
  status,
  visibility,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  p.id,
  o.id,
  om.id,
  CASE 
    WHEN o.slug = 'stanford-university' THEN 'Senior Software Engineer'
    WHEN o.slug = 'tech-innovators' THEN 'Machine Learning Engineer'
    WHEN o.slug = 'global-health' THEN 'Program Director'
    WHEN o.slug = 'mit-engineering' THEN 'Research Scientist'
  END,
  o.name,
  CASE 
    WHEN o.slug = 'stanford-university' THEN 'Palo Alto, CA'
    WHEN o.slug = 'tech-innovators' THEN 'San Francisco, CA (Remote)'
    WHEN o.slug = 'global-health' THEN 'New York, NY'
    WHEN o.slug = 'mit-engineering' THEN 'Cambridge, MA'
  END,
  CASE 
    WHEN o.slug = 'stanford-university' THEN 'Looking for experienced software engineers to join our technology team.'
    WHEN o.slug = 'tech-innovators' THEN 'Join our AI research team to develop cutting-edge machine learning solutions.'
    WHEN o.slug = 'global-health' THEN 'Lead global health initiatives and manage international partnerships.'
    WHEN o.slug = 'mit-engineering' THEN 'Conduct innovative research in engineering and technology fields.'
  END,
  'full_time',
  'senior',
  CASE 
    WHEN o.slug = 'stanford-university' THEN 'Technology'
    WHEN o.slug = 'tech-innovators' THEN 'AI Research'
    WHEN o.slug = 'global-health' THEN 'Program Management'
    WHEN o.slug = 'mit-engineering' THEN 'Research & Development'
  END,
  '{"min": 120000, "max": 180000, "currency": "USD", "period": "yearly"}'::jsonb,
  'open',
  'public',
  now(),
  now()
FROM public.organizations o
JOIN public.profiles p ON p.primary_organization_id = o.id AND p.email LIKE '%@' || 
  CASE 
    WHEN o.slug = 'stanford-university' THEN 'stanford.edu'
    WHEN o.slug = 'tech-innovators' THEN 'techinnovators.com'
    WHEN o.slug = 'global-health' THEN 'globalhealth.org'
    WHEN o.slug = 'mit-engineering' THEN 'mit.edu'
  END
JOIN public.organization_members om ON om.user_id = p.id AND om.organization_id = o.id
WHERE p.email IN (
  'dean.engineering@stanford.edu',
  'cto@techinnovators.com',
  'director@globalhealth.org',
  'chair@mit.edu'
)
ON CONFLICT DO NOTHING;

-- Refresh materialized views to include seed data
SELECT public.refresh_materialized_views();

-- Output success message
DO $$ 
BEGIN
  RAISE NOTICE 'Successfully seeded organizations hierarchy with:';
  RAISE NOTICE '- 4 organizations (educational, corporate, non-profit)';
  RAISE NOTICE '- Super admin users for each organization';
  RAISE NOTICE '- Default role hierarchies';
  RAISE NOTICE '- Sample faculty/staff members';
  RAISE NOTICE '- Sample events and job postings';
  RAISE NOTICE '- Organization settings and configurations';
END $$;