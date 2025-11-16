-- =========================================
-- Row Level Security (RLS) - Enhanced for organizations
-- =========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on additional tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================
-- RLS Policies for Profiles
-- =========================================
DROP POLICY IF EXISTS "Users can view all active profiles" ON public.profiles;
CREATE POLICY "Users can view all active profiles"
ON public.profiles FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- =========================================
-- RLS Policies for Organizations
-- =========================================
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
CREATE POLICY "Users can view organizations they belong to"
ON public.organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR is_public = true
);

DROP POLICY IF EXISTS "Super admins can manage organizations" ON public.organizations;
CREATE POLICY "Super admins can manage organizations"
ON public.organizations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = organizations.id
      AND om.is_active = true
      AND r.name = 'super_admin'
  )
);

-- =========================================
-- RLS Policies for Organization Members
-- =========================================
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
CREATE POLICY "Members can view organization members"
ON public.organization_members FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Admins can manage organization members" ON public.organization_members;
CREATE POLICY "Admins can manage organization members"
ON public.organization_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
      AND om.is_active = true
      AND r.permissions->>'manage_members' = 'true'
  )
);

DROP POLICY IF EXISTS "Users can update their own membership" ON public.organization_members;
CREATE POLICY "Users can update their own membership"
ON public.organization_members FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =========================================
-- RLS Policies for Events
-- =========================================
DROP POLICY IF EXISTS "Users can view events in their organizations" ON public.events;
CREATE POLICY "Users can view events in their organizations"
ON public.events FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR visibility = 'public'
);

DROP POLICY IF EXISTS "Users can manage events based on permissions" ON public.events;
CREATE POLICY "Users can manage events based on permissions"
ON public.events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.is_active = true
      AND (
        r.permissions->>'manage_events' = 'true'
        OR r.permissions->>'manage_content' = 'true'
      )
  )
);

-- =========================================
-- RLS Policies for Jobs
-- =========================================
DROP POLICY IF EXISTS "Users can view jobs in their organizations" ON public.jobs;
CREATE POLICY "Users can view jobs in their organizations"
ON public.jobs FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR visibility = 'public'
);

DROP POLICY IF EXISTS "Users can manage jobs based on permissions" ON public.jobs;
CREATE POLICY "Users can manage jobs based on permissions"
ON public.jobs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = jobs.organization_id
      AND om.is_active = true
      AND (
        r.permissions->>'manage_jobs' = 'true'
        OR r.permissions->>'manage_content' = 'true'
      )
  )
);

-- =========================================
-- RLS Policies for Job Applications
-- =========================================
DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;
CREATE POLICY "Users can view their own applications"
ON public.job_applications FOR SELECT
USING (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Users can create job applications" ON public.job_applications;
CREATE POLICY "Users can create job applications"
ON public.job_applications FOR INSERT
WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Recruiters can view applications in their organizations" ON public.job_applications;
CREATE POLICY "Recruiters can view applications in their organizations"
ON public.job_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.organization_members om ON om.organization_id = j.organization_id
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.is_active = true
      AND j.id = job_applications.job_id
      AND (
        r.permissions->>'manage_jobs' = 'true'
        OR r.permissions->>'manage_content' = 'true'
      )
  )
);

-- =========================================
-- RLS Policies for Stories
-- =========================================
DROP POLICY IF EXISTS "Users can view stories in their organizations" ON public.stories;
CREATE POLICY "Users can view stories in their organizations"
ON public.stories FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR visibility = 'public'
);

DROP POLICY IF EXISTS "Users can manage stories based on permissions" ON public.stories;
CREATE POLICY "Users can manage stories based on permissions"
ON public.stories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = stories.organization_id
      AND om.is_active = true
      AND (
        r.permissions->>'manage_stories' = 'true'
        OR r.permissions->>'manage_content' = 'true'
      )
  )
);

-- =========================================
-- RLS Policies for Conversations
-- =========================================
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in"
ON public.conversations FOR SELECT
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE participant_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- =========================================
-- RLS Policies for Messages
-- =========================================
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE participant_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE participant_id = auth.uid()
  )
);

-- =========================================
-- RLS Policies for Network Connections
-- =========================================
DROP POLICY IF EXISTS "Users can view their own connections" ON public.network_connections;
CREATE POLICY "Users can view their own connections"
ON public.network_connections FOR SELECT
USING (user_a = auth.uid() OR user_b = auth.uid());

DROP POLICY IF EXISTS "Users can create connection requests" ON public.network_connections;
CREATE POLICY "Users can create connection requests"
ON public.network_connections FOR INSERT
WITH CHECK (user_a = auth.uid());

DROP POLICY IF EXISTS "Users can update their connection requests" ON public.network_connections;
CREATE POLICY "Users can update their connection requests"
ON public.network_connections FOR UPDATE
USING (user_b = auth.uid() OR user_a = auth.uid());

-- =========================================
-- RLS Policies for Donations
-- =========================================
DROP POLICY IF EXISTS "Users can view their own donations" ON public.donations;
CREATE POLICY "Users can view their own donations"
ON public.donations FOR SELECT
USING (donor_id = auth.uid());

DROP POLICY IF EXISTS "Users can create donations" ON public.donations;
CREATE POLICY "Users can create donations"
ON public.donations FOR INSERT
WITH CHECK (donor_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view donations in their organizations" ON public.donations;
CREATE POLICY "Admins can view donations in their organizations"
ON public.donations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = donations.organization_id
      AND om.is_active = true
      AND r.permissions->>'manage_donations' = 'true'
  )
);

-- =========================================
-- RLS Policies for Assets
-- =========================================
DROP POLICY IF EXISTS "Users can view assets in their organizations" ON public.assets;
CREATE POLICY "Users can view assets in their organizations"
ON public.assets FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR visibility = 'public'
);

DROP POLICY IF EXISTS "Users can manage assets based on permissions" ON public.assets;
CREATE POLICY "Users can manage assets based on permissions"
ON public.assets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = assets.organization_id
      AND om.is_active = true
      AND r.permissions->>'manage_content' = 'true'
  )
  OR profile_id = auth.uid()
);

-- =========================================
-- RLS Policies for Notifications
-- =========================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (recipient_id = auth.uid());

-- =========================================
-- RLS Policies for User Settings
-- =========================================
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings"
ON public.user_settings FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings"
ON public.user_settings FOR ALL
USING (user_id = auth.uid());

-- =========================================
-- RLS Policies for Analytics
-- =========================================
DROP POLICY IF EXISTS "Admins can view analytics for their organizations" ON public.analytics_events;
CREATE POLICY "Admins can view analytics for their organizations"
ON public.analytics_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = analytics_events.organization_id
      AND om.is_active = true
      AND r.permissions->>'view_analytics' = 'true'
  )
);

-- =========================================
-- RLS Policies for Admin Audit Logs
-- =========================================
DROP POLICY IF EXISTS "Admins can view audit logs for their organizations" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs for their organizations"
ON public.admin_audit_logs FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
  AND admin_user_id = auth.uid()
);

-- =========================================
-- Function to check user permissions
-- =========================================
CREATE OR REPLACE FUNCTION public.check_user_permission(
  p_user_id uuid,
  p_organization_id uuid,
  p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_members om
    JOIN public.organization_roles r ON om.role_id = r.id
    WHERE om.user_id = p_user_id
      AND om.organization_id = p_organization_id
      AND om.is_active = true
      AND r.permissions->>p_permission = 'true'
  );
END;
$$;

-- =========================================
-- Function to get user organization roles
-- =========================================
CREATE OR REPLACE FUNCTION public.get_user_organization_roles(p_user_id uuid)
RETURNS TABLE(
  organization_id uuid,
  role_name text,
  permissions jsonb,
  is_system_role boolean
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    om.organization_id,
    r.name as role_name,
    r.permissions,
    r.is_system_role
  FROM public.organization_members om
  JOIN public.organization_roles r ON om.role_id = r.id
  WHERE om.user_id = p_user_id
    AND om.is_active = true;
END;
$$;