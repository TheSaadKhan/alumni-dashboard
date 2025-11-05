-- Enable useful Postgres extensions for Supabase
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- trigram search (optional)
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- for gin + btree ops
