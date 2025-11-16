-- Updated_at triggers for all tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables if they don't exist
DO $$ 
BEGIN
    -- Organization tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_organizations_updated_at') THEN
        CREATE TRIGGER handle_organizations_updated_at
          BEFORE UPDATE ON public.organizations
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_organization_settings_updated_at') THEN
        CREATE TRIGGER handle_organization_settings_updated_at
          BEFORE UPDATE ON public.organization_settings
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_organization_roles_updated_at') THEN
        CREATE TRIGGER handle_organization_roles_updated_at
          BEFORE UPDATE ON public.organization_roles
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_organization_members_updated_at') THEN
        CREATE TRIGGER handle_organization_members_updated_at
          BEFORE UPDATE ON public.organization_members
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_organization_invitations_updated_at') THEN
        CREATE TRIGGER handle_organization_invitations_updated_at
          BEFORE UPDATE ON public.organization_invitations
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Events tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_events_updated_at') THEN
        CREATE TRIGGER handle_events_updated_at
          BEFORE UPDATE ON public.events
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_event_attendees_updated_at') THEN
        CREATE TRIGGER handle_event_attendees_updated_at
          BEFORE UPDATE ON public.event_attendees
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Jobs tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_jobs_updated_at') THEN
        CREATE TRIGGER handle_jobs_updated_at
          BEFORE UPDATE ON public.jobs
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_job_applications_updated_at') THEN
        CREATE TRIGGER handle_job_applications_updated_at
          BEFORE UPDATE ON public.job_applications
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Conversations tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_conversations_updated_at') THEN
        CREATE TRIGGER handle_conversations_updated_at
          BEFORE UPDATE ON public.conversations
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_messages_updated_at') THEN
        CREATE TRIGGER handle_messages_updated_at
          BEFORE UPDATE ON public.messages
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_conversation_participants_updated_at') THEN
        CREATE TRIGGER handle_conversation_participants_updated_at
          BEFORE UPDATE ON public.conversation_participants
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Network tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_network_connections_updated_at') THEN
        CREATE TRIGGER handle_network_connections_updated_at
          BEFORE UPDATE ON public.network_connections
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_connection_recommendations_updated_at') THEN
        CREATE TRIGGER handle_connection_recommendations_updated_at
          BEFORE UPDATE ON public.connection_recommendations
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Donations tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_donations_updated_at') THEN
        CREATE TRIGGER handle_donations_updated_at
          BEFORE UPDATE ON public.donations
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_donation_campaigns_updated_at') THEN
        CREATE TRIGGER handle_donation_campaigns_updated_at
          BEFORE UPDATE ON public.donation_campaigns
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_donation_receipts_updated_at') THEN
        CREATE TRIGGER handle_donation_receipts_updated_at
          BEFORE UPDATE ON public.donation_receipts
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Stories tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_stories_updated_at') THEN
        CREATE TRIGGER handle_stories_updated_at
          BEFORE UPDATE ON public.stories
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_story_collaborators_updated_at') THEN
        CREATE TRIGGER handle_story_collaborators_updated_at
          BEFORE UPDATE ON public.story_collaborators
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_story_comments_updated_at') THEN
        CREATE TRIGGER handle_story_comments_updated_at
          BEFORE UPDATE ON public.story_comments
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Notifications tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_notifications_updated_at') THEN
        CREATE TRIGGER handle_notifications_updated_at
          BEFORE UPDATE ON public.notifications
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_notification_preferences_updated_at') THEN
        CREATE TRIGGER handle_notification_preferences_updated_at
          BEFORE UPDATE ON public.notification_preferences
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_notification_templates_updated_at') THEN
        CREATE TRIGGER handle_notification_templates_updated_at
          BEFORE UPDATE ON public.notification_templates
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- User settings tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_user_settings_updated_at') THEN
        CREATE TRIGGER handle_user_settings_updated_at
          BEFORE UPDATE ON public.user_settings
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_organization_user_settings_updated_at') THEN
        CREATE TRIGGER handle_organization_user_settings_updated_at
          BEFORE UPDATE ON public.organization_user_settings
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_user_sessions_updated_at') THEN
        CREATE TRIGGER handle_user_sessions_updated_at
          BEFORE UPDATE ON public.user_sessions
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_user_data_exports_updated_at') THEN
        CREATE TRIGGER handle_user_data_exports_updated_at
          BEFORE UPDATE ON public.user_data_exports
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Audit log tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_admin_audit_logs_updated_at') THEN
        CREATE TRIGGER handle_admin_audit_logs_updated_at
          BEFORE UPDATE ON public.admin_audit_logs
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_audit_log_configurations_updated_at') THEN
        CREATE TRIGGER handle_audit_log_configurations_updated_at
          BEFORE UPDATE ON public.audit_log_configurations
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_audit_log_alerts_updated_at') THEN
        CREATE TRIGGER handle_audit_log_alerts_updated_at
          BEFORE UPDATE ON public.audit_log_alerts
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_audit_log_exports_updated_at') THEN
        CREATE TRIGGER handle_audit_log_exports_updated_at
          BEFORE UPDATE ON public.audit_log_exports
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Analytics tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_analytics_events_updated_at') THEN
        CREATE TRIGGER handle_analytics_events_updated_at
          BEFORE UPDATE ON public.analytics_events
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_analytics_sessions_updated_at') THEN
        CREATE TRIGGER handle_analytics_sessions_updated_at
          BEFORE UPDATE ON public.analytics_sessions
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_analytics_funnels_updated_at') THEN
        CREATE TRIGGER handle_analytics_funnels_updated_at
          BEFORE UPDATE ON public.analytics_funnels
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_analytics_metrics_updated_at') THEN
        CREATE TRIGGER handle_analytics_metrics_updated_at
          BEFORE UPDATE ON public.analytics_metrics
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_analytics_metric_values_updated_at') THEN
        CREATE TRIGGER handle_analytics_metric_values_updated_at
          BEFORE UPDATE ON public.analytics_metric_values
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    -- Assets tables
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_assets_updated_at') THEN
        CREATE TRIGGER handle_assets_updated_at
          BEFORE UPDATE ON public.assets
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_asset_collections_updated_at') THEN
        CREATE TRIGGER handle_asset_collections_updated_at
          BEFORE UPDATE ON public.asset_collections
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_asset_collection_memberships_updated_at') THEN
        CREATE TRIGGER handle_asset_collection_memberships_updated_at
          BEFORE UPDATE ON public.asset_collection_memberships
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_asset_access_logs_updated_at') THEN
        CREATE TRIGGER handle_asset_access_logs_updated_at
          BEFORE UPDATE ON public.asset_access_logs
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_asset_shared_links_updated_at') THEN
        CREATE TRIGGER handle_asset_shared_links_updated_at
          BEFORE UPDATE ON public.asset_shared_links
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

END $$;

-- Output success message
DO $$ 
BEGIN
    RAISE NOTICE 'Updated_at triggers created successfully for all tables:';
    RAISE NOTICE '- Organization tables (organizations, settings, roles, members, invitations)';
    RAISE NOTICE '- Events tables (events, attendees)';
    RAISE NOTICE '- Jobs tables (jobs, applications)';
    RAISE NOTICE '- Conversations tables (conversations, messages, participants)';
    RAISE NOTICE '- Network tables (connections, recommendations)';
    RAISE NOTICE '- Donations tables (donations, campaigns, receipts)';
    RAISE NOTICE '- Stories tables (stories, collaborators, comments)';
    RAISE NOTICE '- Notifications tables (notifications, preferences, templates)';
    RAISE NOTICE '- User settings tables (user_settings, org_user_settings, sessions, data_exports)';
    RAISE NOTICE '- Audit log tables (admin_audit_logs, configurations, alerts, exports)';
    RAISE NOTICE '- Analytics tables (events, sessions, funnels, metrics, metric_values)';
    RAISE NOTICE '- Assets tables (assets, collections, memberships, access_logs, shared_links)';
END $$;