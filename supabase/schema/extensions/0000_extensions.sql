-- =========================================
-- Enable required extensions
-- =========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "citext";          -- for case-insensitive text
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- for fuzzy search (ILIKE, similarity)
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- for advanced indexing
CREATE EXTENSION IF NOT EXISTS "btree_gist";      -- for spatial indexes and constraints