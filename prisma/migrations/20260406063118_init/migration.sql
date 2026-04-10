-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('free', 'starter', 'pro', 'enterprise', 'custom');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('dns_txt', 'dns_cname', 'http_file', 'email');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'pending', 'deactivated', 'deleted');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('alumni', 'student', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('web', 'ios', 'android', 'desktop', 'api');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('google', 'linkedin', 'github', 'microsoft', 'apple', 'twitter');

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('global', 'organization');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('create', 'read', 'update', 'delete', 'manage');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('pending', 'accepted', 'declined', 'blocked', 'withdrawn');

-- CreateEnum
CREATE TYPE "MentorshipStatus" AS ENUM ('pending', 'accepted', 'declined', 'completed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "MentorshipFrequency" AS ENUM ('weekly', 'biweekly', 'monthly', 'flexible');

-- CreateEnum
CREATE TYPE "MentorshipSessionStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('video', 'phone', 'in_person', 'async');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('general', 'announcement', 'opportunity', 'question', 'resource', 'achievement');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('org', 'alumni_only', 'connections', 'private');

-- CreateEnum
CREATE TYPE "ReactionEmoji" AS ENUM ('like', 'love', 'celebrate', 'insightful', 'support', 'curious', 'laugh', 'sad');

-- CreateEnum
CREATE TYPE "ReactionEntityType" AS ENUM ('post', 'comment', 'message', 'channel_message');

-- CreateEnum
CREATE TYPE "ThreadType" AS ENUM ('direct', 'group', 'support', 'bot');

-- CreateEnum
CREATE TYPE "ThreadMemberRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'file', 'video', 'audio', 'sticker', 'system', 'poll');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sending', 'sent', 'delivered', 'read', 'failed');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('webinar', 'workshop', 'networking', 'career_fair', 'hackathon', 'conference', 'social', 'other');

-- CreateEnum
CREATE TYPE "EventMode" AS ENUM ('online', 'in_person', 'hybrid');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('registered', 'waitlisted', 'approved', 'attended', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'pending', 'refunded', 'waived');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('full_time', 'part_time', 'internship', 'contract', 'freelance', 'volunteer');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('high_school', 'associate', 'bachelor', 'master', 'phd', 'any');

-- CreateEnum
CREATE TYPE "RemoteType" AS ENUM ('fully_remote', 'hybrid', 'on_site');

-- CreateEnum
CREATE TYPE "SalaryPeriod" AS ENUM ('hourly', 'monthly', 'annual');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('draft', 'active', 'paused', 'closed', 'expired', 'filled');

-- CreateEnum
CREATE TYPE "ApplicationMethod" AS ENUM ('platform', 'email', 'external_url');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('submitted', 'reviewing', 'shortlisted', 'interview_scheduled', 'offer_sent', 'hired', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('interest', 'department', 'year', 'alumni_chapter', 'career', 'project', 'other');

-- CreateEnum
CREATE TYPE "GroupVisibility" AS ENUM ('public', 'open', 'private', 'secret');

-- CreateEnum
CREATE TYPE "JoinPolicy" AS ENUM ('open', 'invite_only', 'request', 'closed');

-- CreateEnum
CREATE TYPE "GroupMemberRole" AS ENUM ('owner', 'admin', 'moderator', 'member');

-- CreateEnum
CREATE TYPE "GroupMemberStatus" AS ENUM ('active', 'pending', 'banned');

-- CreateEnum
CREATE TYPE "NotificationPref" AS ENUM ('all', 'mentions', 'none');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('text', 'announcements', 'resources', 'qa', 'voice');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('social', 'mentorship', 'content', 'events', 'jobs', 'system', 'billing', 'moderation');

-- CreateEnum
CREATE TYPE "DigestFrequency" AS ENUM ('instant', 'hourly', 'daily', 'weekly', 'never');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('draft', 'active', 'paused', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "TargetAudience" AS ENUM ('all', 'alumni', 'students', 'specific_group');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('single_choice', 'multiple_choice', 'text', 'paragraph', 'rating', 'scale', 'date', 'ranking', 'matrix');

-- CreateEnum
CREATE TYPE "PollVisibility" AS ENUM ('org', 'alumni_only', 'group');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('all', 'alumni', 'students', 'admins');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate', 'copyright', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'in_review', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "Resolution" AS ENUM ('removed', 'warned', 'suspended', 'dismissed', 'escalated');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('warn', 'mute', 'suspend', 'ban', 'remove_content', 'restore_content', 'dismiss');

-- CreateEnum
CREATE TYPE "BlocklistCategory" AS ENUM ('profanity', 'hate_speech', 'spam', 'pii', 'custom');

-- CreateEnum
CREATE TYPE "BlocklistAction" AS ENUM ('flag', 'block', 'auto_remove');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'cancelled', 'trialing', 'paused', 'unpaid');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('monthly', 'annual', 'custom');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('pending', 'processing', 'done', 'failed', 'dead');

-- CreateEnum
CREATE TYPE "FlagType" AS ENUM ('boolean', 'percentage', 'user_list', 'json');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('development', 'staging', 'production');

-- CreateTable
CREATE TABLE "countries" (
    "code" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "dial_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "currencies" (
    "code" CHAR(3) NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "timezones" (
    "name" TEXT NOT NULL,
    "utc_offset" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "timezones_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "languages" (
    "code" CHAR(5) NOT NULL,
    "name" TEXT NOT NULL,
    "native_name" TEXT,
    "is_rtl" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "legal_name" TEXT,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "website" TEXT,
    "description" TEXT,
    "established_year" INTEGER,
    "country_code" CHAR(2),
    "timezone" TEXT,
    "default_language" CHAR(5),
    "plan_tier" "PlanTier" NOT NULL DEFAULT 'free',
    "plan_seats" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMPTZ,
    "verified_by" UUID,
    "trial_ends_at" TIMESTAMPTZ,
    "onboarding_step" TEXT DEFAULT 'created',
    "custom_domain" TEXT,
    "primary_color" CHAR(7),
    "secondary_color" CHAR(7),
    "settings" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sso_config" JSONB NOT NULL DEFAULT '{}',
    "created_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_domains" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "verification_method" "VerificationMethod" NOT NULL DEFAULT 'dns_txt',
    "verified_at" TIMESTAMPTZ,
    "last_checked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" JSONB NOT NULL DEFAULT '{}',
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "org_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role_id" UUID,
    "user_type" "UserType" NOT NULL,
    "invited_by" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "expires_at" TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    "accepted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "email_normalized" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "cover_image_url" TEXT,
    "phone" TEXT,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'pending',
    "user_type" "UserType" NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMPTZ,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "password_changed_at" TIMESTAMPTZ,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ,
    "last_login_ip" INET,
    "last_seen_at" TIMESTAMPTZ,
    "locale" CHAR(5),
    "timezone" TEXT,
    "deactivated_at" TIMESTAMPTZ,
    "deactivated_reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "refresh_token_hash" TEXT,
    "deviceType" "DeviceType",
    "device_name" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "revoked_reason" TEXT,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "refresh_expires_at" TIMESTAMPTZ,
    "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_oauth_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "provider_email" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMPTZ,
    "scopes" TEXT[],
    "provider_data" JSONB NOT NULL DEFAULT '{}',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip_address" INET,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "new_email" TEXT,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_backup_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_backup_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "endpoint" TEXT,
    "device_token" TEXT,
    "device_name" TEXT,
    "app_version" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "scope" "RoleScope" NOT NULL DEFAULT 'organization',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "color" CHAR(7),
    "icon" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_dangerous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" UUID,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "granted_by" UUID NOT NULL,
    "granted_reason" TEXT,
    "expires_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "revoked_by" UUID,
    "revoked_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permission_overrides" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "is_grant" BOOLEAN NOT NULL,
    "reason" TEXT,
    "granted_by" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "graduation_year" INTEGER,
    "degree" TEXT,
    "major" TEXT,
    "minor" TEXT,
    "gpa" DECIMAL(3,2),
    "current_company" TEXT,
    "current_title" TEXT,
    "years_of_experience" INTEGER,
    "industry" TEXT,
    "linkedin_url" TEXT,
    "github_url" TEXT,
    "twitter_url" TEXT,
    "website_url" TEXT,
    "resume_url" TEXT,
    "country_code" CHAR(2),
    "city" TEXT,
    "is_open_to_work" BOOLEAN NOT NULL DEFAULT false,
    "is_mentor_available" BOOLEAN NOT NULL DEFAULT false,
    "mentorship_slots" INTEGER NOT NULL DEFAULT 0,
    "mentorship_topics" TEXT[],
    "preferred_contact" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ,
    "profile_completeness" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "extra_data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alumni_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "enrollment_year" INTEGER,
    "expected_graduation" INTEGER,
    "major" TEXT,
    "minor" TEXT,
    "department" TEXT,
    "gpa" DECIMAL(3,2),
    "student_id_number" TEXT,
    "linkedin_url" TEXT,
    "github_url" TEXT,
    "portfolio_url" TEXT,
    "country_code" CHAR(2),
    "city" TEXT,
    "is_seeking_mentorship" BOOLEAN NOT NULL DEFAULT false,
    "is_seeking_internship" BOOLEAN NOT NULL DEFAULT false,
    "is_seeking_fulltime" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ,
    "profile_completeness" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "extra_data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_work_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alumni_profile_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "employment_type" TEXT,
    "location" TEXT,
    "is_remote" BOOLEAN NOT NULL DEFAULT false,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "started_at" DATE NOT NULL,
    "ended_at" DATE,
    "description" TEXT,
    "company_logo_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alumni_work_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_education" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "owner_type" TEXT NOT NULL,
    "organization_id" UUID NOT NULL,
    "institution" TEXT NOT NULL,
    "degree_type" TEXT,
    "field_of_study" TEXT,
    "start_year" INTEGER,
    "end_year" INTEGER,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "grade" TEXT,
    "activities" TEXT,
    "description" TEXT,
    "extra_data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category_id" UUID,
    "aliases" TEXT[],
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "owner_type" TEXT NOT NULL,
    "organization_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "proficiency_level" INTEGER,
    "years_experience" INTEGER,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "endorsed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_endorsements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_skill_id" UUID NOT NULL,
    "endorser_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "documents" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "review_note" TEXT,
    "resubmitted_at" TIMESTAMPTZ,
    "resubmit_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "declined_reason" TEXT,
    "accepted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "alumni_id" UUID NOT NULL,
    "status" "MentorshipStatus" NOT NULL DEFAULT 'pending',
    "subject" TEXT,
    "message" TEXT,
    "goals" TEXT[],
    "preferred_frequency" "MentorshipFrequency",
    "response_note" TEXT,
    "responded_by" UUID,
    "responded_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '14 days',
    "completed_at" TIMESTAMPTZ,
    "cancelled_by" UUID,
    "cancelled_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentorship_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "mentorship_request_id" UUID NOT NULL,
    "mentor_id" UUID NOT NULL,
    "mentee_id" UUID NOT NULL,
    "status" "MentorshipSessionStatus" NOT NULL DEFAULT 'scheduled',
    "meeting_type" "MeetingType" NOT NULL DEFAULT 'video',
    "meeting_link" TEXT,
    "meeting_location" TEXT,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "actual_duration_minutes" INTEGER,
    "agenda" TEXT,
    "notes" TEXT,
    "mentor_rating" INTEGER,
    "mentee_rating" INTEGER,
    "mentor_feedback" TEXT,
    "mentee_feedback" TEXT,
    "is_mentor_rated" BOOLEAN NOT NULL DEFAULT false,
    "is_mentee_rated" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ,
    "reminder_sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentorship_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "content_html" TEXT,
    "post_type" "PostType" NOT NULL DEFAULT 'general',
    "visibility" "PostVisibility" NOT NULL DEFAULT 'org',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "pinned_by" UUID,
    "pinned_at" TIMESTAMPTZ,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "last_edited_at" TIMESTAMPTZ,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "reaction_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "post_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "cdn_url" TEXT,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "width_px" INTEGER,
    "height_px" INTEGER,
    "duration_secs" INTEGER,
    "thumbnail_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color_hex" CHAR(7),
    "category" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taggables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taggables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "parent_comment_id" UUID,
    "content" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "path" TEXT,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "last_edited_at" TIMESTAMPTZ,
    "reaction_count" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "entity_type" "ReactionEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "emoji" "ReactionEmoji" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_threads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "thread_type" "ThreadType" NOT NULL DEFAULT 'direct',
    "title" TEXT,
    "description" TEXT,
    "avatar_url" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMPTZ,
    "last_message_id" UUID,
    "last_message_at" TIMESTAMPTZ,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_thread_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "thread_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" "ThreadMemberRole" NOT NULL DEFAULT 'member',
    "nickname" TEXT,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "muted_until" TIMESTAMPTZ,
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "last_read_at" TIMESTAMPTZ,
    "last_read_message_id" UUID,
    "last_message_at" TIMESTAMPTZ,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ,
    "removed_by" UUID,

    CONSTRAINT "chat_thread_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "reply_to_message_id" UUID,
    "content" TEXT,
    "content_html" TEXT,
    "message_type" "MessageType" NOT NULL DEFAULT 'text',
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMPTZ,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "pinned_by" UUID,
    "pinned_at" TIMESTAMPTZ,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "cdn_url" TEXT,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "width_px" INTEGER,
    "height_px" INTEGER,
    "duration_secs" INTEGER,
    "thumbnail_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "read_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "description_html" TEXT,
    "event_type" "EventType" NOT NULL,
    "mode" "EventMode" NOT NULL DEFAULT 'online',
    "location_name" TEXT,
    "location_address" TEXT,
    "location_city" TEXT,
    "location_country" CHAR(2),
    "location_lat" DECIMAL(9,6),
    "location_lng" DECIMAL(9,6),
    "meeting_link" TEXT,
    "meeting_password" TEXT,
    "banner_url" TEXT,
    "thumbnail_url" TEXT,
    "max_capacity" INTEGER,
    "registered_count" INTEGER NOT NULL DEFAULT 0,
    "waitlist_count" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2),
    "currency_code" CHAR(3),
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "timezone" TEXT,
    "registration_opens_at" TIMESTAMPTZ,
    "registration_closes_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "cancellation_reason" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "extra_data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'registered',
    "registration_token" TEXT,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "checked_in_at" TIMESTAMPTZ,
    "checked_in_by" UUID,
    "cancelled_at" TIMESTAMPTZ,
    "cancelled_reason" TEXT,
    "payment_status" "PaymentStatus",
    "payment_reference" TEXT,
    "registered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_speakers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "company" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "topic" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_speakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "job_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "posted_by" UUID NOT NULL,
    "category_id" UUID,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_html" TEXT,
    "requirements" TEXT,
    "responsibilities" TEXT,
    "benefits" TEXT,
    "job_type" "JobType" NOT NULL,
    "experience_level" "ExperienceLevel",
    "education_level" "EducationLevel",
    "location_city" TEXT,
    "location_country" CHAR(2),
    "is_remote" BOOLEAN NOT NULL DEFAULT false,
    "remote_type" "RemoteType",
    "salary_min" DECIMAL(12,2),
    "salary_max" DECIMAL(12,2),
    "salary_currency" CHAR(3) DEFAULT 'USD',
    "salary_period" "SalaryPeriod",
    "show_salary" BOOLEAN NOT NULL DEFAULT true,
    "status" "JobStatus" NOT NULL DEFAULT 'draft',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "custom_questions" JSONB NOT NULL DEFAULT '[]',
    "application_method" "ApplicationMethod" NOT NULL DEFAULT 'platform',
    "application_url" TEXT,
    "application_email" TEXT,
    "application_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ,
    "filled_at" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "job_posting_id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'submitted',
    "cover_letter" TEXT,
    "resume_url" TEXT,
    "portfolio_url" TEXT,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "expected_salary" DECIMAL(12,2),
    "salary_currency" CHAR(3),
    "available_from" DATE,
    "reviewer_note" TEXT,
    "rejection_reason" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "hired_at" TIMESTAMPTZ,
    "withdrawn_at" TIMESTAMPTZ,
    "withdrawn_reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_bookmarks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "job_posting_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "group_type" "GroupType" NOT NULL DEFAULT 'interest',
    "visibility" "GroupVisibility" NOT NULL DEFAULT 'public',
    "join_policy" "JoinPolicy" NOT NULL DEFAULT 'open',
    "banner_url" TEXT,
    "avatar_url" TEXT,
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "max_members" INTEGER,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMPTZ,
    "rules" TEXT,
    "extra_data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" "GroupMemberRole" NOT NULL DEFAULT 'member',
    "status" "GroupMemberStatus" NOT NULL DEFAULT 'active',
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "notification_pref" "NotificationPref" NOT NULL DEFAULT 'all',
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invited_by" UUID,
    "left_at" TIMESTAMPTZ,
    "banned_at" TIMESTAMPTZ,
    "banned_by" UUID,
    "ban_reason" TEXT,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_channels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "channel_type" "ChannelType" NOT NULL DEFAULT 'text',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_readonly" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMPTZ,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channel_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "reply_to_id" UUID,
    "content" TEXT NOT NULL,
    "content_html" TEXT,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "channel_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "action_url" TEXT,
    "icon_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_seen" BOOLEAN NOT NULL DEFAULT false,
    "is_emailed" BOOLEAN NOT NULL DEFAULT false,
    "is_pushed" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "notification_type" TEXT NOT NULL,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,
    "digest_frequency" "DigestFrequency" NOT NULL DEFAULT 'instant',
    "quiet_hours_start" TIME,
    "quiet_hours_end" TIME,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_audience" "TargetAudience" NOT NULL DEFAULT 'all',
    "status" "SurveyStatus" NOT NULL DEFAULT 'draft',
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "allow_multiple" BOOLEAN NOT NULL DEFAULT false,
    "show_progress" BOOLEAN NOT NULL DEFAULT true,
    "randomize_questions" BOOLEAN NOT NULL DEFAULT false,
    "thank_you_message" TEXT,
    "starts_at" TIMESTAMPTZ,
    "ends_at" TIMESTAMPTZ,
    "response_count" INTEGER NOT NULL DEFAULT 0,
    "max_responses" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "survey_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" "QuestionType" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "skip_logic" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_question_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "option_text" TEXT NOT NULL,
    "value" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_other" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "survey_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "respondent_token" TEXT,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ,
    "ip_address" INET,
    "device_type" TEXT,
    "time_to_complete_secs" INTEGER,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "response_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option_ids" UUID[],
    "text_value" TEXT,
    "numeric_value" DECIMAL,
    "date_value" DATE,
    "json_value" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "allow_multiple_votes" BOOLEAN NOT NULL DEFAULT false,
    "show_results_before_vote" BOOLEAN NOT NULL DEFAULT false,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "PollVisibility" NOT NULL DEFAULT 'org',
    "group_id" UUID,
    "total_votes" INTEGER NOT NULL DEFAULT 0,
    "ends_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "poll_id" UUID NOT NULL,
    "option_text" TEXT NOT NULL,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "poll_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "content_html" TEXT,
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'all',
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'normal',
    "requires_acknowledgement" BOOLEAN NOT NULL DEFAULT false,
    "banner_url" TEXT,
    "cta_label" TEXT,
    "cta_url" TEXT,
    "read_count" INTEGER NOT NULL DEFAULT 0,
    "ack_count" INTEGER NOT NULL DEFAULT 0,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "publish_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_reads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "announcement_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMPTZ,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "auto_score" INTEGER,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "resolution" "Resolution",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "report_id" UUID,
    "moderator_id" UUID NOT NULL,
    "action_type" "ModerationActionType" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "duration_hours" INTEGER,
    "expires_at" TIMESTAMPTZ,
    "reversed_at" TIMESTAMPTZ,
    "reversed_by" UUID,
    "reversed_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "blocker_id" UUID NOT NULL,
    "blocked_id" UUID NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocklist_words" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "pattern" TEXT NOT NULL,
    "is_regex" BOOLEAN NOT NULL DEFAULT false,
    "category" "BlocklistCategory" NOT NULL DEFAULT 'profanity',
    "action" "BlocklistAction" NOT NULL DEFAULT 'flag',
    "severity" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocklist_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ip_bans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "ip_address" INET NOT NULL,
    "ip_range" TEXT,
    "reason" TEXT NOT NULL,
    "banned_by" UUID NOT NULL,
    "is_permanent" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ip_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "session_id" UUID,
    "search_query_id" UUID,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "referrer_domain" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "device_type" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "country_code" CHAR(2),
    "ip_address" INET,
    "duration_secs" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_org_stats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "stat_date" DATE NOT NULL,
    "dau" INTEGER NOT NULL DEFAULT 0,
    "mau" INTEGER NOT NULL DEFAULT 0,
    "new_registrations" INTEGER NOT NULL DEFAULT 0,
    "posts_created" INTEGER NOT NULL DEFAULT 0,
    "comments_created" INTEGER NOT NULL DEFAULT 0,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "mentorship_requests" INTEGER NOT NULL DEFAULT 0,
    "mentorship_sessions" INTEGER NOT NULL DEFAULT 0,
    "connections_made" INTEGER NOT NULL DEFAULT 0,
    "events_held" INTEGER NOT NULL DEFAULT 0,
    "event_registrations" INTEGER NOT NULL DEFAULT 0,
    "jobs_posted" INTEGER NOT NULL DEFAULT 0,
    "job_applications" INTEGER NOT NULL DEFAULT 0,
    "profile_views" INTEGER NOT NULL DEFAULT 0,
    "active_users_7d" INTEGER NOT NULL DEFAULT 0,
    "active_users_30d" INTEGER NOT NULL DEFAULT 0,
    "computed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_org_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_queries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "query_text" TEXT NOT NULL,
    "search_type" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "clicked_rank" INTEGER,
    "clicked_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "features" JSONB NOT NULL DEFAULT '{}',
    "max_users" INTEGER,
    "max_storage_gb" INTEGER,
    "price_monthly" DECIMAL(10,2) NOT NULL,
    "price_annual" DECIMAL(10,2) NOT NULL,
    "currency_code" CHAR(3) NOT NULL DEFAULT 'USD',
    "stripe_monthly_id" TEXT,
    "stripe_annual_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "discount_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "currency_code" CHAR(3) NOT NULL,
    "stripe_subscription_id" TEXT,
    "stripe_customer_id" TEXT,
    "current_period_start" TIMESTAMPTZ,
    "current_period_end" TIMESTAMPTZ,
    "trial_start" TIMESTAMPTZ,
    "trial_end" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "cancellation_reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "subscription_id" UUID,
    "stripe_invoice_id" TEXT,
    "number" TEXT NOT NULL,
    "description" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "amount_due" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency_code" CHAR(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL,
    "invoice_url" TEXT,
    "pdf_url" TEXT,
    "due_date" TIMESTAMPTZ,
    "paid_at" TIMESTAMPTZ,
    "voided_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "secret_hash" TEXT NOT NULL,
    "event_types" TEXT[],
    "headers" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "retry_policy" JSONB NOT NULL DEFAULT '{"max_retries": 3, "backoff": "exponential"}',
    "timeout_ms" INTEGER NOT NULL DEFAULT 30000,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "last_success_at" TIMESTAMPTZ,
    "last_failure_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "endpoint_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "http_status" INTEGER,
    "response_headers" JSONB,
    "response_body" TEXT,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "duration_ms" INTEGER,
    "success" BOOLEAN,
    "error_message" TEXT,
    "next_retry_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "actor_id" UUID,
    "actor_email" TEXT,
    "actor_role" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "entity_label" TEXT,
    "before_state" JSONB,
    "after_state" JSONB,
    "diff" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "session_id" UUID,
    "request_id" UUID,
    "severity" "Severity" NOT NULL DEFAULT 'info',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_outbox" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'pending',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 5,
    "last_error" TEXT,
    "process_after" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lock_until" TIMESTAMPTZ,
    "locked_by" UUID,
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "flag_key" TEXT NOT NULL,
    "flag_type" "FlagType" NOT NULL DEFAULT 'boolean',
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "value" JSONB NOT NULL DEFAULT '{}',
    "description" TEXT,
    "rollout_pct" INTEGER,
    "allowed_users" UUID[],
    "environment" "Environment" NOT NULL DEFAULT 'production',
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SurveyQuestionToTaggable" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_SurveyQuestionToTaggable_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_custom_domain_key" ON "organizations"("custom_domain");

-- CreateIndex
CREATE INDEX "idx_orgs_plan" ON "organizations"("plan_tier");

-- CreateIndex
CREATE INDEX "idx_orgs_custom_domain" ON "organizations"("custom_domain");

-- CreateIndex
CREATE INDEX "idx_orgs_created_at" ON "organizations"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_org_domains_org" ON "org_domains"("organization_id");

-- CreateIndex
CREATE INDEX "idx_org_domains_verified" ON "org_domains"("organization_id", "is_verified");

-- CreateIndex
CREATE UNIQUE INDEX "org_domains_domain_key" ON "org_domains"("domain");

-- CreateIndex
CREATE INDEX "idx_org_settings_org" ON "org_settings"("organization_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "org_settings_organization_id_category_setting_key_key" ON "org_settings"("organization_id", "category", "setting_key");

-- CreateIndex
CREATE INDEX "idx_invites_org" ON "org_invitations"("organization_id", "status");

-- CreateIndex
CREATE INDEX "idx_invites_email" ON "org_invitations"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "org_invitations_token_key" ON "org_invitations"("token");

-- CreateIndex
CREATE INDEX "idx_users_org_id" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "idx_users_email_norm" ON "users"("organization_id", "email_normalized");

-- CreateIndex
CREATE INDEX "idx_users_status" ON "users"("organization_id", "status");

-- CreateIndex
CREATE INDEX "idx_users_type" ON "users"("organization_id", "user_type");

-- CreateIndex
CREATE INDEX "idx_users_last_seen" ON "users"("organization_id", "last_seen_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "users_organization_id_email_normalized_key" ON "users"("organization_id", "email_normalized");

-- CreateIndex
CREATE INDEX "idx_sessions_user" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_sessions_org" ON "user_sessions"("organization_id");

-- CreateIndex
CREATE INDEX "idx_sessions_expiry" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_hash_key" ON "user_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "idx_oauth_user" ON "user_oauth_accounts"("user_id");

-- CreateIndex
CREATE INDEX "idx_oauth_provider" ON "user_oauth_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_oauth_accounts_provider_provider_user_id_key" ON "user_oauth_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "idx_prt_user" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_prt_expiry" ON "password_reset_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_evt_user" ON "email_verification_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_2fa_user" ON "two_factor_backup_codes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_device_token_key" ON "push_subscriptions"("device_token");

-- CreateIndex
CREATE INDEX "idx_push_user" ON "push_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_push_org" ON "push_subscriptions"("organization_id");

-- CreateIndex
CREATE INDEX "idx_roles_org" ON "roles"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organization_id_slug_key" ON "roles"("organization_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "idx_rp_role" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "idx_rp_permission" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "idx_ur_user" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "idx_ur_org" ON "user_roles"("organization_id");

-- CreateIndex
CREATE INDEX "idx_ur_expiry" ON "user_roles"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_organization_id_key" ON "user_roles"("user_id", "role_id", "organization_id");

-- CreateIndex
CREATE INDEX "idx_upo_user" ON "user_permission_overrides"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_overrides_user_id_permission_id_organizatio_key" ON "user_permission_overrides"("user_id", "permission_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_profiles_user_id_key" ON "alumni_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_alumni_org" ON "alumni_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "idx_alumni_verified" ON "alumni_profiles"("organization_id", "is_verified");

-- CreateIndex
CREATE INDEX "idx_alumni_mentor" ON "alumni_profiles"("organization_id", "is_mentor_available");

-- CreateIndex
CREATE INDEX "idx_alumni_featured" ON "alumni_profiles"("organization_id", "is_featured");

-- CreateIndex
CREATE INDEX "idx_alumni_industry" ON "alumni_profiles"("organization_id", "industry");

-- CreateIndex
CREATE INDEX "idx_alumni_grad_year" ON "alumni_profiles"("organization_id", "graduation_year");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_profiles_user_id_organization_id_key" ON "alumni_profiles"("user_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_student_org" ON "student_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "idx_student_verified" ON "student_profiles"("organization_id", "is_verified");

-- CreateIndex
CREATE INDEX "idx_student_mentor" ON "student_profiles"("organization_id", "is_seeking_mentorship");

-- CreateIndex
CREATE INDEX "idx_student_grad" ON "student_profiles"("organization_id", "expected_graduation");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_organization_id_key" ON "student_profiles"("user_id", "organization_id");

-- CreateIndex
CREATE INDEX "idx_work_alumni" ON "alumni_work_history"("alumni_profile_id");

-- CreateIndex
CREATE INDEX "idx_work_org" ON "alumni_work_history"("organization_id");

-- CreateIndex
CREATE INDEX "idx_work_current" ON "alumni_work_history"("alumni_profile_id");

-- CreateIndex
CREATE INDEX "idx_edu_owner" ON "profile_education"("owner_id", "owner_type");

-- CreateIndex
CREATE INDEX "idx_edu_org" ON "profile_education"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_name_key" ON "skill_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_slug_key" ON "skill_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "idx_skills_name_trgm" ON "skills"("normalized_name");

-- CreateIndex
CREATE INDEX "idx_skills_category" ON "skills"("category_id");

-- CreateIndex
CREATE INDEX "idx_skills_usage" ON "skills"("usage_count" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "skills_normalized_name_key" ON "skills"("normalized_name");

-- CreateIndex
CREATE INDEX "idx_ps_owner" ON "profile_skills"("owner_id", "owner_type");

-- CreateIndex
CREATE INDEX "idx_ps_skill" ON "profile_skills"("skill_id");

-- CreateIndex
CREATE INDEX "idx_ps_org" ON "profile_skills"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_skills_owner_id_owner_type_skill_id_key" ON "profile_skills"("owner_id", "owner_type", "skill_id");

-- CreateIndex
CREATE INDEX "idx_endorsements_skill" ON "skill_endorsements"("profile_skill_id");

-- CreateIndex
CREATE INDEX "idx_endorsements_endorser" ON "skill_endorsements"("endorser_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_endorsements_profile_skill_id_endorser_id_key" ON "skill_endorsements"("profile_skill_id", "endorser_id");

-- CreateIndex
CREATE INDEX "idx_verif_org" ON "verification_requests"("organization_id", "status");

-- CreateIndex
CREATE INDEX "idx_verif_user" ON "verification_requests"("user_id");

-- CreateIndex
CREATE INDEX "idx_connections_requester" ON "connections"("requester_id", "status");

-- CreateIndex
CREATE INDEX "idx_connections_recipient" ON "connections"("recipient_id", "status");

-- CreateIndex
CREATE INDEX "idx_connections_org_status" ON "connections"("organization_id", "status");

-- CreateIndex
CREATE INDEX "idx_mr_org" ON "mentorship_requests"("organization_id", "status");

-- CreateIndex
CREATE INDEX "idx_mr_student" ON "mentorship_requests"("student_id");

-- CreateIndex
CREATE INDEX "idx_mr_alumni" ON "mentorship_requests"("alumni_id");

-- CreateIndex
CREATE INDEX "idx_mr_expiry" ON "mentorship_requests"("expires_at");

-- CreateIndex
CREATE INDEX "idx_ms_org" ON "mentorship_sessions"("organization_id");

-- CreateIndex
CREATE INDEX "idx_ms_request" ON "mentorship_sessions"("mentorship_request_id");

-- CreateIndex
CREATE INDEX "idx_ms_mentor" ON "mentorship_sessions"("mentor_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "idx_ms_mentee" ON "mentorship_sessions"("mentee_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "idx_ms_scheduled" ON "mentorship_sessions"("scheduled_at");

-- CreateIndex
CREATE INDEX "idx_posts_org_feed" ON "posts"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_posts_author" ON "posts"("author_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_posts_type" ON "posts"("organization_id", "post_type");

-- CreateIndex
CREATE INDEX "idx_posts_pinned" ON "posts"("organization_id", "pinned_at" DESC);

-- CreateIndex
CREATE INDEX "idx_post_attachments" ON "post_attachments"("post_id");

-- CreateIndex
CREATE INDEX "idx_tags_org" ON "tags"("organization_id");

-- CreateIndex
CREATE INDEX "idx_tags_usage" ON "tags"("organization_id", "usage_count" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "tags_organization_id_slug_key" ON "tags"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "idx_taggables_entity" ON "taggables"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_taggables_tag" ON "taggables"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "taggables_tag_id_entity_type_entity_id_key" ON "taggables"("tag_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_comments_post" ON "post_comments"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_comments_parent" ON "post_comments"("parent_comment_id");

-- CreateIndex
CREATE INDEX "idx_comments_author" ON "post_comments"("author_id");

-- CreateIndex
CREATE INDEX "idx_comments_path" ON "post_comments"("post_id", "path");

-- CreateIndex
CREATE INDEX "idx_reactions_entity" ON "reactions"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_reactions_user" ON "reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_entity_type_entity_id_user_id_emoji_key" ON "reactions"("entity_type", "entity_id", "user_id", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "chat_threads_last_message_id_key" ON "chat_threads"("last_message_id");

-- CreateIndex
CREATE INDEX "idx_threads_org" ON "chat_threads"("organization_id", "last_message_at" DESC);

-- CreateIndex
CREATE INDEX "idx_threads_type" ON "chat_threads"("organization_id", "thread_type");

-- CreateIndex
CREATE INDEX "idx_tm_thread" ON "chat_thread_members"("thread_id");

-- CreateIndex
CREATE INDEX "idx_tm_user" ON "chat_thread_members"("user_id", "last_message_at" DESC);

-- CreateIndex
CREATE INDEX "idx_tm_unread" ON "chat_thread_members"("user_id", "unread_count");

-- CreateIndex
CREATE UNIQUE INDEX "chat_thread_members_thread_id_user_id_key" ON "chat_thread_members"("thread_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_messages_thread" ON "messages"("thread_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_messages_sender" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "idx_messages_org" ON "messages"("organization_id");

-- CreateIndex
CREATE INDEX "idx_msg_attach_msg" ON "message_attachments"("message_id");

-- CreateIndex
CREATE INDEX "idx_mr_user" ON "message_reads"("user_id", "read_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "message_reads_message_id_user_id_key" ON "message_reads"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_events_org_date" ON "events"("organization_id", "starts_at" DESC);

-- CreateIndex
CREATE INDEX "idx_events_upcoming" ON "events"("organization_id", "starts_at");

-- CreateIndex
CREATE INDEX "idx_events_type" ON "events"("organization_id", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "events_organization_id_slug_key" ON "events"("organization_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_registration_token_key" ON "event_registrations"("registration_token");

-- CreateIndex
CREATE INDEX "idx_er_event" ON "event_registrations"("event_id", "status");

-- CreateIndex
CREATE INDEX "idx_er_user" ON "event_registrations"("user_id");

-- CreateIndex
CREATE INDEX "idx_er_status" ON "event_registrations"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_event_id_user_id_key" ON "event_registrations"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_event_speakers_event" ON "event_speakers"("event_id");

-- CreateIndex
CREATE INDEX "idx_job_categories_org" ON "job_categories"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_categories_organization_id_name_key" ON "job_categories"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "job_categories_organization_id_slug_key" ON "job_categories"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "idx_jobs_org_active" ON "job_postings"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_jobs_type" ON "job_postings"("organization_id", "job_type");

-- CreateIndex
CREATE INDEX "idx_jobs_category" ON "job_postings"("category_id");

-- CreateIndex
CREATE INDEX "idx_jobs_expiry" ON "job_postings"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "job_postings_organization_id_slug_key" ON "job_postings"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "idx_ja_job" ON "job_applications"("job_posting_id", "status");

-- CreateIndex
CREATE INDEX "idx_ja_applicant" ON "job_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "idx_ja_org_status" ON "job_applications"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_job_posting_id_applicant_id_key" ON "job_applications"("job_posting_id", "applicant_id");

-- CreateIndex
CREATE INDEX "idx_jb_user" ON "job_bookmarks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_bookmarks_job_posting_id_user_id_key" ON "job_bookmarks"("job_posting_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_groups_org" ON "groups"("organization_id");

-- CreateIndex
CREATE INDEX "idx_groups_type" ON "groups"("organization_id", "group_type");

-- CreateIndex
CREATE INDEX "idx_groups_featured" ON "groups"("organization_id", "is_featured");

-- CreateIndex
CREATE UNIQUE INDEX "groups_organization_id_slug_key" ON "groups"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "idx_gm_group" ON "group_members"("group_id");

-- CreateIndex
CREATE INDEX "idx_gm_user" ON "group_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_user_id_key" ON "group_members"("group_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_gc_group" ON "group_channels"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_channels_group_id_slug_key" ON "group_channels"("group_id", "slug");

-- CreateIndex
CREATE INDEX "idx_cm_channel" ON "channel_messages"("channel_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_cm_sender" ON "channel_messages"("sender_id");

-- CreateIndex
CREATE INDEX "idx_cm_pinned" ON "channel_messages"("channel_id");

-- CreateIndex
CREATE INDEX "idx_notifs_user_unread" ON "notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_notifs_org" ON "notifications"("organization_id");

-- CreateIndex
CREATE INDEX "idx_notifs_expiry" ON "notifications"("expires_at");

-- CreateIndex
CREATE INDEX "idx_np_user" ON "notification_preferences"("user_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_organization_id_notificati_key" ON "notification_preferences"("user_id", "organization_id", "notification_type");

-- CreateIndex
CREATE INDEX "idx_surveys_org" ON "surveys"("organization_id", "status");

-- CreateIndex
CREATE INDEX "idx_surveys_active" ON "surveys"("organization_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "idx_sq_survey" ON "survey_questions"("survey_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_sqo_question" ON "survey_question_options"("question_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "survey_responses_respondent_token_key" ON "survey_responses"("respondent_token");

-- CreateIndex
CREATE INDEX "idx_sr_survey" ON "survey_responses"("survey_id", "is_complete");

-- CreateIndex
CREATE INDEX "idx_sr_user" ON "survey_responses"("user_id");

-- CreateIndex
CREATE INDEX "idx_sa_response" ON "survey_answers"("response_id");

-- CreateIndex
CREATE INDEX "idx_sa_question" ON "survey_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_answers_response_id_question_id_key" ON "survey_answers"("response_id", "question_id");

-- CreateIndex
CREATE INDEX "idx_polls_org" ON "polls"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_po_poll" ON "poll_options"("poll_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_pv_poll" ON "poll_votes"("poll_id");

-- CreateIndex
CREATE INDEX "idx_pv_user" ON "poll_votes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_poll_id_option_id_user_id_key" ON "poll_votes"("poll_id", "option_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_ann_org_active" ON "announcements"("organization_id", "publish_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ar_announcement" ON "announcement_reads"("announcement_id");

-- CreateIndex
CREATE INDEX "idx_ar_user" ON "announcement_reads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcement_id_user_id_key" ON "announcement_reads"("announcement_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_reports_org" ON "content_reports"("organization_id", "status");

-- CreateIndex
CREATE INDEX "idx_reports_entity" ON "content_reports"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_reports_reporter" ON "content_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "idx_reports_pending" ON "content_reports"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_ma_org" ON "moderation_actions"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ma_entity" ON "moderation_actions"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_ma_moderator" ON "moderation_actions"("moderator_id");

-- CreateIndex
CREATE INDEX "idx_blocks_blocker" ON "user_blocks"("blocker_id", "organization_id");

-- CreateIndex
CREATE INDEX "idx_blocks_blocked" ON "user_blocks"("blocked_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_blocks_blocker_id_blocked_id_organization_id_key" ON "user_blocks"("blocker_id", "blocked_id", "organization_id");

-- CreateIndex
CREATE INDEX "idx_bl_org" ON "blocklist_words"("organization_id", "action");

-- CreateIndex
CREATE UNIQUE INDEX "blocklist_words_organization_id_pattern_key" ON "blocklist_words"("organization_id", "pattern");

-- CreateIndex
CREATE INDEX "idx_ip_bans_addr" ON "ip_bans"("ip_address");

-- CreateIndex
CREATE INDEX "idx_ip_bans_exp" ON "ip_bans"("expires_at");

-- CreateIndex
CREATE INDEX "idx_pv_org_date" ON "page_views"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_pv_path" ON "page_views"("organization_id", "path");

-- CreateIndex
CREATE INDEX "idx_dos_org_date" ON "daily_org_stats"("organization_id", "stat_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_org_stats_organization_id_stat_date_key" ON "daily_org_stats"("organization_id", "stat_date");

-- CreateIndex
CREATE INDEX "idx_sq_org" ON "search_queries"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "idx_subs_org" ON "subscriptions"("organization_id");

-- CreateIndex
CREATE INDEX "idx_subs_status" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stripe_invoice_id_key" ON "invoices"("stripe_invoice_id");

-- CreateIndex
CREATE INDEX "idx_invoices_org" ON "invoices"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_invoices_status" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "idx_webhooks_org" ON "webhook_endpoints"("organization_id");

-- CreateIndex
CREATE INDEX "idx_wd_endpoint" ON "webhook_deliveries"("endpoint_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_wd_retry" ON "webhook_deliveries"("next_retry_at");

-- CreateIndex
CREATE INDEX "idx_audit_org" ON "audit_logs"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_actor" ON "audit_logs"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "audit_logs"("entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_severity" ON "audit_logs"("severity", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_outbox_pending" ON "event_outbox"("status", "process_after");

-- CreateIndex
CREATE INDEX "idx_outbox_agg" ON "event_outbox"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "idx_flags_org" ON "feature_flags"("organization_id");

-- CreateIndex
CREATE INDEX "idx_flags_key" ON "feature_flags"("flag_key", "environment");

-- CreateIndex
CREATE INDEX "idx_flags_exp" ON "feature_flags"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_organization_id_flag_key_environment_key" ON "feature_flags"("organization_id", "flag_key", "environment");

-- CreateIndex
CREATE INDEX "_SurveyQuestionToTaggable_B_index" ON "_SurveyQuestionToTaggable"("B");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "countries"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_timezone_fkey" FOREIGN KEY ("timezone") REFERENCES "timezones"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_default_language_fkey" FOREIGN KEY ("default_language") REFERENCES "languages"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_domains" ADD CONSTRAINT "org_domains_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_settings" ADD CONSTRAINT "org_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_settings" ADD CONSTRAINT "org_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_locale_fkey" FOREIGN KEY ("locale") REFERENCES "languages"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_timezone_fkey" FOREIGN KEY ("timezone") REFERENCES "timezones"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_oauth_accounts" ADD CONSTRAINT "user_oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_oauth_accounts" ADD CONSTRAINT "user_oauth_accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factor_backup_codes" ADD CONSTRAINT "two_factor_backup_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "countries"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "countries"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_work_history" ADD CONSTRAINT "alumni_work_history_alumni_profile_id_fkey" FOREIGN KEY ("alumni_profile_id") REFERENCES "alumni_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_work_history" ADD CONSTRAINT "alumni_work_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_education" ADD CONSTRAINT "profile_education_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "skill_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_skills" ADD CONSTRAINT "profile_skills_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_skills" ADD CONSTRAINT "profile_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_profile_skill_id_fkey" FOREIGN KEY ("profile_skill_id") REFERENCES "profile_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_endorser_id_fkey" FOREIGN KEY ("endorser_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_responded_by_fkey" FOREIGN KEY ("responded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentorship_request_id_fkey" FOREIGN KEY ("mentorship_request_id") REFERENCES "mentorship_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_pinned_by_fkey" FOREIGN KEY ("pinned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_attachments" ADD CONSTRAINT "post_attachments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_attachments" ADD CONSTRAINT "post_attachments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taggables" ADD CONSTRAINT "taggables_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taggables" ADD CONSTRAINT "taggables_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_last_message_id_fkey" FOREIGN KEY ("last_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread_members" ADD CONSTRAINT "chat_thread_members_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread_members" ADD CONSTRAINT "chat_thread_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread_members" ADD CONSTRAINT "chat_thread_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread_members" ADD CONSTRAINT "chat_thread_members_removed_by_fkey" FOREIGN KEY ("removed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_pinned_by_fkey" FOREIGN KEY ("pinned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_location_country_fkey" FOREIGN KEY ("location_country") REFERENCES "countries"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_timezone_fkey" FOREIGN KEY ("timezone") REFERENCES "timezones"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_categories" ADD CONSTRAINT "job_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "job_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_location_country_fkey" FOREIGN KEY ("location_country") REFERENCES "countries"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_salary_currency_fkey" FOREIGN KEY ("salary_currency") REFERENCES "currencies"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_salary_currency_fkey" FOREIGN KEY ("salary_currency") REFERENCES "currencies"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_bookmarks" ADD CONSTRAINT "job_bookmarks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_bookmarks" ADD CONSTRAINT "job_bookmarks_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_bookmarks" ADD CONSTRAINT "job_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_channels" ADD CONSTRAINT "group_channels_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_channels" ADD CONSTRAINT "group_channels_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "group_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "channel_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_question_options" ADD CONSTRAINT "survey_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "content_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_reversed_by_fkey" FOREIGN KEY ("reversed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocklist_words" ADD CONSTRAINT "blocklist_words_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocklist_words" ADD CONSTRAINT "blocklist_words_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ip_bans" ADD CONSTRAINT "ip_bans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ip_bans" ADD CONSTRAINT "ip_bans_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_search_query_id_fkey" FOREIGN KEY ("search_query_id") REFERENCES "search_queries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_org_stats" ADD CONSTRAINT "daily_org_stats_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_outbox" ADD CONSTRAINT "event_outbox_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_outbox" ADD CONSTRAINT "event_outbox_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SurveyQuestionToTaggable" ADD CONSTRAINT "_SurveyQuestionToTaggable_A_fkey" FOREIGN KEY ("A") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SurveyQuestionToTaggable" ADD CONSTRAINT "_SurveyQuestionToTaggable_B_fkey" FOREIGN KEY ("B") REFERENCES "taggables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
