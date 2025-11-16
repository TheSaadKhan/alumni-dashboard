-- Profiles indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_tenant_id_idx ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS profiles_primary_organization_id_idx ON public.profiles(primary_organization_id);
CREATE INDEX IF NOT EXISTS profiles_user_type_idx ON public.profiles(user_type);

-- Organization indexes
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_is_active_idx ON public.organizations(is_active);
CREATE INDEX IF NOT EXISTS organizations_created_by_idx ON public.organizations(created_by);

-- Organization members indexes
CREATE INDEX IF NOT EXISTS org_members_organization_id_idx ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS org_members_user_id_idx ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS org_members_role_id_idx ON public.organization_members(role_id);
CREATE INDEX IF NOT EXISTS org_members_reports_to_idx ON public.organization_members(reports_to);
CREATE INDEX IF NOT EXISTS org_members_is_active_idx ON public.organization_members(is_active);

-- Organization roles indexes
CREATE INDEX IF NOT EXISTS org_roles_organization_id_idx ON public.organization_roles(organization_id);
CREATE INDEX IF NOT EXISTS org_roles_hierarchy_level_idx ON public.organization_roles(hierarchy_level);

-- Organization invitations indexes
CREATE INDEX IF NOT EXISTS org_invitations_organization_id_idx ON public.organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS org_invitations_token_idx ON public.organization_invitations(token);
CREATE INDEX IF NOT EXISTS org_invitations_email_idx ON public.organization_invitations(email);
CREATE INDEX IF NOT EXISTS org_invitations_status_idx ON public.organization_invitations(status);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON public.events (starts_at);
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON public.events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON public.events (organization_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events (organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events (status);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events (visibility);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_by_member ON public.events (created_by_member_id);

-- Indexes for event attendees
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees (event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_attendee_id ON public.event_attendees (attendee_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_organization_id ON public.event_attendees (organization_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_status ON public.event_attendees (status);
CREATE INDEX IF NOT EXISTS idx_event_attendees_checked_in_at ON public.event_attendees (checked_in_at);
-- Safe way to create index only if column exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'event_attendees' 
        AND column_name = 'check_in_code'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_event_attendees_check_in_code 
        ON public.event_attendees (check_in_code);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_event_attendees_attendee_member ON public.event_attendees (attendee_member_id);

-- Indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_tags ON public.jobs USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_jobs_organization_id ON public.jobs (organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_poster_id ON public.jobs (poster_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON public.jobs (employment_type);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON public.jobs (featured);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs (created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_application_deadline ON public.jobs (application_deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON public.jobs (location);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON public.jobs (experience_level);

-- Indexes for job applications
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications (job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications (applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_organization_id ON public.job_applications (organization_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications (status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON public.job_applications (applied_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_application_stage ON public.job_applications (application_stage);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_member ON public.job_applications (applicant_member_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_referred_by ON public.job_applications (referred_by);
CREATE INDEX IF NOT EXISTS idx_job_applications_overall_rating ON public.job_applications (overall_rating);
CREATE INDEX IF NOT EXISTS idx_job_applications_phone_screen_at ON public.job_applications (phone_screen_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_hired_at ON public.job_applications (hired_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_withdrawn_at ON public.job_applications (withdrawn_at);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON public.conversations (organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations (type);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations (last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_is_public ON public.conversations (is_public);
CREATE INDEX IF NOT EXISTS idx_conversations_is_archived ON public.conversations (is_archived);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON public.messages (organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages (reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_pinned ON public.messages (is_pinned);

-- Indexes for conversation participants
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv_id ON public.conversation_participants (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_part_id ON public.conversation_participants (participant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_org_id ON public.conversation_participants (organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_is_active ON public.conversation_participants (is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_role ON public.conversation_participants (role);

-- Indexes for network connections
CREATE INDEX IF NOT EXISTS idx_network_connections_user_a ON public.network_connections (user_a);
CREATE INDEX IF NOT EXISTS idx_network_connections_user_b ON public.network_connections (user_b);
CREATE INDEX IF NOT EXISTS idx_network_connections_requester_id ON public.network_connections (requester_id);
CREATE INDEX IF NOT EXISTS idx_network_connections_receiver_id ON public.network_connections (receiver_id);
CREATE INDEX IF NOT EXISTS idx_network_connections_organization_id ON public.network_connections (organization_id);
CREATE INDEX IF NOT EXISTS idx_network_connections_status ON public.network_connections (status);
CREATE INDEX IF NOT EXISTS idx_network_connections_connection_type ON public.network_connections (connection_type);
CREATE INDEX IF NOT EXISTS idx_network_connections_created_at ON public.network_connections (created_at);

-- Indexes for connection recommendations
CREATE INDEX IF NOT EXISTS idx_connection_recommendations_user_id ON public.connection_recommendations (user_id);
CREATE INDEX IF NOT EXISTS idx_connection_recommendations_recommended_user_id ON public.connection_recommendations (recommended_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_recommendations_organization_id ON public.connection_recommendations (organization_id);
CREATE INDEX IF NOT EXISTS idx_connection_recommendations_confidence_score ON public.connection_recommendations (confidence_score);
CREATE INDEX IF NOT EXISTS idx_connection_recommendations_created_at ON public.connection_recommendations (created_at);

-- Indexes for donations
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations (created_at);
CREATE INDEX IF NOT EXISTS idx_donations_organization_id ON public.donations (organization_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON public.donations (donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations (status);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON public.donations (campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_is_recurring ON public.donations (is_recurring);
CREATE INDEX IF NOT EXISTS idx_donations_donation_type ON public.donations (donation_type);

-- Indexes for donation campaigns
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_organization_id ON public.donation_campaigns (organization_id);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_is_active ON public.donation_campaigns (is_active);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_is_featured ON public.donation_campaigns (is_featured);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_start_date ON public.donation_campaigns (start_date);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_end_date ON public.donation_campaigns (end_date);

-- Indexes for donation receipts
CREATE INDEX IF NOT EXISTS idx_donation_receipts_donation_id ON public.donation_receipts (donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_organization_id ON public.donation_receipts (organization_id);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_receipt_number ON public.donation_receipts (receipt_number);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_fiscal_year ON public.donation_receipts (fiscal_year);

-- Indexes for stories
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON public.stories (author_id);
CREATE INDEX IF NOT EXISTS idx_stories_organization_id ON public.stories (organization_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON public.stories (status);
CREATE INDEX IF NOT EXISTS idx_stories_visibility ON public.stories (visibility);
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON public.stories (published_at);
CREATE INDEX IF NOT EXISTS idx_stories_category ON public.stories (category);
CREATE INDEX IF NOT EXISTS idx_stories_featured ON public.stories (featured);
CREATE INDEX IF NOT EXISTS idx_stories_pinned ON public.stories (pinned);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories (created_at);
CREATE INDEX IF NOT EXISTS idx_stories_tags ON public.stories USING gin (tags);

-- Indexes for story collaborators
CREATE INDEX IF NOT EXISTS idx_story_collaborators_story_id ON public.story_collaborators (story_id);
CREATE INDEX IF NOT EXISTS idx_story_collaborators_collaborator_id ON public.story_collaborators (collaborator_id);
CREATE INDEX IF NOT EXISTS idx_story_collaborators_organization_id ON public.story_collaborators (organization_id);

-- Indexes for story likes
CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON public.story_likes (story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id ON public.story_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_organization_id ON public.story_likes (organization_id);

-- Indexes for story comments
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON public.story_comments (story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_author_id ON public.story_comments (author_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_parent_comment_id ON public.story_comments (parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_organization_id ON public.story_comments (organization_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_created_at ON public.story_comments (created_at);

-- Indexes for notifications
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

-- Indexes for notification preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_organization_id ON public.notification_preferences (organization_id);

-- Indexes for notification templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_organization_id ON public.notification_templates (organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON public.notification_templates (type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_is_active ON public.notification_templates (is_active);

-- Indexes for user settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings (user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_organization_id ON public.user_settings (organization_id);

-- Indexes for organization user settings
CREATE INDEX IF NOT EXISTS idx_org_user_settings_user_id ON public.organization_user_settings (user_id);
CREATE INDEX IF NOT EXISTS idx_org_user_settings_organization_id ON public.organization_user_settings (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_user_settings_user_member ON public.organization_user_settings (user_member_id);

-- Indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_organization_id ON public.user_sessions (organization_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions (is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions (expires_at);

-- Indexes for user data exports
CREATE INDEX IF NOT EXISTS idx_user_data_exports_user_id ON public.user_data_exports (user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_organization_id ON public.user_data_exports (organization_id);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_status ON public.user_data_exports (status);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_requested_at ON public.user_data_exports (requested_at);

-- Indexes for admin audit logs
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_organization_id ON public.admin_audit_logs (organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON public.admin_audit_logs (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_category ON public.admin_audit_logs (action_category);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_severity ON public.admin_audit_logs (action_severity);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_type ON public.admin_audit_logs (resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_id ON public.admin_audit_logs (resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_ip_address ON public.admin_audit_logs (ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_status ON public.admin_audit_logs (status);

-- Indexes for audit log configurations
CREATE INDEX IF NOT EXISTS idx_audit_log_configurations_organization_id ON public.audit_log_configurations (organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_configurations_is_active ON public.audit_log_configurations (is_active);

-- Indexes for audit log alerts
CREATE INDEX IF NOT EXISTS idx_audit_log_alerts_organization_id ON public.audit_log_alerts (organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_alerts_alert_type ON public.audit_log_alerts (alert_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_alerts_alert_severity ON public.audit_log_alerts (alert_severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_alerts_status ON public.audit_log_alerts (status);
CREATE INDEX IF NOT EXISTS idx_audit_log_alerts_created_at ON public.audit_log_alerts (created_at);

-- Indexes for audit log exports
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_organization_id ON public.audit_log_exports (organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_status ON public.audit_log_exports (status);
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_created_at ON public.audit_log_exports (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_expires_at ON public.audit_log_exports (expires_at);

-- Indexes for analytics events
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_organization_id ON public.analytics_events (organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_actor_id ON public.analytics_events (actor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_category ON public.analytics_events (event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_country_code ON public.analytics_events (country_code);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_path ON public.analytics_events (page_path);

-- Indexes for analytics sessions
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_organization_id ON public.analytics_sessions (organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON public.analytics_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_token ON public.analytics_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_started_at ON public.analytics_sessions (session_started_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_country_code ON public.analytics_sessions (country_code);

-- Indexes for analytics funnels
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_organization_id ON public.analytics_funnels (organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_is_active ON public.analytics_funnels (is_active);

-- Indexes for analytics metrics
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_organization_id ON public.analytics_metrics (organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_metric_name ON public.analytics_metrics (metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_is_active ON public.analytics_metrics (is_active);

-- Indexes for analytics metric values
CREATE INDEX IF NOT EXISTS idx_analytics_metric_values_metric_id ON public.analytics_metric_values (metric_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_values_organization_id ON public.analytics_metric_values (organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_values_period_start ON public.analytics_metric_values (period_start);

-- Asset indexes
CREATE INDEX IF NOT EXISTS idx_assets_profile_id ON public.assets (profile_id);
CREATE INDEX IF NOT EXISTS idx_assets_organization_id ON public.assets (organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_visibility ON public.assets (visibility);
CREATE INDEX IF NOT EXISTS idx_assets_mime_type ON public.assets (mime_type);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets (created_at);
CREATE INDEX IF NOT EXISTS idx_assets_processing_status ON public.assets (processing_status);
CREATE INDEX IF NOT EXISTS idx_assets_bucket_name ON public.assets (bucket_name);

CREATE INDEX IF NOT EXISTS idx_asset_collections_organization_id ON public.asset_collections (organization_id);
CREATE INDEX IF NOT EXISTS idx_asset_collections_slug ON public.asset_collections (slug);
CREATE INDEX IF NOT EXISTS idx_asset_collections_visibility ON public.asset_collections (visibility);

CREATE INDEX IF NOT EXISTS idx_asset_collection_memberships_asset_id ON public.asset_collection_memberships (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_collection_memberships_collection_id ON public.asset_collection_memberships (collection_id);

CREATE INDEX IF NOT EXISTS idx_asset_access_logs_asset_id ON public.asset_access_logs (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_access_logs_accessed_by_profile_id ON public.asset_access_logs (accessed_by_profile_id);
CREATE INDEX IF NOT EXISTS idx_asset_access_logs_created_at ON public.asset_access_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_asset_shared_links_asset_id ON public.asset_shared_links (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_shared_links_share_token ON public.asset_shared_links (share_token);
CREATE INDEX IF NOT EXISTS idx_asset_shared_links_is_active ON public.asset_shared_links (is_active);