-- =========================================
-- 0000_init.sql
-- Initial Supabase database setup
-- =========================================

-- =========================================
-- Enable required extensions
-- =========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "citext";          -- for case-insensitive text
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- for fuzzy search (ILIKE, similarity)
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- for advanced indexing
CREATE EXTENSION IF NOT EXISTS "btree_gist";      -- for spatial indexes and constraints

-- =========================================
-- Core public schema setup
-- =========================================
SET search_path TO public;

-- =========================================
-- Profiles table: core user identity data
-- =========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,              -- linked to Supabase auth.users.id
  email citext NOT NULL UNIQUE,
  full_name text,
  headline text,
  avatar_url text,
  bio text,
  location text,
  graduation_year smallint CHECK (
    graduation_year >= 1900 AND graduation_year <= 2100
  ),
  skills jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  tenant_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================================
-- Trigger: auto-update updated_at column
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- Row Level Security (RLS)
-- =========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view only their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- =========================================
-- Indexes for performance
-- =========================================
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_location_idx ON public.profiles (location);
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles (is_active);
CREATE INDEX IF NOT EXISTS profiles_graduation_year_idx ON public.profiles (graduation_year);

-- =========================================
-- Audit metadata (optional)
-- =========================================
COMMENT ON TABLE public.profiles IS 'Stores alumni user profile information';
COMMENT ON COLUMN public.profiles.auth_user_id IS 'References auth.users.id';
COMMENT ON COLUMN public.profiles.skills IS 'List of skills or tags in JSONB';
COMMENT ON COLUMN public.profiles.metadata IS 'Extra metadata for future extension';

-- =========================================
-- End of file
-- =========================================
