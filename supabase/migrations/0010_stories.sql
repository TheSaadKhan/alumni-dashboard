-- 0010_stories.sql
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  content text,
  status text DEFAULT 'draft',
  published_at timestamptz,
  tags text[],
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (slug)
);
