-- ================================================================
-- ALUMNI CONNECT — COMPLETE PRODUCTION SCHEMA v3.0
-- PostgreSQL 16+
-- 60+ tables · 150+ indexes · 40+ constraints · 25 triggers
-- Full RLS · ACID-compliant · Future-proof · Multi-tenant
-- ================================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- trigram search
CREATE EXTENSION IF NOT EXISTS "btree_gist";    -- exclusion constraints
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- accent-insensitive search
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- query analytics
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- uuid_generate_v4()

-- ============================================================
-- SCHEMA VERSIONING
-- ============================================================
CREATE TABLE schema_migrations (
    version     BIGINT PRIMARY KEY,
    name        TEXT NOT NULL,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum    TEXT NOT NULL,
    applied_by  TEXT NOT NULL DEFAULT current_user
);
COMMENT ON TABLE schema_migrations IS
    'Tracks every migration. Never truncate or drop. Append-only.';

INSERT INTO schema_migrations (version, name, checksum)
VALUES (1, 'initial_schema_v3', md5('alumni_connect_v3_2026'));

-- ============================================================
-- GLOBAL DOMAINS / LOOKUP TABLES
-- (These are global — no organization_id needed)
-- ============================================================

CREATE TABLE countries (
    code        CHAR(2) PRIMARY KEY,     -- ISO 3166-1 alpha-2
    name        TEXT NOT NULL,
    dial_code   TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE currencies (
    code        CHAR(3) PRIMARY KEY,     -- ISO 4217
    name        TEXT NOT NULL,
    symbol      TEXT NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE timezones (
    name        TEXT PRIMARY KEY,        -- IANA tz name e.g. 'Asia/Kolkata'
    utc_offset  INTERVAL NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE languages (
    code        CHAR(5) PRIMARY KEY,     -- BCP-47 e.g. 'en-US'
    name        TEXT NOT NULL,
    native_name TEXT,
    is_rtl      BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- Seed minimal data
INSERT INTO currencies VALUES
    ('USD','US Dollar','$',TRUE),
    ('EUR','Euro','€',TRUE),
    ('GBP','British Pound','£',TRUE),
    ('INR','Indian Rupee','₹',TRUE);

-- ============================================================
-- SECTION 1: TENANCY
-- ============================================================

CREATE TABLE organizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                TEXT NOT NULL,
    name                TEXT NOT NULL,
    display_name        TEXT,
    legal_name          TEXT,
    logo_url            TEXT,
    favicon_url         TEXT,
    website             TEXT,
    description         TEXT,
    established_year    SMALLINT CHECK (established_year BETWEEN 1800 AND 2100),
    country_code        CHAR(2) REFERENCES countries(code),
    timezone            TEXT REFERENCES timezones(name),
    default_language    CHAR(5) REFERENCES languages(code),
    plan_tier           TEXT NOT NULL DEFAULT 'free'
                            CHECK (plan_tier IN ('free','starter','pro','enterprise','custom')),
    plan_seats          INT NOT NULL DEFAULT 100 CHECK (plan_seats > 0),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at         TIMESTAMPTZ,
    verified_by         UUID,               -- FK to users added post-creation
    trial_ends_at       TIMESTAMPTZ,
    onboarding_step     TEXT DEFAULT 'created',
    custom_domain       TEXT UNIQUE,
    primary_color       CHAR(7),            -- hex e.g. '#4F46E5'
    secondary_color     CHAR(7),
    settings            JSONB NOT NULL DEFAULT '{}',
    metadata            JSONB NOT NULL DEFAULT '{}',
    sso_config          JSONB NOT NULL DEFAULT '{}',   -- SAML/OIDC config (encrypted at app layer)
    created_by          UUID,
    version             INT NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_org_slug           UNIQUE (slug),
    CONSTRAINT chk_org_slug_format   CHECK (slug ~ '^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$'),
    CONSTRAINT chk_org_color_format  CHECK (
        primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$'
    ),
    CONSTRAINT chk_org_website       CHECK (
        website IS NULL OR website ~ '^https?://'
    )
);

CREATE UNIQUE INDEX idx_orgs_slug_active   ON organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX        idx_orgs_plan          ON organizations(plan_tier) WHERE deleted_at IS NULL;
CREATE INDEX        idx_orgs_custom_domain ON organizations(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX        idx_orgs_created_at    ON organizations(created_at DESC);

COMMENT ON TABLE organizations  IS 'Root tenant entity. Every domain table references this.';
COMMENT ON COLUMN organizations.sso_config IS 'Encrypted at application layer before storage. Contains SAML metadata or OIDC client credentials.';
COMMENT ON COLUMN organizations.settings   IS 'Org-level feature config. Add keys freely; never remove existing keys.';

-- ----------------------------------------------------------------

CREATE TABLE org_domains (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain              TEXT NOT NULL,
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token  TEXT,
    verification_method TEXT NOT NULL DEFAULT 'dns_txt'
                            CHECK (verification_method IN ('dns_txt','dns_cname','http_file','email')),
    verified_at         TIMESTAMPTZ,
    last_checked_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_org_domain UNIQUE (domain)
);
CREATE INDEX idx_org_domains_org      ON org_domains(organization_id);
CREATE INDEX idx_org_domains_verified ON org_domains(organization_id, is_verified);

-- ----------------------------------------------------------------

CREATE TABLE org_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category        TEXT NOT NULL,
    setting_key     TEXT NOT NULL,
    setting_value   JSONB NOT NULL DEFAULT '{}',
    is_encrypted    BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      UUID,

    CONSTRAINT uq_org_setting UNIQUE (organization_id, category, setting_key)
);
CREATE INDEX idx_org_settings_org ON org_settings(organization_id, category);

-- ----------------------------------------------------------------

CREATE TABLE org_invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    role_id         UUID,
    user_type       TEXT NOT NULL CHECK (user_type IN ('alumni','student','admin')),
    invited_by      UUID NOT NULL,
    token           TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','expired','revoked')),
    message         TEXT,
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    accepted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_invite_token UNIQUE (token),
    CONSTRAINT chk_invite_email CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
CREATE INDEX idx_invites_org    ON org_invitations(organization_id, status);
CREATE INDEX idx_invites_email  ON org_invitations(email, status);
CREATE INDEX idx_invites_expiry ON org_invitations(expires_at) WHERE status = 'pending';

-- ============================================================
-- SECTION 2: USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    email                   TEXT NOT NULL,
    email_normalized        TEXT GENERATED ALWAYS AS (lower(trim(email))) STORED,
    password_hash           TEXT,               -- NULL = OAuth-only
    full_name               TEXT NOT NULL,
    first_name              TEXT GENERATED ALWAYS AS (split_part(full_name,' ',1)) STORED,
    avatar_url              TEXT,
    cover_image_url         TEXT,
    phone                   TEXT,
    phone_verified          BOOLEAN NOT NULL DEFAULT FALSE,
    status                  TEXT NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('active','suspended','pending','deactivated','deleted')),
    user_type               TEXT NOT NULL
                                CHECK (user_type IN ('alumni','student','admin','super_admin')),
    email_verified          BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at       TIMESTAMPTZ,
    two_factor_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret       TEXT,               -- Encrypted at app layer
    failed_login_count      INT NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
    locked_until            TIMESTAMPTZ,
    password_changed_at     TIMESTAMPTZ,
    must_change_password    BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at           TIMESTAMPTZ,
    last_login_ip           INET,
    last_seen_at            TIMESTAMPTZ,
    locale                  CHAR(5) REFERENCES languages(code),
    timezone                TEXT REFERENCES timezones(name),
    deactivated_at          TIMESTAMPTZ,
    deactivated_reason      TEXT,
    version                 INT NOT NULL DEFAULT 1,
    metadata                JSONB NOT NULL DEFAULT '{}',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ,

    CONSTRAINT uq_user_email_per_org    UNIQUE (organization_id, email_normalized),
    CONSTRAINT chk_user_email_format    CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    CONSTRAINT chk_user_phone_format    CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]{7,20}$'),
    CONSTRAINT chk_user_deactivation    CHECK (
        (status = 'deactivated' AND deactivated_at IS NOT NULL)
        OR status <> 'deactivated'
    )
);

CREATE INDEX idx_users_org_id       ON users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_norm   ON users(organization_id, email_normalized) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status       ON users(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_type         ON users(organization_id, user_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_last_seen    ON users(organization_id, last_seen_at DESC NULLS LAST);
CREATE INDEX idx_users_fts          ON users USING GIN(
    to_tsvector('english', coalesce(full_name,'') || ' ' || coalesce(email,''))
) WHERE deleted_at IS NULL;

COMMENT ON COLUMN users.password_hash        IS 'Argon2id hash. NULL for OAuth-only accounts.';
COMMENT ON COLUMN users.two_factor_secret    IS 'TOTP secret. AES-256 encrypted at application layer.';
COMMENT ON COLUMN users.email_normalized     IS 'Lowercased, trimmed email for duplicate detection.';

-- ----------------------------------------------------------------

CREATE TABLE user_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL,
    refresh_token_hash TEXT,
    device_type     TEXT CHECK (device_type IN ('web','ios','android','desktop','api')),
    device_name     TEXT,
    browser         TEXT,
    os              TEXT,
    ip_address      INET,
    user_agent      TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_reason  TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    refresh_expires_at TIMESTAMPTZ,
    last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_session_token   UNIQUE (token_hash),
    CONSTRAINT chk_session_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user     ON user_sessions(user_id) WHERE is_active;
CREATE INDEX idx_sessions_org      ON user_sessions(organization_id) WHERE is_active;
CREATE INDEX idx_sessions_expiry   ON user_sessions(expires_at) WHERE is_active;

-- ----------------------------------------------------------------

CREATE TABLE user_oauth_accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider            TEXT NOT NULL CHECK (provider IN ('google','linkedin','github','microsoft','apple','twitter')),
    provider_user_id    TEXT NOT NULL,
    provider_email      TEXT,
    access_token        TEXT,                   -- Encrypted at app layer
    refresh_token       TEXT,                   -- Encrypted at app layer
    token_expires_at    TIMESTAMPTZ,
    scopes              TEXT[],
    provider_data       JSONB NOT NULL DEFAULT '{}',
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_oauth_provider_user   UNIQUE (provider, provider_user_id),
    CONSTRAINT uq_one_primary_per_user  EXCLUDE USING btree (user_id WITH =) WHERE (is_primary)
);
CREATE INDEX idx_oauth_user     ON user_oauth_accounts(user_id);
CREATE INDEX idx_oauth_provider ON user_oauth_accounts(provider, provider_user_id);

-- ----------------------------------------------------------------

CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    ip_address  INET,
    is_used     BOOLEAN NOT NULL DEFAULT FALSE,
    used_at     TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_prt_token     UNIQUE (token_hash),
    CONSTRAINT chk_prt_expiry   CHECK (expires_at > created_at),
    CONSTRAINT chk_prt_used     CHECK (
        (is_used = TRUE AND used_at IS NOT NULL) OR is_used = FALSE
    )
);
CREATE INDEX idx_prt_user    ON password_reset_tokens(user_id) WHERE NOT is_used;
CREATE INDEX idx_prt_expiry  ON password_reset_tokens(expires_at) WHERE NOT is_used;

-- ----------------------------------------------------------------

CREATE TABLE email_verification_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    new_email   TEXT,                   -- If changing email, this is the target
    is_used     BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_evt_token UNIQUE (token_hash)
);
CREATE INDEX idx_evt_user   ON email_verification_tokens(user_id) WHERE NOT is_used;

-- ----------------------------------------------------------------

CREATE TABLE two_factor_backup_codes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash   TEXT NOT NULL,
    is_used     BOOLEAN NOT NULL DEFAULT FALSE,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_2fa_user ON two_factor_backup_codes(user_id) WHERE NOT is_used;

-- ----------------------------------------------------------------

CREATE TABLE push_subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    platform        TEXT NOT NULL CHECK (platform IN ('web','ios','android')),
    endpoint        TEXT,               -- Web Push endpoint
    device_token    TEXT,               -- APNs / FCM token
    device_name     TEXT,
    app_version     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_push_device_token UNIQUE (device_token)
);
CREATE INDEX idx_push_user ON push_subscriptions(user_id) WHERE is_active;
CREATE INDEX idx_push_org  ON push_subscriptions(organization_id) WHERE is_active;

-- ============================================================
-- SECTION 3: RBAC
-- ============================================================

CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    -- NULL org_id = global system role
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL,
    scope           TEXT NOT NULL DEFAULT 'organization'
                        CHECK (scope IN ('global','organization')),
    priority        INT NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 100),
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,  -- Auto-assigned on registration
    description     TEXT,
    color           CHAR(7),
    icon            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_role_slug_per_org UNIQUE (organization_id, slug),
    CONSTRAINT chk_role_global_system CHECK (
        (scope = 'global' AND organization_id IS NULL)
        OR (scope = 'organization' AND organization_id IS NOT NULL)
    )
);
CREATE INDEX idx_roles_org ON roles(organization_id);

-- Seed immutable system roles
INSERT INTO roles (id, organization_id, name, slug, scope, priority, is_system, description) VALUES
    (gen_random_uuid(), NULL, 'Super Admin',  'super_admin', 'global',       100, TRUE, 'Full platform access. Bypass all tenant isolation with audit.'),
    (gen_random_uuid(), NULL, 'Admin',        'admin',       'organization', 50,  TRUE, 'Manage own organization. No cross-tenant access.'),
    (gen_random_uuid(), NULL, 'Alumni',       'alumni',      'organization', 10,  TRUE, 'Verified alumni. Can mentor and post.'),
    (gen_random_uuid(), NULL, 'Student',      'student',     'organization', 5,   TRUE, 'Active student. Can request mentorship.');

-- ----------------------------------------------------------------

CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT NOT NULL,
    category    TEXT NOT NULL,
    action      TEXT NOT NULL,          -- 'create','read','update','delete','manage'
    resource    TEXT NOT NULL,          -- The resource type
    description TEXT NOT NULL,
    is_dangerous BOOLEAN NOT NULL DEFAULT FALSE,  -- Extra confirmation required
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_permission_code UNIQUE (code),
    CONSTRAINT chk_perm_code_format CHECK (code ~ '^[A-Z_]+$')
);

INSERT INTO permissions (code, category, action, resource, description, is_dangerous) VALUES
    -- Org
    ('CREATE_ORGANIZATION',   'org',         'create', 'organization',  'Create a new organization',           TRUE),
    ('READ_ORGANIZATION',     'org',         'read',   'organization',  'View organization details',           FALSE),
    ('UPDATE_ORGANIZATION',   'org',         'update', 'organization',  'Edit organization settings',          FALSE),
    ('DELETE_ORGANIZATION',   'org',         'delete', 'organization',  'Delete an organization',              TRUE),
    -- Users
    ('CREATE_USER',           'user',        'create', 'user',          'Create users in own org',             FALSE),
    ('READ_USERS',            'user',        'read',   'user',          'View users in own org',               FALSE),
    ('UPDATE_USER',           'user',        'update', 'user',          'Edit user details',                   FALSE),
    ('SUSPEND_USER',          'user',        'update', 'user',          'Suspend a user account',              TRUE),
    ('DELETE_USER',           'user',        'delete', 'user',          'Soft-delete a user',                  TRUE),
    ('ASSIGN_ROLE',           'user',        'manage', 'role',          'Assign roles (no self-escalation)',   TRUE),
    -- Verification
    ('APPROVE_VERIFICATION',  'verification','manage', 'verification',  'Approve/reject verifications',        FALSE),
    -- Content
    ('CREATE_POST',           'content',     'create', 'post',          'Create posts',                        FALSE),
    ('READ_POSTS',            'content',     'read',   'post',          'View posts',                          FALSE),
    ('UPDATE_OWN_POST',       'content',     'update', 'post',          'Edit own posts',                      FALSE),
    ('DELETE_OWN_POST',       'content',     'delete', 'post',          'Delete own posts',                    FALSE),
    ('MODERATE_CONTENT',      'content',     'manage', 'post',          'Remove any content in org',           TRUE),
    -- Connections
    ('MANAGE_CONNECTIONS',    'social',      'manage', 'connection',    'Send/accept connections',             FALSE),
    -- Mentorship
    ('REQUEST_MENTORSHIP',    'mentorship',  'create', 'mentorship',    'Request a mentor',                    FALSE),
    ('APPROVE_MENTORSHIP',    'mentorship',  'manage', 'mentorship',    'Accept/decline mentorship',           FALSE),
    ('READ_MENTORSHIPS',      'mentorship',  'read',   'mentorship',    'View mentorship records in org',      FALSE),
    -- Messaging
    ('SEND_MESSAGE',          'messaging',   'create', 'message',       'Send messages',                       FALSE),
    ('READ_MESSAGES',         'messaging',   'read',   'message',       'View own messages',                   FALSE),
    -- Events
    ('CREATE_EVENT',          'events',      'create', 'event',         'Create events',                       FALSE),
    ('MANAGE_EVENTS',         'events',      'manage', 'event',         'Edit/delete any event in org',        FALSE),
    -- Jobs
    ('POST_JOB',              'jobs',        'create', 'job',           'Post a job listing',                  FALSE),
    ('APPLY_TO_JOB',          'jobs',        'create', 'job_app',       'Apply to a job posting',              FALSE),
    ('MANAGE_JOBS',           'jobs',        'manage', 'job',           'Edit/close any job in org',           FALSE),
    -- Groups
    ('CREATE_GROUP',          'groups',      'create', 'group',         'Create a group',                      FALSE),
    ('MANAGE_GROUPS',         'groups',      'manage', 'group',         'Manage any group in org',             FALSE),
    -- Surveys
    ('CREATE_SURVEY',         'surveys',     'create', 'survey',        'Create surveys/polls',                FALSE),
    ('VIEW_SURVEY_RESULTS',   'surveys',     'read',   'survey',        'View survey responses',               FALSE),
    -- Admin
    ('VIEW_AUDIT_LOGS',       'admin',       'read',   'audit_log',     'View audit logs for own org',         FALSE),
    ('MANAGE_FEATURE_FLAGS',  'admin',       'manage', 'feature_flag',  'Toggle feature flags',                TRUE),
    ('MANAGE_BILLING',        'billing',     'manage', 'subscription',  'Manage subscription and billing',     TRUE),
    ('MANAGE_WEBHOOKS',       'admin',       'manage', 'webhook',       'Create/delete webhook endpoints',     FALSE),
    ('VIEW_ANALYTICS',        'analytics',   'read',   'analytics',     'View org analytics dashboards',       FALSE),
    ('MANAGE_MODERATION',     'moderation',  'manage', 'moderation',    'Review and act on reports',           TRUE);

-- ----------------------------------------------------------------

CREATE TABLE role_permissions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by    UUID,

    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);
CREATE INDEX idx_rp_role       ON role_permissions(role_id);
CREATE INDEX idx_rp_permission ON role_permissions(permission_id);

-- ----------------------------------------------------------------

CREATE TABLE user_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    granted_by      UUID NOT NULL REFERENCES users(id),
    granted_reason  TEXT,
    expires_at      TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ,
    revoked_by      UUID REFERENCES users(id),
    revoked_reason  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_role_per_org  UNIQUE (user_id, role_id, organization_id),
    CONSTRAINT chk_no_self_grant     CHECK (user_id <> granted_by),
    CONSTRAINT chk_revocation        CHECK (
        (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
        OR (revoked_at IS NULL AND revoked_by IS NULL)
    )
);
CREATE INDEX idx_ur_user    ON user_roles(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_ur_org     ON user_roles(organization_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_ur_expiry  ON user_roles(expires_at) WHERE expires_at IS NOT NULL AND revoked_at IS NULL;

-- ----------------------------------------------------------------

CREATE TABLE user_permission_overrides (
    -- Direct per-user grants or denials that override role-level permissions
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_grant        BOOLEAN NOT NULL,   -- TRUE=grant, FALSE=explicit deny
    reason          TEXT,
    granted_by      UUID NOT NULL REFERENCES users(id),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_perm_override UNIQUE (user_id, permission_id, organization_id)
);
CREATE INDEX idx_upo_user ON user_permission_overrides(user_id);

-- ============================================================
-- SECTION 4: PROFILES
-- ============================================================

CREATE TABLE alumni_profiles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    headline                TEXT,
    bio                     TEXT CHECK (char_length(bio) <= 2000),
    graduation_year         SMALLINT CHECK (graduation_year BETWEEN 1900 AND 2100),
    degree                  TEXT,
    major                   TEXT,
    minor                   TEXT,
    gpa                     NUMERIC(3,2) CHECK (gpa BETWEEN 0.00 AND 4.00),
    current_company         TEXT,
    current_title           TEXT,
    years_of_experience     SMALLINT CHECK (years_of_experience BETWEEN 0 AND 60),
    industry                TEXT,
    linkedin_url            TEXT,
    github_url              TEXT,
    twitter_url             TEXT,
    website_url             TEXT,
    resume_url              TEXT,
    country_code            CHAR(2) REFERENCES countries(code),
    city                    TEXT,
    is_open_to_work         BOOLEAN NOT NULL DEFAULT FALSE,
    is_mentor_available     BOOLEAN NOT NULL DEFAULT FALSE,
    mentorship_slots        SMALLINT NOT NULL DEFAULT 0 CHECK (mentorship_slots BETWEEN 0 AND 20),
    mentorship_topics       TEXT[],
    preferred_contact       TEXT CHECK (preferred_contact IN ('email','linkedin','platform','any')),
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured             BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by             UUID REFERENCES users(id),
    verified_at             TIMESTAMPTZ,
    profile_completeness    SMALLINT NOT NULL DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
    view_count              INT NOT NULL DEFAULT 0,
    extra_data              JSONB NOT NULL DEFAULT '{}',
    version                 INT NOT NULL DEFAULT 1,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_alumni_profile UNIQUE (user_id, organization_id),
    CONSTRAINT chk_alumni_linkedin CHECK (linkedin_url IS NULL OR linkedin_url ~ '^https://'),
    CONSTRAINT chk_alumni_mentor_slots CHECK (
        (is_mentor_available = TRUE AND mentorship_slots > 0)
        OR is_mentor_available = FALSE
    )
);
CREATE INDEX idx_alumni_org         ON alumni_profiles(organization_id);
CREATE INDEX idx_alumni_verified    ON alumni_profiles(organization_id, is_verified);
CREATE INDEX idx_alumni_mentor      ON alumni_profiles(organization_id, is_mentor_available)
    WHERE is_mentor_available AND is_verified;
CREATE INDEX idx_alumni_featured    ON alumni_profiles(organization_id, is_featured) WHERE is_featured;
CREATE INDEX idx_alumni_industry    ON alumni_profiles(organization_id, industry) WHERE industry IS NOT NULL;
CREATE INDEX idx_alumni_grad_year   ON alumni_profiles(organization_id, graduation_year);
CREATE INDEX idx_alumni_fts         ON alumni_profiles USING GIN(
    to_tsvector('english',
        coalesce(headline,'') || ' ' || coalesce(bio,'') || ' ' ||
        coalesce(current_company,'') || ' ' || coalesce(current_title,'') || ' ' ||
        coalesce(major,'') || ' ' || coalesce(industry,'')
    )
) WHERE is_verified;

-- ----------------------------------------------------------------

CREATE TABLE student_profiles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    headline                TEXT,
    bio                     TEXT CHECK (char_length(bio) <= 2000),
    enrollment_year         SMALLINT CHECK (enrollment_year BETWEEN 1900 AND 2100),
    expected_graduation     SMALLINT CHECK (expected_graduation BETWEEN 1900 AND 2100),
    major                   TEXT,
    minor                   TEXT,
    department              TEXT,
    gpa                     NUMERIC(3,2) CHECK (gpa BETWEEN 0.00 AND 4.00),
    student_id_number       TEXT,               -- Internal to org, not exposed publicly
    linkedin_url            TEXT,
    github_url              TEXT,
    portfolio_url           TEXT,
    country_code            CHAR(2) REFERENCES countries(code),
    city                    TEXT,
    is_seeking_mentorship   BOOLEAN NOT NULL DEFAULT FALSE,
    is_seeking_internship   BOOLEAN NOT NULL DEFAULT FALSE,
    is_seeking_fulltime     BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured             BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by             UUID REFERENCES users(id),
    verified_at             TIMESTAMPTZ,
    profile_completeness    SMALLINT NOT NULL DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
    view_count              INT NOT NULL DEFAULT 0,
    extra_data              JSONB NOT NULL DEFAULT '{}',
    version                 INT NOT NULL DEFAULT 1,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_student_profile   UNIQUE (user_id, organization_id),
    CONSTRAINT chk_student_years    CHECK (
        expected_graduation IS NULL OR enrollment_year IS NULL OR
        expected_graduation >= enrollment_year
    )
);
CREATE INDEX idx_student_org        ON student_profiles(organization_id);
CREATE INDEX idx_student_verified   ON student_profiles(organization_id, is_verified);
CREATE INDEX idx_student_mentor     ON student_profiles(organization_id, is_seeking_mentorship)
    WHERE is_seeking_mentorship;
CREATE INDEX idx_student_grad       ON student_profiles(organization_id, expected_graduation);
CREATE INDEX idx_student_fts        ON student_profiles USING GIN(
    to_tsvector('english',
        coalesce(headline,'') || ' ' || coalesce(bio,'') || ' ' ||
        coalesce(major,'') || ' ' || coalesce(department,'')
    )
);

-- ----------------------------------------------------------------

CREATE TABLE alumni_work_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumni_profile_id   UUID NOT NULL REFERENCES alumni_profiles(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company             TEXT NOT NULL,
    title               TEXT NOT NULL,
    employment_type     TEXT CHECK (employment_type IN ('full_time','part_time','contract','internship','freelance','volunteer')),
    location            TEXT,
    is_remote           BOOLEAN NOT NULL DEFAULT FALSE,
    is_current          BOOLEAN NOT NULL DEFAULT FALSE,
    started_at          DATE NOT NULL,
    ended_at            DATE,
    description         TEXT CHECK (char_length(description) <= 1000),
    company_logo_url    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_work_dates CHECK (ended_at IS NULL OR ended_at >= started_at),
    CONSTRAINT chk_work_current CHECK (
        (is_current = TRUE AND ended_at IS NULL)
        OR is_current = FALSE
    )
);
CREATE INDEX idx_work_alumni  ON alumni_work_history(alumni_profile_id);
CREATE INDEX idx_work_org     ON alumni_work_history(organization_id);
CREATE INDEX idx_work_current ON alumni_work_history(alumni_profile_id) WHERE is_current;

-- ----------------------------------------------------------------

CREATE TABLE profile_education (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL,
    owner_type      TEXT NOT NULL CHECK (owner_type IN ('alumni','student')),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    institution     TEXT NOT NULL,
    degree_type     TEXT CHECK (degree_type IN ('bachelor','master','phd','diploma','certificate','associate','bootcamp','other')),
    field_of_study  TEXT,
    start_year      SMALLINT CHECK (start_year BETWEEN 1900 AND 2100),
    end_year        SMALLINT CHECK (end_year BETWEEN 1900 AND 2100),
    is_current      BOOLEAN NOT NULL DEFAULT FALSE,
    grade           TEXT,
    activities      TEXT,
    description     TEXT,
    extra_data      JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_edu_years CHECK (end_year IS NULL OR start_year IS NULL OR end_year >= start_year),
    CONSTRAINT chk_edu_current CHECK (
        (is_current = TRUE AND end_year IS NULL) OR is_current = FALSE
    )
);
CREATE INDEX idx_edu_owner ON profile_education(owner_id, owner_type);
CREATE INDEX idx_edu_org   ON profile_education(organization_id);

-- ----------------------------------------------------------------

CREATE TABLE skill_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    icon        TEXT,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE skills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    normalized_name TEXT GENERATED ALWAYS AS (lower(regexp_replace(trim(name), '\s+', ' ', 'g'))) STORED,
    slug            TEXT NOT NULL,
    category_id     UUID REFERENCES skill_categories(id),
    aliases         TEXT[],
    usage_count     INT NOT NULL DEFAULT 0,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_skill_name UNIQUE (normalized_name),
    CONSTRAINT uq_skill_slug UNIQUE (slug)
);
CREATE INDEX idx_skills_name_trgm ON skills USING GIN(normalized_name gin_trgm_ops);
CREATE INDEX idx_skills_category  ON skills(category_id);
CREATE INDEX idx_skills_usage     ON skills(usage_count DESC);

CREATE TABLE profile_skills (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id            UUID NOT NULL,
    owner_type          TEXT NOT NULL CHECK (owner_type IN ('alumni','student')),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    skill_id            UUID NOT NULL REFERENCES skills(id),
    proficiency_level   SMALLINT CHECK (proficiency_level BETWEEN 1 AND 5),
    years_experience    SMALLINT CHECK (years_experience BETWEEN 0 AND 50),
    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    endorsed_count      INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_profile_skill UNIQUE (owner_id, owner_type, skill_id)
);
CREATE INDEX idx_ps_owner   ON profile_skills(owner_id, owner_type);
CREATE INDEX idx_ps_skill   ON profile_skills(skill_id);
CREATE INDEX idx_ps_org     ON profile_skills(organization_id);

CREATE TABLE skill_endorsements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_skill_id UUID NOT NULL REFERENCES profile_skills(id) ON DELETE CASCADE,
    endorser_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_skill_endorsement UNIQUE (profile_skill_id, endorser_id)
);
CREATE INDEX idx_endorsements_skill    ON skill_endorsements(profile_skill_id);
CREATE INDEX idx_endorsements_endorser ON skill_endorsements(endorser_id);

-- ----------------------------------------------------------------

CREATE TABLE verification_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    target_type     TEXT NOT NULL CHECK (target_type IN ('alumni','student')),
    documents       JSONB NOT NULL DEFAULT '[]',  -- Array of {url, type, label}
    notes           TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_review','approved','rejected','more_info_needed')),
    rejection_reason TEXT,
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    review_note     TEXT,
    resubmitted_at  TIMESTAMPTZ,
    resubmit_count  INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_verification_review CHECK (
        (status IN ('approved','rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
        OR status NOT IN ('approved','rejected')
    ),
    CONSTRAINT chk_rejection_reason CHECK (
        (status = 'rejected' AND rejection_reason IS NOT NULL)
        OR status <> 'rejected'
    )
);
CREATE INDEX idx_verif_org    ON verification_requests(organization_id, status);
CREATE INDEX idx_verif_user   ON verification_requests(user_id);

-- ============================================================
-- SECTION 5: SOCIAL GRAPH
-- ============================================================

CREATE TABLE connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requester_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','declined','blocked','withdrawn')),
    message         TEXT CHECK (char_length(message) <= 500),
    declined_reason TEXT,
    accepted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_no_self_connect  CHECK (requester_id <> recipient_id),
    CONSTRAINT chk_connection_accept CHECK (
        (status = 'accepted' AND accepted_at IS NOT NULL) OR status <> 'accepted'
    )
);
-- Canonical pair index prevents (A→B) and (B→A) duplicates
CREATE UNIQUE INDEX idx_connections_pair ON connections (
    organization_id,
    LEAST(requester_id::TEXT, recipient_id::TEXT),
    GREATEST(requester_id::TEXT, recipient_id::TEXT)
) WHERE status NOT IN ('declined','blocked','withdrawn');
CREATE INDEX idx_connections_requester  ON connections(requester_id, status);
CREATE INDEX idx_connections_recipient  ON connections(recipient_id, status);
CREATE INDEX idx_connections_org_status ON connections(organization_id, status);

-- ----------------------------------------------------------------

CREATE TABLE mentorship_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alumni_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','accepted','declined','completed','cancelled','expired')),
    subject             TEXT CHECK (char_length(subject) <= 200),
    message             TEXT CHECK (char_length(message) <= 2000),
    goals               TEXT[],
    preferred_frequency TEXT CHECK (preferred_frequency IN ('weekly','biweekly','monthly','flexible')),
    response_note       TEXT,
    responded_by        UUID REFERENCES users(id),
    responded_at        TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '14 days',
    completed_at        TIMESTAMPTZ,
    cancelled_by        UUID REFERENCES users(id),
    cancelled_reason    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_mentor_not_self  CHECK (student_id <> alumni_id),
    CONSTRAINT chk_mr_response      CHECK (
        (status IN ('accepted','declined') AND responded_by IS NOT NULL AND responded_at IS NOT NULL)
        OR status NOT IN ('accepted','declined')
    )
);
CREATE INDEX idx_mr_org         ON mentorship_requests(organization_id, status);
CREATE INDEX idx_mr_student     ON mentorship_requests(student_id);
CREATE INDEX idx_mr_alumni      ON mentorship_requests(alumni_id);
CREATE INDEX idx_mr_expiry      ON mentorship_requests(expires_at) WHERE status = 'pending';

-- ----------------------------------------------------------------

CREATE TABLE mentorship_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    mentorship_request_id   UUID NOT NULL REFERENCES mentorship_requests(id) ON DELETE CASCADE,
    mentor_id               UUID NOT NULL REFERENCES users(id),
    mentee_id               UUID NOT NULL REFERENCES users(id),
    status                  TEXT NOT NULL DEFAULT 'scheduled'
                                CHECK (status IN ('scheduled','in_progress','completed','cancelled','no_show')),
    meeting_type            TEXT NOT NULL DEFAULT 'video'
                                CHECK (meeting_type IN ('video','phone','in_person','async')),
    meeting_link            TEXT,
    meeting_location        TEXT,
    scheduled_at            TIMESTAMPTZ NOT NULL,
    duration_minutes        SMALLINT NOT NULL DEFAULT 60
                                CHECK (duration_minutes BETWEEN 15 AND 480),
    actual_duration_minutes SMALLINT CHECK (actual_duration_minutes BETWEEN 0 AND 480),
    agenda                  TEXT,
    notes                   TEXT,
    mentor_rating           SMALLINT CHECK (mentor_rating BETWEEN 1 AND 5),
    mentee_rating           SMALLINT CHECK (mentee_rating BETWEEN 1 AND 5),
    mentor_feedback         TEXT,
    mentee_feedback         TEXT,
    is_mentor_rated         BOOLEAN NOT NULL DEFAULT FALSE,
    is_mentee_rated         BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at            TIMESTAMPTZ,
    reminder_sent_at        TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_ms_completed CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR status <> 'completed'
    ),
    CONSTRAINT chk_ms_ratings CHECK (
        (is_mentor_rated = TRUE AND mentor_rating IS NOT NULL) OR is_mentor_rated = FALSE
    )
);
CREATE INDEX idx_ms_org         ON mentorship_sessions(organization_id);
CREATE INDEX idx_ms_request     ON mentorship_sessions(mentorship_request_id);
CREATE INDEX idx_ms_mentor      ON mentorship_sessions(mentor_id, scheduled_at);
CREATE INDEX idx_ms_mentee      ON mentorship_sessions(mentee_id, scheduled_at);
CREATE INDEX idx_ms_scheduled   ON mentorship_sessions(scheduled_at) WHERE status = 'scheduled';

-- ============================================================
-- SECTION 6: CONTENT FEED
-- ============================================================

CREATE TABLE posts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    author_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content             TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
    content_html        TEXT,               -- Sanitized rendered HTML (generated by app)
    post_type           TEXT NOT NULL DEFAULT 'general'
                            CHECK (post_type IN ('general','announcement','opportunity','question','resource','achievement')),
    visibility          TEXT NOT NULL DEFAULT 'org'
                            CHECK (visibility IN ('org','alumni_only','connections','private')),
    is_pinned           BOOLEAN NOT NULL DEFAULT FALSE,
    pinned_by           UUID REFERENCES users(id),
    pinned_at           TIMESTAMPTZ,
    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,  -- No new comments
    is_edited           BOOLEAN NOT NULL DEFAULT FALSE,
    last_edited_at      TIMESTAMPTZ,
    view_count          INT NOT NULL DEFAULT 0,
    comment_count       INT NOT NULL DEFAULT 0,
    reaction_count      INT NOT NULL DEFAULT 0,
    share_count         INT NOT NULL DEFAULT 0,
    version             INT NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT chk_post_pin CHECK (
        (is_pinned = TRUE AND pinned_by IS NOT NULL AND pinned_at IS NOT NULL)
        OR is_pinned = FALSE
    )
);
CREATE INDEX idx_posts_org_feed     ON posts(organization_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_author       ON posts(author_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_type         ON posts(organization_id, post_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_pinned       ON posts(organization_id, pinned_at DESC) WHERE is_pinned AND deleted_at IS NULL;
CREATE INDEX idx_posts_fts          ON posts USING GIN(
    to_tsvector('english', content)
) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------

CREATE TABLE post_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    file_url        TEXT NOT NULL,
    cdn_url         TEXT,
    file_name       TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    width_px        INT,                -- For images/videos
    height_px       INT,
    duration_secs   INT,                -- For videos/audio
    thumbnail_url   TEXT,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_attachment_size CHECK (file_size_bytes <= 524288000) -- 500MB max
);
CREATE INDEX idx_post_attachments ON post_attachments(post_id);

-- ----------------------------------------------------------------

CREATE TABLE tags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL,
    description     TEXT,
    color_hex       CHAR(7),
    category        TEXT,
    usage_count     INT NOT NULL DEFAULT 0,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_tag_slug_per_org UNIQUE (organization_id, slug),
    CONSTRAINT chk_tag_color       CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$')
);
CREATE INDEX idx_tags_org   ON tags(organization_id);
CREATE INDEX idx_tags_usage ON tags(organization_id, usage_count DESC);

CREATE TABLE taggables (
    -- Polymorphic tag junction table replacing separate post_tags, event_tags etc.
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    entity_type     TEXT NOT NULL CHECK (entity_type IN ('post','event','job','group','survey')),
    entity_id       UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_taggable UNIQUE (tag_id, entity_type, entity_id)
);
CREATE INDEX idx_taggables_entity ON taggables(entity_type, entity_id);
CREATE INDEX idx_taggables_tag    ON taggables(tag_id);

-- ----------------------------------------------------------------

CREATE TABLE post_comments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    post_id             UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    parent_comment_id   UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    content             TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
    depth               SMALLINT NOT NULL DEFAULT 0 CHECK (depth BETWEEN 0 AND 10),
    path                TEXT,               -- Materialized path e.g. 'uuid1.uuid2.uuid3'
    is_edited           BOOLEAN NOT NULL DEFAULT FALSE,
    last_edited_at      TIMESTAMPTZ,
    reaction_count      INT NOT NULL DEFAULT 0,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_comment_depth CHECK (
        (depth = 0 AND parent_comment_id IS NULL)
        OR (depth > 0 AND parent_comment_id IS NOT NULL)
    )
);
CREATE INDEX idx_comments_post      ON post_comments(post_id, created_at) WHERE NOT is_deleted;
CREATE INDEX idx_comments_parent    ON post_comments(parent_comment_id) WHERE NOT is_deleted;
CREATE INDEX idx_comments_author    ON post_comments(author_id);
CREATE INDEX idx_comments_path      ON post_comments(post_id, path) WHERE path IS NOT NULL;

-- ----------------------------------------------------------------

CREATE TABLE reactions (
    -- Single polymorphic reactions table
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type     TEXT NOT NULL CHECK (entity_type IN ('post','comment','message','channel_message')),
    entity_id       UUID NOT NULL,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji           TEXT NOT NULL CHECK (emoji IN ('like','love','celebrate','insightful','support','curious','laugh','sad')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_reaction UNIQUE (entity_type, entity_id, user_id, emoji)
);
CREATE INDEX idx_reactions_entity ON reactions(entity_type, entity_id);
CREATE INDEX idx_reactions_user   ON reactions(user_id);

-- ============================================================
-- SECTION 7: MESSAGING
-- ============================================================

CREATE TABLE chat_threads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by          UUID NOT NULL REFERENCES users(id),
    thread_type         TEXT NOT NULL DEFAULT 'direct'
                            CHECK (thread_type IN ('direct','group','support','bot')),
    title               TEXT,
    description         TEXT,
    avatar_url          TEXT,
    is_archived         BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at         TIMESTAMPTZ,
    last_message_id     UUID,
    last_message_at     TIMESTAMPTZ,
    message_count       INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_threads_org    ON chat_threads(organization_id, last_message_at DESC);
CREATE INDEX idx_threads_type   ON chat_threads(organization_id, thread_type);

-- ----------------------------------------------------------------

CREATE TABLE chat_thread_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
    nickname        TEXT,
    is_muted        BOOLEAN NOT NULL DEFAULT FALSE,
    muted_until     TIMESTAMPTZ,
    unread_count    INT NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
    last_read_at    TIMESTAMPTZ,
    last_read_message_id UUID,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at         TIMESTAMPTZ,
    removed_by      UUID REFERENCES users(id),

    CONSTRAINT uq_thread_member UNIQUE (thread_id, user_id),
    CONSTRAINT chk_thread_mute  CHECK (
        (is_muted = TRUE) OR (is_muted = FALSE AND muted_until IS NULL)
    )
);
CREATE INDEX idx_tm_thread  ON chat_thread_members(thread_id) WHERE left_at IS NULL;
CREATE INDEX idx_tm_user    ON chat_thread_members(user_id, last_message_at DESC)
    WHERE left_at IS NULL;
CREATE INDEX idx_tm_unread  ON chat_thread_members(user_id, unread_count)
    WHERE unread_count > 0 AND left_at IS NULL;

-- (Add FK now that both tables exist)
ALTER TABLE chat_thread_members
    ADD COLUMN last_message_at TIMESTAMPTZ;

-- ----------------------------------------------------------------

CREATE TABLE messages (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    thread_id               UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    sender_id               UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reply_to_message_id     UUID REFERENCES messages(id),
    content                 TEXT CHECK (char_length(content) <= 20000),
    content_html            TEXT,
    message_type            TEXT NOT NULL DEFAULT 'text'
                                CHECK (message_type IN ('text','image','file','video','audio','sticker','system','poll')),
    status                  TEXT NOT NULL DEFAULT 'sent'
                                CHECK (status IN ('sending','sent','delivered','read','failed')),
    is_edited               BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at               TIMESTAMPTZ,
    is_pinned               BOOLEAN NOT NULL DEFAULT FALSE,
    pinned_by               UUID REFERENCES users(id),
    pinned_at               TIMESTAMPTZ,
    metadata                JSONB NOT NULL DEFAULT '{}',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ,

    CONSTRAINT chk_message_content CHECK (
        content IS NOT NULL OR message_type IN ('image','file','video','audio','sticker')
    )
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE messages_2026_04 PARTITION OF messages
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE messages_2026_05 PARTITION OF messages
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX idx_messages_thread ON messages(thread_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_org    ON messages(organization_id);

-- ----------------------------------------------------------------

CREATE TABLE message_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    file_url        TEXT NOT NULL,
    cdn_url         TEXT,
    file_name       TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    width_px        INT,
    height_px       INT,
    duration_secs   INT,
    thumbnail_url   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_msg_attach_msg ON message_attachments(message_id);

-- ----------------------------------------------------------------

CREATE TABLE message_reads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_message_read UNIQUE (message_id, user_id)
) PARTITION BY RANGE (read_at);

CREATE TABLE message_reads_2026_04 PARTITION OF message_reads
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE message_reads_2026_05 PARTITION OF message_reads
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX idx_mr_user ON message_reads(user_id, read_at DESC);

-- ============================================================
-- SECTION 8: EVENTS
-- ============================================================

CREATE TABLE events (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    organizer_id            UUID NOT NULL REFERENCES users(id),
    title                   TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 300),
    slug                    TEXT NOT NULL,
    description             TEXT CHECK (char_length(description) <= 20000),
    description_html        TEXT,
    event_type              TEXT NOT NULL
                                CHECK (event_type IN ('webinar','workshop','networking','career_fair','hackathon','conference','social','other')),
    mode                    TEXT NOT NULL DEFAULT 'online'
                                CHECK (mode IN ('online','in_person','hybrid')),
    location_name           TEXT,
    location_address        TEXT,
    location_city           TEXT,
    location_country        CHAR(2) REFERENCES countries(code),
    location_lat            NUMERIC(9,6),
    location_lng            NUMERIC(9,6),
    meeting_link            TEXT,
    meeting_password        TEXT,
    banner_url              TEXT,
    thumbnail_url           TEXT,
    max_capacity            INT CHECK (max_capacity > 0),
    registered_count        INT NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
    waitlist_count          INT NOT NULL DEFAULT 0 CHECK (waitlist_count >= 0),
    is_published            BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured             BOOLEAN NOT NULL DEFAULT FALSE,
    requires_approval       BOOLEAN NOT NULL DEFAULT FALSE,
    is_paid                 BOOLEAN NOT NULL DEFAULT FALSE,
    price                   NUMERIC(10,2) CHECK (price >= 0),
    currency_code           CHAR(3) REFERENCES currencies(code),
    starts_at               TIMESTAMPTZ NOT NULL,
    ends_at                 TIMESTAMPTZ NOT NULL,
    timezone                TEXT REFERENCES timezones(name),
    registration_opens_at   TIMESTAMPTZ,
    registration_closes_at  TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    cancellation_reason     TEXT,
    view_count              INT NOT NULL DEFAULT 0,
    extra_data              JSONB NOT NULL DEFAULT '{}',
    version                 INT NOT NULL DEFAULT 1,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ,

    CONSTRAINT uq_event_slug_per_org    UNIQUE (organization_id, slug),
    CONSTRAINT chk_event_dates          CHECK (ends_at > starts_at),
    CONSTRAINT chk_event_registration   CHECK (
        registration_closes_at IS NULL OR registration_closes_at <= starts_at
    ),
    CONSTRAINT chk_event_coordinates   CHECK (
        (location_lat IS NULL AND location_lng IS NULL)
        OR (location_lat IS NOT NULL AND location_lng IS NOT NULL)
    ),
    CONSTRAINT chk_event_price          CHECK (
        (is_paid = TRUE AND price IS NOT NULL AND currency_code IS NOT NULL)
        OR is_paid = FALSE
    )
);
CREATE INDEX idx_events_org_date    ON events(organization_id, starts_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_upcoming    ON events(organization_id, starts_at)
    WHERE is_published AND deleted_at IS NULL AND starts_at > NOW();
CREATE INDEX idx_events_type        ON events(organization_id, event_type) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------

CREATE TABLE event_registrations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'registered'
                            CHECK (status IN ('registered','waitlisted','approved','attended','cancelled','no_show')),
    registration_token  TEXT UNIQUE,        -- QR code / check-in token
    answers             JSONB NOT NULL DEFAULT '{}',  -- Custom event questions
    checked_in_at       TIMESTAMPTZ,
    checked_in_by       UUID REFERENCES users(id),
    cancelled_at        TIMESTAMPTZ,
    cancelled_reason    TEXT,
    payment_status      TEXT CHECK (payment_status IN ('paid','pending','refunded','waived')),
    payment_reference   TEXT,
    registered_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_event_registration UNIQUE (event_id, user_id),
    CONSTRAINT chk_event_checkin CHECK (
        (checked_in_at IS NOT NULL AND checked_in_by IS NOT NULL)
        OR (checked_in_at IS NULL AND checked_in_by IS NULL)
    )
);
CREATE INDEX idx_er_event       ON event_registrations(event_id, status);
CREATE INDEX idx_er_user        ON event_registrations(user_id);
CREATE INDEX idx_er_status      ON event_registrations(organization_id, status);

-- ----------------------------------------------------------------

CREATE TABLE event_speakers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),      -- NULL = external speaker
    name            TEXT NOT NULL,
    title           TEXT,
    company         TEXT,
    bio             TEXT,
    avatar_url      TEXT,
    topic           TEXT,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_event_speakers_event ON event_speakers(event_id);

-- ================================================================
-- SECTION 9: JOBS BOARD
-- ================================================================

CREATE TABLE job_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    icon        TEXT,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE job_postings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    posted_by           UUID NOT NULL REFERENCES users(id),
    category_id         UUID REFERENCES job_categories(id),
    title               TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 300),
    slug                TEXT NOT NULL,
    description         TEXT NOT NULL CHECK (char_length(description) >= 50),
    description_html    TEXT,
    requirements        TEXT,
    responsibilities    TEXT,
    benefits            TEXT,
    job_type            TEXT NOT NULL
                            CHECK (job_type IN ('full_time','part_time','internship','contract','freelance','volunteer')),
    experience_level    TEXT CHECK (experience_level IN ('entry','junior','mid','senior','lead','executive')),
    education_level     TEXT CHECK (education_level IN ('high_school','associate','bachelor','master','phd','any')),
    location_city       TEXT,
    location_country    CHAR(2) REFERENCES countries(code),
    is_remote           BOOLEAN NOT NULL DEFAULT FALSE,
    remote_type         TEXT CHECK (remote_type IN ('fully_remote','hybrid','on_site')),
    salary_min          NUMERIC(12,2) CHECK (salary_min >= 0),
    salary_max          NUMERIC(12,2) CHECK (salary_max >= 0),
    salary_currency     CHAR(3) REFERENCES currencies(code) DEFAULT 'USD',
    salary_period       TEXT CHECK (salary_period IN ('hourly','monthly','annual')),
    show_salary         BOOLEAN NOT NULL DEFAULT TRUE,
    status              TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','active','paused','closed','expired','filled')),
    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    is_urgent           BOOLEAN NOT NULL DEFAULT FALSE,
    custom_questions    JSONB NOT NULL DEFAULT '[]',    -- Array of question objects
    application_method  TEXT NOT NULL DEFAULT 'platform'
                            CHECK (application_method IN ('platform','email','external_url')),
    application_url     TEXT,
    application_email   TEXT,
    application_count   INT NOT NULL DEFAULT 0,
    view_count          INT NOT NULL DEFAULT 0,
    expires_at          TIMESTAMPTZ,
    filled_at           TIMESTAMPTZ,
    version             INT NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_job_slug_per_org  UNIQUE (organization_id, slug),
    CONSTRAINT chk_salary_range     CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min),
    CONSTRAINT chk_remote_type      CHECK (
        (is_remote = TRUE AND remote_type IS NOT NULL) OR is_remote = FALSE
    ),
    CONSTRAINT chk_application_method CHECK (
        (application_method = 'external_url' AND application_url IS NOT NULL) OR
        (application_method = 'email' AND application_email IS NOT NULL) OR
        application_method = 'platform'
    )
);
CREATE INDEX idx_jobs_org_active    ON job_postings(organization_id, created_at DESC)
    WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_jobs_type          ON job_postings(organization_id, job_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_category      ON job_postings(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_expiry        ON job_postings(expires_at) WHERE status = 'active';
CREATE INDEX idx_jobs_fts           ON job_postings USING GIN(
    to_tsvector('english',
        coalesce(title,'') || ' ' || coalesce(description,'') || ' ' ||
        coalesce(requirements,'')
    )
) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------

CREATE TABLE job_applications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_posting_id      UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    applicant_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'submitted'
                            CHECK (status IN ('submitted','reviewing','shortlisted','interview_scheduled','offer_sent','hired','rejected','withdrawn')),
    cover_letter        TEXT CHECK (char_length(cover_letter) <= 5000),
    resume_url          TEXT,
    portfolio_url       TEXT,
    answers             JSONB NOT NULL DEFAULT '{}',    -- Responses to custom_questions
    expected_salary     NUMERIC(12,2),
    salary_currency     CHAR(3) REFERENCES currencies(code),
    available_from      DATE,
    reviewer_note       TEXT,
    rejection_reason    TEXT,
    reviewed_by         UUID REFERENCES users(id),
    reviewed_at         TIMESTAMPTZ,
    hired_at            TIMESTAMPTZ,
    withdrawn_at        TIMESTAMPTZ,
    withdrawn_reason    TEXT,
    version             INT NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_job_application   UNIQUE (job_posting_id, applicant_id),
    CONSTRAINT chk_application_review CHECK (
        (status IN ('shortlisted','rejected') AND reviewed_by IS NOT NULL) OR
        status NOT IN ('shortlisted','rejected')
    )
);
CREATE INDEX idx_ja_job         ON job_applications(job_posting_id, status);
CREATE INDEX idx_ja_applicant   ON job_applications(applicant_id);
CREATE INDEX idx_ja_org_status  ON job_applications(organization_id, status);

-- ----------------------------------------------------------------

CREATE TABLE job_bookmarks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_posting_id  UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_job_bookmark UNIQUE (job_posting_id, user_id)
);
CREATE INDEX idx_jb_user ON job_bookmarks(user_id);

-- ================================================================
-- SECTION 10: GROUPS & CHANNELS
-- ================================================================

CREATE TABLE groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES users(id),
    name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
    slug            TEXT NOT NULL,
    description     TEXT CHECK (char_length(description) <= 2000),
    group_type      TEXT NOT NULL DEFAULT 'interest'
                        CHECK (group_type IN ('interest','department','year','alumni_chapter','career','project','other')),
    visibility      TEXT NOT NULL DEFAULT 'open'
                        CHECK (visibility IN ('public','open','private','secret')),
    join_policy     TEXT NOT NULL DEFAULT 'open'
                        CHECK (join_policy IN ('open','invite_only','request','closed')),
    banner_url      TEXT,
    avatar_url      TEXT,
    member_count    INT NOT NULL DEFAULT 0 CHECK (member_count >= 0),
    max_members     INT CHECK (max_members > 0),
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at     TIMESTAMPTZ,
    rules           TEXT,
    extra_data      JSONB NOT NULL DEFAULT '{}',
    version         INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_group_slug_per_org UNIQUE (organization_id, slug),
    CONSTRAINT chk_group_capacity   CHECK (max_members IS NULL OR max_members >= member_count)
);
CREATE INDEX idx_groups_org      ON groups(organization_id) WHERE NOT is_archived;
CREATE INDEX idx_groups_type     ON groups(organization_id, group_type) WHERE NOT is_archived;
CREATE INDEX idx_groups_featured ON groups(organization_id, is_featured) WHERE is_featured AND NOT is_archived;
CREATE INDEX idx_groups_fts      ON groups USING GIN(
    to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))
);

-- ----------------------------------------------------------------

CREATE TABLE group_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','moderator','member')),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','banned')),
    is_muted        BOOLEAN NOT NULL DEFAULT FALSE,
    notification_pref TEXT NOT NULL DEFAULT 'all'
                        CHECK (notification_pref IN ('all','mentions','none')),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invited_by      UUID REFERENCES users(id),
    left_at         TIMESTAMPTZ,
    banned_at       TIMESTAMPTZ,
    banned_by       UUID REFERENCES users(id),
    ban_reason      TEXT,

    CONSTRAINT uq_group_member UNIQUE (group_id, user_id)
);
CREATE INDEX idx_gm_group  ON group_members(group_id) WHERE left_at IS NULL AND status = 'active';
CREATE INDEX idx_gm_user   ON group_members(user_id) WHERE left_at IS NULL AND status = 'active';

-- ----------------------------------------------------------------

CREATE TABLE group_channels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
    slug            TEXT NOT NULL,
    description     TEXT,
    channel_type    TEXT NOT NULL DEFAULT 'text'
                        CHECK (channel_type IN ('text','announcements','resources','qa','voice')),
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    is_readonly     BOOLEAN NOT NULL DEFAULT FALSE,  -- Only admins can post
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    message_count   INT NOT NULL DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_channel_slug_per_group UNIQUE (group_id, slug)
);
CREATE INDEX idx_gc_group ON group_channels(group_id) WHERE NOT is_archived;

-- ----------------------------------------------------------------

CREATE TABLE channel_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id          UUID NOT NULL REFERENCES group_channels(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sender_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reply_to_id         UUID REFERENCES channel_messages(id),
    content             TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 20000),
    content_html        TEXT,
    message_type        TEXT NOT NULL DEFAULT 'text'
                            CHECK (message_type IN ('text','image','file','system')),
    is_pinned           BOOLEAN NOT NULL DEFAULT FALSE,
    is_edited           BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
) PARTITION BY RANGE (created_at);

CREATE TABLE channel_messages_2026_04 PARTITION OF channel_messages
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE channel_messages_2026_05 PARTITION OF channel_messages
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX idx_cm_channel ON channel_messages(channel_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_cm_sender  ON channel_messages(sender_id);
CREATE INDEX idx_cm_pinned  ON channel_messages(channel_id) WHERE is_pinned AND deleted_at IS NULL;

-- ================================================================
-- SECTION 11: NOTIFICATIONS
-- ================================================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN ('social','mentorship','content','events','jobs','system','billing','moderation')),
    title           TEXT NOT NULL,
    body            TEXT,
    payload         JSONB NOT NULL DEFAULT '{}',
    action_url      TEXT,
    icon_url        TEXT,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    is_seen         BOOLEAN NOT NULL DEFAULT FALSE,  -- Appeared in viewport
    is_emailed      BOOLEAN NOT NULL DEFAULT FALSE,
    is_pushed       BOOLEAN NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE notifications_2026_04 PARTITION OF notifications
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE notifications_2026_05 PARTITION OF notifications
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX idx_notifs_user_unread ON notifications(user_id, created_at DESC)
    WHERE NOT is_read;
CREATE INDEX idx_notifs_org         ON notifications(organization_id);
CREATE INDEX idx_notifs_expiry      ON notifications(expires_at) WHERE expires_at IS NOT NULL AND NOT is_read;

-- ----------------------------------------------------------------

CREATE TABLE notification_preferences (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    notification_type   TEXT NOT NULL,
    in_app_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
    digest_frequency    TEXT CHECK (digest_frequency IN ('instant','hourly','daily','weekly','never')),
    quiet_hours_start   TIME,
    quiet_hours_end     TIME,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_notif_pref UNIQUE (user_id, organization_id, notification_type)
);
CREATE INDEX idx_np_user ON notification_preferences(user_id, organization_id);

-- ================================================================
-- SECTION 12: SURVEYS & POLLS
-- ================================================================

CREATE TABLE surveys (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by          UUID NOT NULL REFERENCES users(id),
    title               TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 300),
    description         TEXT,
    target_audience     TEXT NOT NULL DEFAULT 'all'
                            CHECK (target_audience IN ('all','alumni','students','specific_group')),
    status              TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','active','paused','closed','archived')),
    is_anonymous        BOOLEAN NOT NULL DEFAULT FALSE,
    allow_multiple      BOOLEAN NOT NULL DEFAULT FALSE,
    show_progress       BOOLEAN NOT NULL DEFAULT TRUE,
    randomize_questions BOOLEAN NOT NULL DEFAULT FALSE,
    thank_you_message   TEXT,
    starts_at           TIMESTAMPTZ,
    ends_at             TIMESTAMPTZ,
    response_count      INT NOT NULL DEFAULT 0,
    max_responses       INT CHECK (max_responses > 0),
    version             INT NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_survey_dates CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX idx_surveys_org    ON surveys(organization_id, status);
CREATE INDEX idx_surveys_active ON surveys(organization_id, starts_at, ends_at)
    WHERE status = 'active';

-- ----------------------------------------------------------------

CREATE TABLE survey_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id       UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL CHECK (char_length(question_text) BETWEEN 3 AND 1000),
    question_type   TEXT NOT NULL
                        CHECK (question_type IN ('single_choice','multiple_choice','text','paragraph','rating','scale','date','ranking','matrix')),
    is_required     BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    description     TEXT,
    config          JSONB NOT NULL DEFAULT '{}',    -- Type-specific config (min/max, scale labels, etc.)
    skip_logic      JSONB NOT NULL DEFAULT '[]',    -- Conditional display rules
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sq_survey ON survey_questions(survey_id, sort_order);

-- ----------------------------------------------------------------

CREATE TABLE survey_question_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL CHECK (char_length(option_text) BETWEEN 1 AND 500),
    value       TEXT,               -- Internal value (can differ from display text)
    sort_order  SMALLINT NOT NULL DEFAULT 0,
    is_other    BOOLEAN NOT NULL DEFAULT FALSE,  -- "Other (please specify)"
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sqo_question ON survey_question_options(question_id, sort_order);

-- ----------------------------------------------------------------

CREATE TABLE survey_responses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id       UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,   -- NULL if anonymous
    respondent_token TEXT UNIQUE,    -- For anonymous tracking without identity
    is_complete     BOOLEAN NOT NULL DEFAULT FALSE,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at    TIMESTAMPTZ,
    ip_address      INET,
    device_type     TEXT,
    time_to_complete_secs INT CHECK (time_to_complete_secs >= 0),

    CONSTRAINT chk_survey_response_submit CHECK (
        (is_complete = TRUE AND submitted_at IS NOT NULL) OR is_complete = FALSE
    )
);
CREATE INDEX idx_sr_survey  ON survey_responses(survey_id, is_complete);
CREATE INDEX idx_sr_user    ON survey_responses(user_id) WHERE user_id IS NOT NULL;

-- ----------------------------------------------------------------

CREATE TABLE survey_answers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id         UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
    question_id         UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    selected_option_ids UUID[],         -- For choice questions
    text_value          TEXT,
    numeric_value       NUMERIC,
    date_value          DATE,
    json_value          JSONB,          -- For matrix/ranking answers
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_survey_answer UNIQUE (response_id, question_id)
);
CREATE INDEX idx_sa_response  ON survey_answers(response_id);
CREATE INDEX idx_sa_question  ON survey_answers(question_id);

-- ----------------------------------------------------------------

CREATE TABLE polls (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id             UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by                  UUID NOT NULL REFERENCES users(id),
    question                    TEXT NOT NULL CHECK (char_length(question) BETWEEN 3 AND 500),
    allow_multiple_votes        BOOLEAN NOT NULL DEFAULT FALSE,
    show_results_before_vote    BOOLEAN NOT NULL DEFAULT FALSE,
    is_anonymous                BOOLEAN NOT NULL DEFAULT FALSE,
    visibility                  TEXT NOT NULL DEFAULT 'org'
                                    CHECK (visibility IN ('org','alumni_only','group')),
    group_id                    UUID REFERENCES groups(id),
    total_votes                 INT NOT NULL DEFAULT 0,
    ends_at                     TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_polls_org ON polls(organization_id, created_at DESC);

CREATE TABLE poll_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id     UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL CHECK (char_length(option_text) BETWEEN 1 AND 300),
    vote_count  INT NOT NULL DEFAULT 0,
    sort_order  SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_po_poll ON poll_options(poll_id, sort_order);

CREATE TABLE poll_votes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    poll_id         UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id       UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_poll_vote UNIQUE (poll_id, option_id, user_id)
);
CREATE INDEX idx_pv_poll ON poll_votes(poll_id);
CREATE INDEX idx_pv_user ON poll_votes(user_id);

-- ================================================================
-- SECTION 13: ANNOUNCEMENTS
-- ================================================================

CREATE TABLE announcements (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id             UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    author_id                   UUID NOT NULL REFERENCES users(id),
    title                       TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 300),
    content                     TEXT NOT NULL CHECK (char_length(content) >= 10),
    content_html                TEXT,
    audience                    TEXT NOT NULL DEFAULT 'all'
                                    CHECK (audience IN ('all','alumni','students','admins')),
    priority                    TEXT NOT NULL DEFAULT 'normal'
                                    CHECK (priority IN ('low','normal','high','urgent')),
    requires_acknowledgement    BOOLEAN NOT NULL DEFAULT FALSE,
    banner_url                  TEXT,
    cta_label                   TEXT,
    cta_url                     TEXT,
    read_count                  INT NOT NULL DEFAULT 0,
    ack_count                   INT NOT NULL DEFAULT 0,
    is_pinned                   BOOLEAN NOT NULL DEFAULT FALSE,
    publish_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at                  TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at                  TIMESTAMPTZ
);
CREATE INDEX idx_ann_org_active ON announcements(organization_id, publish_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE announcement_reads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id     UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    acknowledged        BOOLEAN NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at     TIMESTAMPTZ,

    CONSTRAINT uq_ann_read UNIQUE (announcement_id, user_id),
    CONSTRAINT chk_ann_ack CHECK (
        (acknowledged = TRUE AND acknowledged_at IS NOT NULL) OR acknowledged = FALSE
    )
);
CREATE INDEX idx_ar_announcement ON announcement_reads(announcement_id);
CREATE INDEX idx_ar_user         ON announcement_reads(user_id);

-- ================================================================
-- SECTION 14: MODERATION
-- ================================================================

CREATE TABLE content_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    reporter_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type     TEXT NOT NULL CHECK (entity_type IN ('post','comment','message','channel_message','user','job','event','group')),
    entity_id       UUID NOT NULL,
    reason          TEXT NOT NULL CHECK (reason IN ('spam','harassment','hate_speech','misinformation','inappropriate','copyright','other')),
    description     TEXT CHECK (char_length(description) <= 2000),
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_review','resolved','dismissed')),
    auto_score      SMALLINT CHECK (auto_score BETWEEN 0 AND 100),   -- ML-based risk score
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    resolution      TEXT CHECK (resolution IN ('removed','warned','suspended','dismissed','escalated')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_report_resolution CHECK (
        (status = 'resolved' AND resolution IS NOT NULL) OR status <> 'resolved'
    )
);
CREATE INDEX idx_reports_org      ON content_reports(organization_id, status);
CREATE INDEX idx_reports_entity   ON content_reports(entity_type, entity_id);
CREATE INDEX idx_reports_reporter ON content_reports(reporter_id);
CREATE INDEX idx_reports_pending  ON content_reports(organization_id, created_at)
    WHERE status = 'pending';

-- ----------------------------------------------------------------

CREATE TABLE moderation_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_id       UUID REFERENCES content_reports(id),
    moderator_id    UUID NOT NULL REFERENCES users(id),
    action_type     TEXT NOT NULL
                        CHECK (action_type IN ('warn','mute','suspend','ban','remove_content','restore_content','dismiss')),
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    reason          TEXT NOT NULL,
    note            TEXT,
    duration_hours  INT CHECK (duration_hours > 0),
    expires_at      TIMESTAMPTZ,
    reversed_at     TIMESTAMPTZ,
    reversed_by     UUID REFERENCES users(id),
    reversed_reason TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ma_org       ON moderation_actions(organization_id, created_at DESC);
CREATE INDEX idx_ma_entity    ON moderation_actions(entity_type, entity_id);
CREATE INDEX idx_ma_moderator ON moderation_actions(moderator_id);

-- ----------------------------------------------------------------

CREATE TABLE user_blocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    blocker_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_block    UNIQUE (blocker_id, blocked_id, organization_id),
    CONSTRAINT chk_no_self_block CHECK (blocker_id <> blocked_id)
);
CREATE INDEX idx_blocks_blocker ON user_blocks(blocker_id, organization_id);
CREATE INDEX idx_blocks_blocked ON user_blocks(blocked_id, organization_id);

-- ----------------------------------------------------------------

CREATE TABLE blocklist_words (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pattern         TEXT NOT NULL,
    is_regex        BOOLEAN NOT NULL DEFAULT FALSE,
    category        TEXT NOT NULL DEFAULT 'profanity'
                        CHECK (category IN ('profanity','hate_speech','spam','pii','custom')),
    action          TEXT NOT NULL DEFAULT 'flag'
                        CHECK (action IN ('flag','block','auto_remove')),
    severity        SMALLINT NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_blocklist_pattern UNIQUE (organization_id, pattern)
);
CREATE INDEX idx_bl_org ON blocklist_words(organization_id, action);

-- ----------------------------------------------------------------

CREATE TABLE ip_bans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    -- NULL = global ban
    ip_address      INET NOT NULL,
    ip_range        CIDR,
    reason          TEXT NOT NULL,
    banned_by       UUID NOT NULL REFERENCES users(id),
    is_permanent    BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_ip_ban_expiry CHECK (
        (is_permanent = TRUE AND expires_at IS NULL) OR
        (is_permanent = FALSE AND expires_at IS NOT NULL)
    )
);
CREATE INDEX idx_ip_bans_addr ON ip_bans(ip_address);
CREATE INDEX idx_ip_bans_exp  ON ip_bans(expires_at) WHERE NOT is_permanent;

-- ================================================================
-- SECTION 15: ANALYTICS & REPORTING
-- ================================================================

CREATE TABLE page_views (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id      UUID,
    path            TEXT NOT NULL,
    referrer        TEXT,
    referrer_domain TEXT,
    utm_source      TEXT,
    utm_medium      TEXT,
    utm_campaign    TEXT,
    device_type     TEXT CHECK (device_type IN ('desktop','mobile','tablet','unknown')),
    browser         TEXT,
    os              TEXT,
    country_code    CHAR(2),
    ip_address      INET,
    duration_secs   INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE page_views_2026_04 PARTITION OF page_views FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE page_views_2026_05 PARTITION OF page_views FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX idx_pv_org_date ON page_views(organization_id, created_at DESC);
CREATE INDEX idx_pv_path     ON page_views(organization_id, path);

-- ----------------------------------------------------------------

CREATE TABLE daily_org_stats (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stat_date               DATE NOT NULL,
    dau                     INT NOT NULL DEFAULT 0,
    mau                     INT NOT NULL DEFAULT 0,
    new_registrations       INT NOT NULL DEFAULT 0,
    posts_created           INT NOT NULL DEFAULT 0,
    comments_created        INT NOT NULL DEFAULT 0,
    messages_sent           INT NOT NULL DEFAULT 0,
    mentorship_requests     INT NOT NULL DEFAULT 0,
    mentorship_sessions     INT NOT NULL DEFAULT 0,
    connections_made        INT NOT NULL DEFAULT 0,
    events_held             INT NOT NULL DEFAULT 0,
    event_registrations     INT NOT NULL DEFAULT 0,
    jobs_posted             INT NOT NULL DEFAULT 0,
    job_applications        INT NOT NULL DEFAULT 0,
    profile_views           INT NOT NULL DEFAULT 0,
    active_users_7d         INT NOT NULL DEFAULT 0,
    active_users_30d        INT NOT NULL DEFAULT 0,
    computed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_daily_org_stats UNIQUE (organization_id, stat_date)
);
CREATE INDEX idx_dos_org_date ON daily_org_stats(organization_id, stat_date DESC);

-- ----------------------------------------------------------------

CREATE TABLE search_queries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    query_text      TEXT NOT NULL,
    search_type     TEXT NOT NULL CHECK (search_type IN ('global','users','alumni','jobs','events','groups','posts')),
    filters         JSONB NOT NULL DEFAULT '{}',
    result_count    INT NOT NULL DEFAULT 0,
    clicked_rank    SMALLINT,
    clicked_id      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE search_queries_2026_04 PARTITION OF search_queries FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE INDEX idx_sq_org  ON search_queries(organization_id, created_at DESC);
CREATE INDEX idx_sq_text ON search_queries USING GIN(to_tsvector('english', query_text));

-- ================================================================
-- SECTION 16: BILLING & SUBSCRIPTIONS
-- ================================================================

CREATE TABLE subscription_plans (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL UNIQUE,
    slug                TEXT NOT NULL UNIQUE,
    description         TEXT,
    features            JSONB NOT NULL DEFAULT '{}',
    max_users           INT,
    max_storage_gb      INT,
    price_monthly       NUMERIC(10,2) NOT NULL CHECK (price_monthly >= 0),
    price_annual        NUMERIC(10,2) NOT NULL CHECK (price_annual >= 0),
    currency_code       CHAR(3) NOT NULL DEFAULT 'USD' REFERENCES currencies(code),
    stripe_monthly_id   TEXT,
    stripe_annual_id    TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_custom           BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------

CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id                 UUID NOT NULL REFERENCES subscription_plans(id),
    status                  TEXT NOT NULL
                                CHECK (status IN ('active','past_due','cancelled','trialing','paused','unpaid')),
    billing_cycle           TEXT NOT NULL CHECK (billing_cycle IN ('monthly','annual','custom')),
    quantity                INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price              NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_pct            NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 100),
    currency_code           CHAR(3) NOT NULL REFERENCES currencies(code),
    stripe_subscription_id  TEXT UNIQUE,
    stripe_customer_id      TEXT,
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    trial_start             TIMESTAMPTZ,
    trial_end               TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    cancellation_reason     TEXT,
    metadata                JSONB NOT NULL DEFAULT '{}',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subs_org     ON subscriptions(organization_id);
CREATE INDEX idx_subs_status  ON subscriptions(status);

-- ----------------------------------------------------------------

CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id     UUID REFERENCES subscriptions(id),
    stripe_invoice_id   TEXT UNIQUE,
    number              TEXT NOT NULL,
    description         TEXT,
    subtotal            NUMERIC(10,2) NOT NULL,
    tax_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
    total               NUMERIC(10,2) NOT NULL,
    amount_due          NUMERIC(10,2) NOT NULL,
    amount_paid         NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency_code       CHAR(3) NOT NULL REFERENCES currencies(code),
    status              TEXT NOT NULL
                            CHECK (status IN ('draft','open','paid','void','uncollectible')),
    invoice_url         TEXT,
    pdf_url             TEXT,
    due_date            TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    voided_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_invoice_total CHECK (total = subtotal + tax_amount - discount_amount),
    CONSTRAINT chk_invoice_paid  CHECK (
        (status = 'paid' AND paid_at IS NOT NULL) OR status <> 'paid'
    )
);
CREATE INDEX idx_invoices_org    ON invoices(organization_id, created_at DESC);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ================================================================
-- SECTION 17: WEBHOOKS & INTEGRATIONS
-- ================================================================

CREATE TABLE webhook_endpoints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES users(id),
    url             TEXT NOT NULL,
    description     TEXT,
    secret_hash     TEXT NOT NULL,      -- HMAC-SHA256 signing secret hash
    event_types     TEXT[] NOT NULL,
    headers         JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    retry_policy    JSONB NOT NULL DEFAULT '{"max_retries": 3, "backoff": "exponential"}',
    timeout_ms      INT NOT NULL DEFAULT 30000 CHECK (timeout_ms BETWEEN 1000 AND 120000),
    failure_count   INT NOT NULL DEFAULT 0,
    success_count   INT NOT NULL DEFAULT 0,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_webhook_url CHECK (url ~ '^https://')
);
CREATE INDEX idx_webhooks_org ON webhook_endpoints(organization_id) WHERE is_active;

-- ----------------------------------------------------------------

CREATE TABLE webhook_deliveries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id     UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,
    event_id        UUID NOT NULL,
    payload         JSONB NOT NULL,
    http_status     SMALLINT,
    response_headers JSONB,
    response_body   TEXT,
    attempt_number  SMALLINT NOT NULL DEFAULT 1 CHECK (attempt_number BETWEEN 1 AND 10),
    duration_ms     INT,
    success         BOOLEAN,
    error_message   TEXT,
    next_retry_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE webhook_deliveries_2026_04 PARTITION OF webhook_deliveries FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE INDEX idx_wd_endpoint ON webhook_deliveries(endpoint_id, created_at DESC);
CREATE INDEX idx_wd_retry    ON webhook_deliveries(next_retry_at) WHERE success IS FALSE AND next_retry_at IS NOT NULL;

-- ================================================================
-- SECTION 18: SYSTEM — AUDIT, OUTBOX, FLAGS
-- ================================================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    actor_id        UUID REFERENCES users(id),
    actor_email     TEXT,               -- Snapshot — preserved if user deleted
    actor_role      TEXT,               -- Snapshot
    action          TEXT NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       UUID,
    entity_label    TEXT,               -- Human-readable snapshot e.g. "John Doe's post"
    before_state    JSONB,
    after_state     JSONB,
    diff            JSONB,              -- Computed diff (app layer)
    ip_address      INET,
    user_agent      TEXT,
    session_id      UUID,
    request_id      UUID,               -- Correlation ID across services
    severity        TEXT NOT NULL DEFAULT 'info'
                        CHECK (severity IN ('info','warning','critical')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- NO updated_at, NO deleted_at — immutable by design
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_2026_04 PARTITION OF audit_logs FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE audit_logs_2026_05 PARTITION OF audit_logs FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX idx_audit_org      ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_actor    ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_entity   ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_severity ON audit_logs(severity, created_at DESC) WHERE severity <> 'info';

-- ----------------------------------------------------------------

CREATE TABLE event_outbox (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,
    aggregate_type  TEXT NOT NULL,
    aggregate_id    UUID NOT NULL,
    payload         JSONB NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','processing','done','failed','dead')),
    retry_count     SMALLINT NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    max_retries     SMALLINT NOT NULL DEFAULT 5,
    last_error      TEXT,
    process_after   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lock_until      TIMESTAMPTZ,        -- Pessimistic lock for processing
    locked_by       TEXT,               -- Worker ID
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_outbox_dead CHECK (
        (status = 'dead' AND retry_count >= max_retries) OR status <> 'dead'
    )
);
CREATE INDEX idx_outbox_pending ON event_outbox(status, process_after)
    WHERE status IN ('pending','failed');
CREATE INDEX idx_outbox_agg     ON event_outbox(aggregate_type, aggregate_id);

-- ----------------------------------------------------------------

CREATE TABLE feature_flags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    -- NULL = global flag
    flag_key        TEXT NOT NULL,
    flag_type       TEXT NOT NULL DEFAULT 'boolean'
                        CHECK (flag_type IN ('boolean','percentage','user_list','json')),
    is_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    value           JSONB NOT NULL DEFAULT '{}',
    description     TEXT,
    rollout_pct     SMALLINT CHECK (rollout_pct BETWEEN 0 AND 100),
    allowed_users   UUID[],
    environment     TEXT NOT NULL DEFAULT 'production'
                        CHECK (environment IN ('development','staging','production')),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_feature_flag UNIQUE (organization_id, flag_key, environment)
);
CREATE INDEX idx_flags_org  ON feature_flags(organization_id);
CREATE INDEX idx_flags_key  ON feature_flags(flag_key, environment);
CREATE INDEX idx_flags_exp  ON feature_flags(expires_at) WHERE expires_at IS NOT NULL AND is_enabled;

-- ----------------------------------------------------------------

CREATE TABLE schema_migrations (
    -- Already created above at the top
);

-- ================================================================
-- ================================================================
-- SECTION 19: TRIGGERS — COMPLETE LIBRARY (25 triggers)
-- ================================================================
-- ================================================================

-- ----------------------------------------------------------------
-- T-1: Universal updated_at stamper
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'organizations','org_settings','users','user_oauth_accounts',
    'alumni_profiles','student_profiles','alumni_work_history','profile_education',
    'skills','profile_skills','verification_requests',
    'connections','mentorship_requests','mentorship_sessions',
    'posts','post_comments','chat_threads',
    'messages','events','groups','group_members','group_channels',
    'channel_messages','job_postings','job_applications',
    'surveys','survey_questions','polls',
    'announcements','subscriptions','subscription_plans',
    'webhook_endpoints','feature_flags',
    'user_roles','notification_preferences'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()', tbl);
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------
-- T-2: Optimistic locking — prevents lost updates
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_optimistic_lock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.version <> OLD.version + 1 THEN
        RAISE EXCEPTION 'Optimistic lock conflict on table %. Expected version %, got %.',
            TG_TABLE_NAME, OLD.version + 1, NEW.version
            USING ERRCODE = 'P0001', HINT = 'Re-fetch the record and retry.';
    END IF;
    RETURN NEW;
END;
$$;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'organizations','users','alumni_profiles','student_profiles',
    'posts','job_postings','job_applications','events','groups','surveys'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_optimistic_lock
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_optimistic_lock()', tbl);
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------
-- T-3: Soft delete guard — blocks hard DELETEs on protected tables
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_prevent_hard_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Hard DELETE is disabled on table %. Use soft delete (set deleted_at = NOW()).',
        TG_TABLE_NAME
        USING ERRCODE = 'P0002';
END;
$$;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','posts','events','job_postings','announcements','groups'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_no_hard_delete
       BEFORE DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_prevent_hard_delete()', tbl);
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------
-- T-4: Audit logger — auto-logs every INSERT/UPDATE/DELETE
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_audit_logger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_org_id    UUID;
    v_actor_id  UUID;
    v_before    JSONB;
    v_after     JSONB;
    v_action    TEXT;
BEGIN
    v_actor_id  := current_setting('app.current_user_id', TRUE)::UUID;
    v_org_id    := COALESCE(
        current_setting('app.organization_id', TRUE)::UUID,
        CASE WHEN TG_OP <> 'DELETE' THEN (row_to_json(NEW)->>'organization_id')::UUID
             ELSE (row_to_json(OLD)->>'organization_id')::UUID END
    );

    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_before := NULL;
        v_after  := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_before := to_jsonb(OLD);
        v_after  := to_jsonb(NEW);
    ELSE
        v_action := 'DELETE';
        v_before := to_jsonb(OLD);
        v_after  := NULL;
    END IF;

    INSERT INTO audit_logs (
        organization_id, actor_id, action,
        entity_type, entity_id,
        before_state, after_state,
        ip_address, session_id
    ) VALUES (
        v_org_id, v_actor_id, v_action,
        TG_TABLE_NAME,
        CASE WHEN TG_OP <> 'DELETE' THEN (row_to_json(NEW)->>'id')::UUID
             ELSE (row_to_json(OLD)->>'id')::UUID END,
        v_before, v_after,
        current_setting('app.client_ip', TRUE)::INET,
        current_setting('app.session_id', TRUE)::UUID
    );

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Apply audit trigger to high-value tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'user_roles','users','organizations','verification_requests',
    'moderation_actions','content_reports','subscriptions'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_audit
       AFTER INSERT OR UPDATE OR DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_audit_logger()', tbl);
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------
-- T-5: Role escalation guard — nobody can grant a role higher than their own
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_prevent_role_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_granter_priority  INT;
    v_target_priority   INT;
    v_current_user      UUID;
    v_granter_role      TEXT;
BEGIN
    v_current_user  := current_setting('app.current_user_id', TRUE)::UUID;
    v_granter_role  := current_setting('app.user_role', TRUE);

    -- super_admin can do anything
    IF v_granter_role = 'super_admin' THEN RETURN NEW; END IF;

    -- Get granter's highest priority in this org
    SELECT COALESCE(MAX(r.priority), 0) INTO v_granter_priority
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = v_current_user
      AND ur.organization_id = NEW.organization_id
      AND ur.revoked_at IS NULL
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

    -- Get target role priority
    SELECT priority INTO v_target_priority FROM roles WHERE id = NEW.role_id;

    IF v_target_priority >= v_granter_priority THEN
        RAISE EXCEPTION 'Privilege escalation denied: cannot grant role with priority % (your max: %)',
            v_target_priority, v_granter_priority
            USING ERRCODE = 'P0003';
    END IF;

    -- Prevent self-role-modification
    IF NEW.user_id = v_current_user THEN
        RAISE EXCEPTION 'Cannot grant or modify your own roles.'
            USING ERRCODE = 'P0004';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_role_escalation
    BEFORE INSERT OR UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_role_escalation();

-- ----------------------------------------------------------------
-- T-6: Post counter sync on comments
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_post_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NOT NEW.is_deleted THEN
        UPDATE posts SET comment_count = comment_count + 1
        WHERE id = NEW.post_id;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Comment was soft-deleted
        IF NEW.is_deleted AND NOT OLD.is_deleted THEN
            UPDATE posts SET comment_count = GREATEST(0, comment_count - 1)
            WHERE id = NEW.post_id;
        END IF;
        -- Comment was restored
        IF NOT NEW.is_deleted AND OLD.is_deleted THEN
            UPDATE posts SET comment_count = comment_count + 1
            WHERE id = NEW.post_id;
        END IF;

    ELSIF TG_OP = 'DELETE' AND NOT OLD.is_deleted THEN
        UPDATE posts SET comment_count = GREATEST(0, comment_count - 1)
        WHERE id = OLD.post_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_post_comment_count
    AFTER INSERT OR UPDATE OF is_deleted OR DELETE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION fn_sync_post_comment_count();

-- ----------------------------------------------------------------
-- T-7: Reaction counter sync (polymorphic)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_reaction_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_delta INT := CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END;
    v_id    UUID := CASE WHEN TG_OP = 'DELETE' THEN OLD.entity_id ELSE NEW.entity_id END;
    v_type  TEXT := CASE WHEN TG_OP = 'DELETE' THEN OLD.entity_type ELSE NEW.entity_type END;
BEGIN
    IF v_type = 'post' THEN
        UPDATE posts SET reaction_count = GREATEST(0, reaction_count + v_delta) WHERE id = v_id;
    ELSIF v_type = 'comment' THEN
        UPDATE post_comments SET reaction_count = GREATEST(0, reaction_count + v_delta) WHERE id = v_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_reaction_count
    AFTER INSERT OR DELETE ON reactions
    FOR EACH ROW EXECUTE FUNCTION fn_sync_reaction_count();

-- ----------------------------------------------------------------
-- T-8: Group member count sync
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_group_member_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' AND NEW.left_at IS NULL THEN
        UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Member left or was banned
        IF (NEW.left_at IS NOT NULL AND OLD.left_at IS NULL)
            OR (NEW.status = 'banned' AND OLD.status = 'active') THEN
            UPDATE groups SET member_count = GREATEST(0, member_count - 1) WHERE id = NEW.group_id;
        END IF;
        -- Member re-joined
        IF (NEW.left_at IS NULL AND OLD.left_at IS NOT NULL AND NEW.status = 'active') THEN
            UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
        END IF;

    ELSIF TG_OP = 'DELETE' AND OLD.left_at IS NULL AND OLD.status = 'active' THEN
        UPDATE groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_group_member_count
    AFTER INSERT OR UPDATE OF left_at, status OR DELETE ON group_members
    FOR EACH ROW EXECUTE FUNCTION fn_sync_group_member_count();

-- ----------------------------------------------------------------
-- T-9: Skill usage counter sync
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_skill_usage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE skills SET usage_count = usage_count + 1 WHERE id = NEW.skill_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE skills SET usage_count = GREATEST(0, usage_count - 1) WHERE id = OLD.skill_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_skill_usage
    AFTER INSERT OR DELETE ON profile_skills
    FOR EACH ROW EXECUTE FUNCTION fn_sync_skill_usage();

-- ----------------------------------------------------------------
-- T-10: Skill endorsement counter sync
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_endorsement_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profile_skills SET endorsed_count = endorsed_count + 1
        WHERE id = NEW.profile_skill_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profile_skills SET endorsed_count = GREATEST(0, endorsed_count - 1)
        WHERE id = OLD.profile_skill_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_endorsement_count
    AFTER INSERT OR DELETE ON skill_endorsements
    FOR EACH ROW EXECUTE FUNCTION fn_sync_endorsement_count();

-- ----------------------------------------------------------------
-- T-11: Job application counter sync
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_job_application_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE job_postings SET application_count = application_count + 1 WHERE id = NEW.job_posting_id;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Withdrawn
        IF NEW.status = 'withdrawn' AND OLD.status <> 'withdrawn' THEN
            UPDATE job_postings SET application_count = GREATEST(0, application_count - 1)
            WHERE id = NEW.job_posting_id;
        END IF;
        -- Un-withdrawn
        IF OLD.status = 'withdrawn' AND NEW.status <> 'withdrawn' THEN
            UPDATE job_postings SET application_count = application_count + 1
            WHERE id = NEW.job_posting_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_job_app_count
    AFTER INSERT OR UPDATE OF status ON job_applications
    FOR EACH ROW EXECUTE FUNCTION fn_sync_job_application_count();

-- ----------------------------------------------------------------
-- T-12: Event registration counter + capacity enforcement
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_event_registration_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_event events%ROWTYPE;
BEGIN
    SELECT * INTO v_event FROM events WHERE id = COALESCE(NEW.event_id, OLD.event_id) FOR UPDATE;

    IF TG_OP = 'INSERT' AND NEW.status = 'registered' THEN
        IF v_event.max_capacity IS NOT NULL
           AND v_event.registered_count >= v_event.max_capacity THEN
            -- Auto-waitlist
            NEW.status := 'waitlisted';
            UPDATE events SET waitlist_count = waitlist_count + 1 WHERE id = NEW.event_id;
        ELSE
            UPDATE events SET registered_count = registered_count + 1 WHERE id = NEW.event_id;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'cancelled' AND OLD.status = 'registered' THEN
            UPDATE events SET registered_count = GREATEST(0, registered_count - 1) WHERE id = NEW.event_id;
            -- Promote first waitlisted person
            UPDATE event_registrations
            SET status = 'registered'
            WHERE event_id = NEW.event_id
              AND status = 'waitlisted'
              AND id = (
                  SELECT id FROM event_registrations
                  WHERE event_id = NEW.event_id AND status = 'waitlisted'
                  ORDER BY registered_at ASC LIMIT 1
              );
        ELSIF NEW.status = 'cancelled' AND OLD.status = 'waitlisted' THEN
            UPDATE events SET waitlist_count = GREATEST(0, waitlist_count - 1) WHERE id = NEW.event_id;
        ELSIF NEW.status = 'attended' AND OLD.status = 'registered' THEN
            NULL; -- No count change, just status update
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_event_reg_count
    BEFORE INSERT OR UPDATE OF status ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION fn_sync_event_registration_count();

-- ----------------------------------------------------------------
-- T-13: Chat thread last_message_at sync
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_thread_last_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
        UPDATE chat_threads
        SET last_message_id = NEW.id,
            last_message_at = NEW.created_at,
            message_count   = message_count + 1
        WHERE id = NEW.thread_id;

        -- Increment unread count for all OTHER members
        UPDATE chat_thread_members
        SET unread_count = unread_count + 1
        WHERE thread_id = NEW.thread_id
          AND user_id <> NEW.sender_id
          AND left_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_thread_last_msg
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION fn_sync_thread_last_message();

-- ----------------------------------------------------------------
-- T-14: Channel message count sync
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_channel_message_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
        UPDATE group_channels
        SET message_count   = message_count + 1,
            last_message_at = NEW.created_at
        WHERE id = NEW.channel_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE group_channels
        SET message_count = GREATEST(0, message_count - 1)
        WHERE id = NEW.channel_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_channel_msg_count
    AFTER INSERT OR UPDATE OF deleted_at ON channel_messages
    FOR EACH ROW EXECUTE FUNCTION fn_sync_channel_message_count();

-- ----------------------------------------------------------------
-- T-15: Survey response counter sync
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_survey_response_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.is_complete AND NOT OLD.is_complete THEN
        UPDATE surveys SET response_count = response_count + 1 WHERE id = NEW.survey_id;
    ELSIF TG_OP = 'DELETE' AND OLD.is_complete THEN
        UPDATE surveys SET response_count = GREATEST(0, response_count - 1) WHERE id = OLD.survey_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_survey_response_count
    AFTER UPDATE OF is_complete OR DELETE ON survey_responses
    FOR EACH ROW EXECUTE FUNCTION fn_sync_survey_response_count();

-- ----------------------------------------------------------------
-- T-16: Poll vote counter sync
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_poll_vote_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
        UPDATE polls SET total_votes = total_votes + 1 WHERE id = NEW.poll_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE poll_options SET vote_count = GREATEST(0, vote_count - 1) WHERE id = OLD.option_id;
        UPDATE polls SET total_votes = GREATEST(0, total_votes - 1) WHERE id = OLD.poll_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_poll_vote_count
    AFTER INSERT OR DELETE ON poll_votes
    FOR EACH ROW EXECUTE FUNCTION fn_sync_poll_vote_count();

-- ----------------------------------------------------------------
-- T-17: Tag usage counter sync (via taggables)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_tag_usage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags SET usage_count = GREATEST(0, usage_count - 1) WHERE id = OLD.tag_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_tag_usage
    AFTER INSERT OR DELETE ON taggables
    FOR EACH ROW EXECUTE FUNCTION fn_sync_tag_usage();

-- ----------------------------------------------------------------
-- T-18: User account lockout — auto-lock on too many failures
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_user_lockout()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.failed_login_count >= 10 AND OLD.failed_login_count < 10 THEN
        NEW.locked_until := NOW() + INTERVAL '2 hours';
        INSERT INTO audit_logs (organization_id, actor_id, action, entity_type, entity_id, severity)
        VALUES (NEW.organization_id, NEW.id, 'ACCOUNT_AUTO_LOCKED', 'user', NEW.id, 'warning');
    ELSIF NEW.failed_login_count >= 5 AND OLD.failed_login_count < 5 THEN
        NEW.locked_until := NOW() + INTERVAL '15 minutes';
    END IF;

    -- Clear lockout when login succeeds (failed_login_count reset to 0)
    IF NEW.failed_login_count = 0 AND OLD.failed_login_count > 0 THEN
        NEW.locked_until := NULL;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_lockout
    BEFORE UPDATE OF failed_login_count ON users
    FOR EACH ROW EXECUTE FUNCTION fn_user_lockout();

-- ----------------------------------------------------------------
-- T-19: Email uniqueness enforcer across orgs for super_admin detection
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_enforce_super_admin_email_uniqueness()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.user_type = 'super_admin' THEN
        IF EXISTS (
            SELECT 1 FROM users
            WHERE email_normalized = NEW.email_normalized
              AND user_type = 'super_admin'
              AND id <> NEW.id
              AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'A super_admin with email % already exists globally.', NEW.email
                USING ERRCODE = 'P0005';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_super_admin_email_unique
    BEFORE INSERT OR UPDATE OF email, user_type ON users
    FOR EACH ROW EXECUTE FUNCTION fn_enforce_super_admin_email_uniqueness();

-- ----------------------------------------------------------------
-- T-20: Password change audit
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_password_change_audit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.password_hash IS DISTINCT FROM OLD.password_hash AND NEW.password_hash IS NOT NULL THEN
        NEW.password_changed_at := NOW();
        INSERT INTO audit_logs (organization_id, actor_id, action, entity_type, entity_id, severity)
        VALUES (NEW.organization_id, NEW.id, 'PASSWORD_CHANGED', 'user', NEW.id, 'info');
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_password_change
    BEFORE UPDATE OF password_hash ON users
    FOR EACH ROW EXECUTE FUNCTION fn_password_change_audit();

-- ----------------------------------------------------------------
-- T-21: Announcement read count sync
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_announcement_read()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE announcements SET read_count = read_count + 1 WHERE id = NEW.announcement_id;
    END IF;
    IF TG_OP IN ('INSERT','UPDATE') AND NEW.acknowledged AND (OLD IS NULL OR NOT OLD.acknowledged) THEN
        UPDATE announcements SET ack_count = ack_count + 1 WHERE id = NEW.announcement_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_announcement_read
    AFTER INSERT OR UPDATE OF acknowledged ON announcement_reads
    FOR EACH ROW EXECUTE FUNCTION fn_sync_announcement_read();

-- ----------------------------------------------------------------
-- T-22: Event outbox publisher — auto-enqueue domain events
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_publish_domain_event()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_org_id UUID;
    v_event  TEXT;
BEGIN
    v_org_id := COALESCE(
        (row_to_json(COALESCE(NEW,OLD))->>'organization_id')::UUID,
        current_setting('app.organization_id',TRUE)::UUID
    );
    v_event := TG_TABLE_NAME || '.' || lower(TG_OP);

    INSERT INTO event_outbox (organization_id, event_type, aggregate_type, aggregate_id, payload)
    VALUES (
        v_org_id,
        v_event,
        TG_TABLE_NAME,
        (row_to_json(COALESCE(NEW,OLD))->>'id')::UUID,
        to_jsonb(COALESCE(NEW,OLD))
    );

    RETURN COALESCE(NEW,OLD);
END;
$$;

-- Publish events for key business actions
DO $$
DECLARE rec RECORD;
BEGIN
  FOR rec IN SELECT unnest(ARRAY[
    'mentorship_requests','mentorship_sessions','connections',
    'job_applications','event_registrations','user_roles',
    'verification_requests','subscriptions'
  ]) AS tbl LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_publish_event
       AFTER INSERT OR UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_publish_domain_event()', rec.tbl);
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------
-- T-23: Profile completeness auto-calculator
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calc_alumni_completeness()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_score INT := 0;
BEGIN
    IF NEW.bio IS NOT NULL AND length(trim(NEW.bio)) > 20       THEN v_score := v_score + 15; END IF;
    IF NEW.headline IS NOT NULL                                  THEN v_score := v_score + 10; END IF;
    IF NEW.graduation_year IS NOT NULL                           THEN v_score := v_score + 10; END IF;
    IF NEW.current_company IS NOT NULL                           THEN v_score := v_score + 10; END IF;
    IF NEW.current_title IS NOT NULL                             THEN v_score := v_score + 10; END IF;
    IF NEW.linkedin_url IS NOT NULL                              THEN v_score := v_score + 10; END IF;
    IF NEW.country_code IS NOT NULL                              THEN v_score := v_score + 5;  END IF;
    IF NEW.is_mentor_available                                   THEN v_score := v_score + 5;  END IF;
    IF NEW.industry IS NOT NULL                                  THEN v_score := v_score + 5;  END IF;
    IF NEW.preferred_contact IS NOT NULL                         THEN v_score := v_score + 5;  END IF;
    -- Bonus from related tables (capped)
    v_score := v_score + LEAST(15, (
        SELECT COUNT(*) * 3 FROM profile_skills WHERE owner_id = NEW.user_id AND owner_type = 'alumni'
    ));

    NEW.profile_completeness := LEAST(100, v_score);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_alumni_completeness
    BEFORE INSERT OR UPDATE ON alumni_profiles
    FOR EACH ROW EXECUTE FUNCTION fn_calc_alumni_completeness();

CREATE OR REPLACE FUNCTION fn_calc_student_completeness()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_score INT := 0;
BEGIN
    IF NEW.bio IS NOT NULL AND length(trim(NEW.bio)) > 20       THEN v_score := v_score + 15; END IF;
    IF NEW.headline IS NOT NULL                                  THEN v_score := v_score + 10; END IF;
    IF NEW.major IS NOT NULL                                     THEN v_score := v_score + 10; END IF;
    IF NEW.expected_graduation IS NOT NULL                       THEN v_score := v_score + 10; END IF;
    IF NEW.linkedin_url IS NOT NULL                              THEN v_score := v_score + 10; END IF;
    IF NEW.github_url IS NOT NULL                                THEN v_score := v_score + 10; END IF;
    IF NEW.country_code IS NOT NULL                              THEN v_score := v_score + 5;  END IF;
    IF NEW.gpa IS NOT NULL                                       THEN v_score := v_score + 5;  END IF;
    IF NEW.is_seeking_mentorship                                 THEN v_score := v_score + 5;  END IF;
    v_score := v_score + LEAST(20, (
        SELECT COUNT(*) * 4 FROM profile_skills WHERE owner_id = NEW.user_id AND owner_type = 'student'
    ));
    NEW.profile_completeness := LEAST(100, v_score);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_student_completeness
    BEFORE INSERT OR UPDATE ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION fn_calc_student_completeness();

-- ----------------------------------------------------------------
-- T-24: Outbox dead letter — mark as dead after max retries
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_outbox_dead_letter()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.retry_count >= NEW.max_retries AND NEW.status = 'failed' THEN
        NEW.status := 'dead';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_outbox_dead_letter
    BEFORE UPDATE OF retry_count ON event_outbox
    FOR EACH ROW EXECUTE FUNCTION fn_outbox_dead_letter();

-- ----------------------------------------------------------------
-- T-25: Mentorship slot guard
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_mentorship_slots()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_available_slots INT;
    v_active_count    INT;
BEGIN
    SELECT mentorship_slots INTO v_available_slots
    FROM alumni_profiles
    WHERE user_id = NEW.alumni_id
      AND organization_id = NEW.organization_id;

    IF v_available_slots IS NULL OR v_available_slots = 0 THEN
        RAISE EXCEPTION 'This alumni is not accepting mentorship requests.'
            USING ERRCODE = 'P0006';
    END IF;

    SELECT COUNT(*) INTO v_active_count
    FROM mentorship_requests
    WHERE alumni_id = NEW.alumni_id
      AND organization_id = NEW.organization_id
      AND status = 'accepted'
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

    IF v_active_count >= v_available_slots THEN
        RAISE EXCEPTION 'Alumni has no available mentorship slots (% slots, % filled).',
            v_available_slots, v_active_count
            USING ERRCODE = 'P0007';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mentorship_slots
    BEFORE INSERT OR UPDATE OF status ON mentorship_requests
    FOR EACH ROW
    WHEN (NEW.status = 'accepted')
    EXECUTE FUNCTION fn_check_mentorship_slots();

-- ================================================================
-- SECTION 20: ROW-LEVEL SECURITY (RLS)
-- ================================================================

-- Session variable helpers (set by app middleware on every connection)
CREATE OR REPLACE FUNCTION current_org_id()  RETURNS UUID    LANGUAGE SQL STABLE SECURITY DEFINER AS $$ SELECT current_setting('app.organization_id',  TRUE)::UUID; $$;
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID    LANGUAGE SQL STABLE SECURITY DEFINER AS $$ SELECT current_setting('app.current_user_id', TRUE)::UUID; $$;
CREATE OR REPLACE FUNCTION current_role_name() RETURNS TEXT  LANGUAGE SQL STABLE SECURITY DEFINER AS $$ SELECT current_setting('app.user_role',        TRUE); $$;
CREATE OR REPLACE FUNCTION is_super_admin()  RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$ SELECT current_setting('app.user_role', TRUE) = 'super_admin'; $$;
CREATE OR REPLACE FUNCTION is_admin_or_above() RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$ SELECT current_setting('app.user_role', TRUE) IN ('super_admin','admin'); $$;

-- Enable RLS on all tenant-scoped tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','user_roles','user_sessions','user_oauth_accounts',
    'password_reset_tokens','email_verification_tokens','push_subscriptions',
    'alumni_profiles','student_profiles','alumni_work_history',
    'profile_education','profile_skills','skill_endorsements',
    'verification_requests','connections','mentorship_requests',
    'mentorship_sessions','posts','post_comments','post_attachments',
    'reactions','taggables','tags','chat_threads','chat_thread_members',
    'messages','message_attachments','events','event_registrations',
    'event_speakers','job_postings','job_applications','job_bookmarks',
    'groups','group_members','group_channels','channel_messages',
    'notifications','notification_preferences','surveys','survey_questions',
    'survey_question_options','survey_responses','survey_answers',
    'polls','poll_options','poll_votes','announcements','announcement_reads',
    'content_reports','moderation_actions','user_blocks',
    'blocklist_words','feature_flags','webhook_endpoints','webhook_deliveries',
    'daily_org_stats','subscriptions','invoices','audit_logs'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    -- Superuser bypass
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
  END LOOP;
END;
$$;

-- ---- USERS ----
CREATE POLICY pol_users_select ON users FOR SELECT USING (
    is_super_admin() OR organization_id = current_org_id()
);
CREATE POLICY pol_users_insert ON users FOR INSERT WITH CHECK (
    is_super_admin() OR organization_id = current_org_id()
);
CREATE POLICY pol_users_update ON users FOR UPDATE
    USING (
        is_super_admin()
        OR (organization_id = current_org_id() AND (id = current_user_id() OR is_admin_or_above()))
    )
    WITH CHECK (
        organization_id = current_org_id()
        -- prevent downgrade of own type via this path — use user_roles instead
    );
CREATE POLICY pol_users_delete ON users FOR DELETE USING (is_super_admin());

-- ---- USER_ROLES — prevent self-modification ----
CREATE POLICY pol_user_roles_select ON user_roles FOR SELECT USING (
    is_super_admin() OR organization_id = current_org_id()
);
CREATE POLICY pol_user_roles_insert ON user_roles FOR INSERT WITH CHECK (
    (is_super_admin() OR (organization_id = current_org_id() AND is_admin_or_above()))
    AND user_id <> current_user_id()
);
CREATE POLICY pol_user_roles_update ON user_roles FOR UPDATE USING (
    is_super_admin() AND user_id <> current_user_id()
);
CREATE POLICY pol_user_roles_delete ON user_roles FOR DELETE USING (
    (is_super_admin() OR (organization_id = current_org_id() AND is_admin_or_above()))
    AND user_id <> current_user_id()
);

-- ---- ALUMNI & STUDENT PROFILES ----
CREATE POLICY pol_alumni_select ON alumni_profiles FOR SELECT USING (
    is_super_admin() OR organization_id = current_org_id()
);
CREATE POLICY pol_alumni_insert ON alumni_profiles FOR INSERT WITH CHECK (
    is_super_admin() OR organization_id = current_org_id()
);
CREATE POLICY pol_alumni_update ON alumni_profiles FOR UPDATE USING (
    is_super_admin()
    OR (organization_id = current_org_id() AND (user_id = current_user_id() OR is_admin_or_above()))
);

CREATE POLICY pol_student_select ON student_profiles FOR SELECT USING (
    is_super_admin() OR organization_id = current_org_id()
);
CREATE POLICY pol_student_insert ON student_profiles FOR INSERT WITH CHECK (
    is_super_admin() OR organization_id = current_org_id()
);
CREATE POLICY pol_student_update ON student_profiles FOR UPDATE USING (
    is_super_admin()
    OR (organization_id = current_org_id() AND (user_id = current_user_id() OR is_admin_or_above()))
);

-- ---- POSTS ----
CREATE POLICY pol_posts_select ON posts FOR SELECT USING (
    is_super_admin()
    OR (organization_id = current_org_id() AND deleted_at IS NULL)
);
CREATE POLICY pol_posts_insert ON posts FOR INSERT WITH CHECK (
    organization_id = current_org_id()
);
CREATE POLICY pol_posts_update ON posts FOR UPDATE USING (
    is_super_admin()
    OR (organization_id = current_org_id()
        AND (author_id = current_user_id() OR is_admin_or_above()))
);

-- ---- MESSAGES ----
CREATE POLICY pol_messages_select ON messages FOR SELECT USING (
    is_super_admin()
    OR (
        organization_id = current_org_id()
        AND deleted_at IS NULL
        AND thread_id IN (
            SELECT thread_id FROM chat_thread_members
            WHERE user_id = current_user_id() AND left_at IS NULL
        )
    )
);
CREATE POLICY pol_messages_insert ON messages FOR INSERT WITH CHECK (
    organization_id = current_org_id()
    AND sender_id = current_user_id()
    AND thread_id IN (
        SELECT thread_id FROM chat_thread_members
        WHERE user_id = current_user_id() AND left_at IS NULL
    )
);
CREATE POLICY pol_messages_update ON messages FOR UPDATE USING (
    (organization_id = current_org_id() AND sender_id = current_user_id())
    OR is_super_admin()
);

-- ---- NOTIFICATIONS ----
CREATE POLICY pol_notifs_select ON notifications FOR SELECT USING (
    user_id = current_user_id() OR is_super_admin()
);
CREATE POLICY pol_notifs_update ON notifications FOR UPDATE USING (
    user_id = current_user_id()
);

-- ---- CONNECTIONS ----
CREATE POLICY pol_connections_select ON connections FOR SELECT USING (
    is_super_admin()
    OR (organization_id = current_org_id()
        AND (requester_id = current_user_id() OR recipient_id = current_user_id() OR is_admin_or_above()))
);
CREATE POLICY pol_connections_insert ON connections FOR INSERT WITH CHECK (
    organization_id = current_org_id()
    AND requester_id = current_user_id()
);
CREATE POLICY pol_connections_update ON connections FOR UPDATE USING (
    organization_id = current_org_id()
    AND (requester_id = current_user_id() OR recipient_id = current_user_id())
);

-- ---- AUDIT LOGS — read-only for admins, no writes via RLS ----
CREATE POLICY pol_audit_select ON audit_logs FOR SELECT USING (
    is_super_admin()
    OR (organization_id = current_org_id() AND is_admin_or_above())
);
-- No INSERT/UPDATE/DELETE policy — only SECURITY DEFINER functions write audit logs

-- ---- MENTORSHIP — students see own, alumni see own, admins see all ----
CREATE POLICY pol_mr_select ON mentorship_requests FOR SELECT USING (
    is_super_admin()
    OR (organization_id = current_org_id()
        AND (student_id = current_user_id() OR alumni_id = current_user_id() OR is_admin_or_above()))
);
CREATE POLICY pol_mr_insert ON mentorship_requests FOR INSERT WITH CHECK (
    organization_id = current_org_id()
    AND student_id = current_user_id()
);
CREATE POLICY pol_mr_update ON mentorship_requests FOR UPDATE USING (
    organization_id = current_org_id()
    AND (student_id = current_user_id() OR alumni_id = current_user_id() OR is_admin_or_above())
);

-- ---- JOB APPLICATIONS — applicant sees own, admins see all ----
CREATE POLICY pol_ja_select ON job_applications FOR SELECT USING (
    is_super_admin()
    OR (organization_id = current_org_id()
        AND (applicant_id = current_user_id() OR is_admin_or_above()))
);
CREATE POLICY pol_ja_insert ON job_applications FOR INSERT WITH CHECK (
    organization_id = current_org_id() AND applicant_id = current_user_id()
);
CREATE POLICY pol_ja_update ON job_applications FOR UPDATE USING (
    organization_id = current_org_id()
    AND (applicant_id = current_user_id() OR is_admin_or_above())
);

-- ================================================================
-- SECTION 21: UTILITY VIEWS
-- ================================================================

-- Effective permissions per user (union of role perms + overrides)
CREATE OR REPLACE VIEW v_user_effective_permissions AS
SELECT DISTINCT
    ur.user_id,
    ur.organization_id,
    p.code         AS permission_code,
    p.category,
    TRUE           AS is_granted
FROM user_roles ur
JOIN role_permissions rp ON rp.role_id = ur.role_id
JOIN permissions p       ON p.id = rp.permission_id
WHERE ur.revoked_at IS NULL
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())

UNION ALL

SELECT
    upo.user_id,
    upo.organization_id,
    p.code,
    p.category,
    upo.is_grant AS is_granted
FROM user_permission_overrides upo
JOIN permissions p ON p.id = upo.permission_id
WHERE (upo.expires_at IS NULL OR upo.expires_at > NOW());

-- Active mentors available for matching
CREATE OR REPLACE VIEW v_available_mentors AS
SELECT
    ap.user_id,
    ap.organization_id,
    u.full_name,
    u.avatar_url,
    ap.headline,
    ap.current_title,
    ap.current_company,
    ap.industry,
    ap.mentorship_topics,
    ap.mentorship_slots - COUNT(mr.id) AS remaining_slots,
    ap.profile_completeness,
    ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) AS skills
FROM alumni_profiles ap
JOIN users u ON u.id = ap.user_id
LEFT JOIN mentorship_requests mr ON mr.alumni_id = ap.user_id
    AND mr.status = 'accepted'
    AND mr.organization_id = ap.organization_id
LEFT JOIN profile_skills ps ON ps.owner_id = ap.user_id AND ps.owner_type = 'alumni'
LEFT JOIN skills s ON s.id = ps.skill_id AND ps.is_featured
WHERE ap.is_mentor_available
  AND ap.is_verified
  AND u.status = 'active'
  AND u.deleted_at IS NULL
GROUP BY ap.user_id, ap.organization_id, u.full_name, u.avatar_url,
         ap.headline, ap.current_title, ap.current_company, ap.industry,
         ap.mentorship_topics, ap.mentorship_slots, ap.profile_completeness
HAVING ap.mentorship_slots - COUNT(mr.id) > 0;

-- User connection status (efficient lookup)
CREATE OR REPLACE VIEW v_connection_status AS
SELECT
    LEAST(requester_id::TEXT, recipient_id::TEXT)::UUID    AS user_a,
    GREATEST(requester_id::TEXT, recipient_id::TEXT)::UUID AS user_b,
    organization_id,
    status,
    accepted_at,
    created_at
FROM connections;

-- Org health dashboard
CREATE OR REPLACE VIEW v_org_health AS
SELECT
    o.id              AS organization_id,
    o.name,
    o.plan_tier,
    COUNT(DISTINCT u.id)                                       AS total_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.status = 'active')    AS active_users,
    COUNT(DISTINCT ap.id) FILTER (WHERE ap.is_verified)        AS verified_alumni,
    COUNT(DISTINCT sp.id) FILTER (WHERE sp.is_verified)        AS verified_students,
    COUNT(DISTINCT p.id)  FILTER (WHERE p.deleted_at IS NULL)  AS total_posts,
    COUNT(DISTINCT mr.id) FILTER (WHERE mr.status = 'accepted') AS active_mentorships,
    COUNT(DISTINCT e.id)  FILTER (WHERE e.deleted_at IS NULL)  AS total_events,
    COUNT(DISTINCT j.id)  FILTER (WHERE j.status = 'active')   AS active_jobs
FROM organizations o
LEFT JOIN users u           ON u.organization_id = o.id AND u.deleted_at IS NULL
LEFT JOIN alumni_profiles ap ON ap.organization_id = o.id
LEFT JOIN student_profiles sp ON sp.organization_id = o.id
LEFT JOIN posts p           ON p.organization_id = o.id
LEFT JOIN mentorship_requests mr ON mr.organization_id = o.id
LEFT JOIN events e          ON e.organization_id = o.id
LEFT JOIN job_postings j    ON j.organization_id = o.id AND j.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.name, o.plan_tier;

-- ================================================================
-- SECTION 22: HELPER FUNCTIONS
-- ================================================================

-- Check if two users are connected
CREATE OR REPLACE FUNCTION fn_are_connected(
    p_user_a UUID, p_user_b UUID, p_org_id UUID
) RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM connections
        WHERE organization_id = p_org_id
          AND LEAST(requester_id::TEXT, recipient_id::TEXT) = LEAST(p_user_a::TEXT, p_user_b::TEXT)
          AND GREATEST(requester_id::TEXT, recipient_id::TEXT) = GREATEST(p_user_a::TEXT, p_user_b::TEXT)
          AND status = 'accepted'
    );
$$;

-- Check if user has permission
CREATE OR REPLACE FUNCTION fn_user_has_permission(
    p_user_id UUID, p_org_id UUID, p_permission_code TEXT
) RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM v_user_effective_permissions
        WHERE user_id = p_user_id
          AND organization_id = p_org_id
          AND permission_code = p_permission_code
          AND is_granted = TRUE
    );
$$;

-- Soft delete with audit
CREATE OR REPLACE FUNCTION fn_soft_delete(
    p_table TEXT, p_id UUID, p_org_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    EXECUTE format(
        'UPDATE %I SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
        p_table
    ) USING p_id, p_org_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Record % not found in % for org %', p_id, p_table, p_org_id
            USING ERRCODE = 'P0008';
    END IF;
END;
$$;

-- Paginated cursor helper
CREATE OR REPLACE FUNCTION fn_cursor_page(
    p_cursor TIMESTAMPTZ, p_limit INT DEFAULT 20
) RETURNS TABLE (cursor_filter TIMESTAMPTZ, page_limit INT) LANGUAGE SQL AS $$
    SELECT
        COALESCE(p_cursor, NOW()) AS cursor_filter,
        LEAST(COALESCE(p_limit, 20), 100) AS page_limit;
$$;

-- Generate slug from text
CREATE OR REPLACE FUNCTION fn_slugify(p_text TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE STRICT AS $$
    SELECT lower(
        regexp_replace(
            regexp_replace(
                unaccent(trim(p_text)),
                '[^a-zA-Z0-9\s\-]', '', 'g'
            ),
            '[\s\-]+', '-', 'g'
        )
    );
$$;

-- ================================================================
-- SECTION 23: DEFERRED FK CONSTRAINTS
-- (Added after all tables created to avoid ordering issues)
-- ================================================================

ALTER TABLE organizations
    ADD CONSTRAINT fk_org_verified_by
    FOREIGN KEY (verified_by) REFERENCES users(id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE organizations
    ADD CONSTRAINT fk_org_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE chat_threads
    ADD CONSTRAINT fk_thread_last_message
    FOREIGN KEY (last_message_id) REFERENCES messages(id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE org_invitations
    ADD CONSTRAINT fk_invite_role
    FOREIGN KEY (role_id) REFERENCES roles(id);

ALTER TABLE org_invitations
    ADD CONSTRAINT fk_invite_invited_by
    FOREIGN KEY (invited_by) REFERENCES users(id);

ALTER TABLE org_settings
    ADD CONSTRAINT fk_org_setting_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id);

ALTER TABLE posts
    ADD CONSTRAINT fk_post_pinned_by
    FOREIGN KEY (pinned_by) REFERENCES users(id);

ALTER TABLE job_postings
    ADD CONSTRAINT fk_job_category
    FOREIGN KEY (category_id) REFERENCES job_categories(id);

-- ================================================================
-- SECTION 24: PARTITION MAINTENANCE PROCEDURE
-- (Run monthly via pg_cron or external scheduler)
-- ================================================================

CREATE OR REPLACE PROCEDURE proc_create_monthly_partitions(
    p_months_ahead INT DEFAULT 3
)
LANGUAGE plpgsql AS $$
DECLARE
    v_month     DATE;
    v_next      DATE;
    v_suffix    TEXT;
    tbl         TEXT;
BEGIN
    FOR i IN 0..p_months_ahead LOOP
        v_month  := date_trunc('month', NOW() + (i || ' months')::INTERVAL);
        v_next   := v_month + INTERVAL '1 month';
        v_suffix := to_char(v_month, 'YYYY_MM');

        FOR tbl IN SELECT unnest(ARRAY[
            'messages','message_reads','channel_messages',
            'notifications','page_views','search_queries',
            'audit_logs','webhook_deliveries'
        ]) LOOP
            BEGIN
                EXECUTE format(
                    'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
                     FOR VALUES FROM (%L) TO (%L)',
                    tbl || '_' || v_suffix, tbl, v_month, v_next
                );
                RAISE NOTICE 'Created partition %_%', tbl, v_suffix;
            EXCEPTION WHEN duplicate_table THEN
                RAISE NOTICE 'Partition %_% already exists', tbl, v_suffix;
            END;
        END LOOP;
    END LOOP;
END;
$$;

-- Run immediately to seed current + next 3 months
CALL proc_create_monthly_partitions(3);

-- ================================================================
-- SECTION 25: FINAL CONSTRAINTS & CHECKS
-- ================================================================

-- Cross-table: ensure alumni profile only belongs to alumni/admin user
CREATE OR REPLACE FUNCTION fn_check_alumni_user_type()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_type TEXT;
BEGIN
    SELECT user_type INTO v_type FROM users WHERE id = NEW.user_id;
    IF v_type NOT IN ('alumni','admin','super_admin') THEN
        RAISE EXCEPTION 'Cannot create alumni_profile for user of type %.', v_type
            USING ERRCODE = 'P0009';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_check_alumni_user_type
    BEFORE INSERT ON alumni_profiles
    FOR EACH ROW EXECUTE FUNCTION fn_check_alumni_user_type();

-- Cross-table: ensure student profile only for student users
CREATE OR REPLACE FUNCTION fn_check_student_user_type()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_type TEXT;
BEGIN
    SELECT user_type INTO v_type FROM users WHERE id = NEW.user_id;
    IF v_type NOT IN ('student','admin','super_admin') THEN
        RAISE EXCEPTION 'Cannot create student_profile for user of type %.', v_type
            USING ERRCODE = 'P0010';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_check_student_user_type
    BEFORE INSERT ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION fn_check_student_user_type();

-- Cross-tenant guard: ensure all FK references stay within same org
CREATE OR REPLACE FUNCTION fn_cross_tenant_guard()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_other_org UUID;
BEGIN
    -- Check that sender_id belongs to same org as thread
    IF TG_TABLE_NAME = 'messages' THEN
        SELECT organization_id INTO v_other_org FROM users WHERE id = NEW.sender_id;
        IF v_other_org <> NEW.organization_id THEN
            RAISE EXCEPTION 'Cross-tenant violation: sender_id % belongs to org %, not %.',
                NEW.sender_id, v_other_org, NEW.organization_id
                USING ERRCODE = 'P0011';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_cross_tenant_messages
    BEFORE INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION fn_cross_tenant_guard();

-- ================================================================
-- COMMENTS & DOCUMENTATION
-- ================================================================
COMMENT ON TABLE audit_logs              IS 'Immutable audit trail. No RLS write policy. Written only by SECURITY DEFINER functions.';
COMMENT ON TABLE event_outbox            IS 'Transactional outbox for reliable event delivery. Poll status=pending. Mark done after delivery.';
COMMENT ON TABLE feature_flags           IS 'Organization-scoped and global flags. NULL org_id = platform-wide.';
COMMENT ON TABLE user_permission_overrides IS 'Per-user grants/denials that override role-level permissions. Use sparingly.';
COMMENT ON TABLE daily_org_stats         IS 'Pre-aggregated. Never write from app. Updated by scheduled proc_compute_daily_stats().';
COMMENT ON VIEW  v_user_effective_permissions IS 'Union of role-based and direct permission grants. Query this, not the raw tables.';
COMMENT ON VIEW  v_available_mentors     IS 'Mentor discovery view. Filters verified alumni with remaining slots.';
COMMENT ON FUNCTION fn_slugify           IS 'Converts any text to a URL-safe slug. Strips accents via unaccent extension.';
COMMENT ON FUNCTION fn_are_connected     IS 'O(1) connection check. Use instead of ad-hoc queries in application code.';
COMMENT ON PROCEDURE proc_create_monthly_partitions IS 'Run monthly via pg_cron: SELECT cron.schedule(''0 0 1 * *'', ''CALL proc_create_monthly_partitions(3)'');';