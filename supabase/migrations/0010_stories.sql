-- 0010_stories.sql
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  content text,
  
  -- NEW: Enhanced content fields
  excerpt text,
  featured_image_url text,
  image_gallery jsonb DEFAULT '[]'::jsonb,
  video_url text,
  
  -- NEW: Content categorization
  category text DEFAULT 'general', -- news, event, achievement, interview, announcement
  subcategory text,
  tags text[],
  
  -- NEW: Content status and visibility
  status text DEFAULT 'draft', -- draft, published, archived, scheduled, rejected
  visibility text DEFAULT 'public', -- public, organization_only, private
  featured boolean DEFAULT false,
  pinned boolean DEFAULT false,
  
  -- NEW: Publishing controls
  published_at timestamptz,
  scheduled_publish_at timestamptz,
  unpublished_at timestamptz,
  expiration_at timestamptz,
  
  -- NEW: Content metrics
  reading_time_minutes integer CHECK (reading_time_minutes >= 0),
  word_count integer CHECK (word_count >= 0),
  
  -- NEW: Engagement tracking
  view_count integer DEFAULT 0 CHECK (view_count >= 0),
  like_count integer DEFAULT 0 CHECK (like_count >= 0),
  share_count integer DEFAULT 0 CHECK (share_count >= 0),
  comment_count integer DEFAULT 0 CHECK (comment_count >= 0),
  
  -- NEW: SEO and social media
  seo_title text,
  seo_description text,
  social_media_image_url text,
  canonical_url text,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (slug)
);

-- Story collaborations table
CREATE TABLE IF NOT EXISTS public.story_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  collaborator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  collaborator_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  role text NOT NULL, -- co_author, editor, reviewer, contributor
  contribution_percentage integer CHECK (contribution_percentage >= 0 AND contribution_percentage <= 100),
  contribution_description text,
  
  is_credited boolean DEFAULT true,
  display_order integer DEFAULT 0,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (story_id, collaborator_id)
);

-- Story likes table
CREATE TABLE IF NOT EXISTS public.story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  reaction_type text DEFAULT 'like', -- like, love, celebrate, insightful, curious
  created_at timestamptz DEFAULT now(),
  
  UNIQUE (story_id, user_id)
);

-- Story comments table
CREATE TABLE IF NOT EXISTS public.story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.story_comments(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  content text NOT NULL,
  
  -- NEW: Comment status and moderation
  status text DEFAULT 'published', -- published, pending, flagged, removed
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  
  -- NEW: Engagement tracking
  like_count integer DEFAULT 0 CHECK (like_count >= 0),
  reply_count integer DEFAULT 0 CHECK (reply_count >= 0),
  
  -- NEW: Moderation
  flagged_count integer DEFAULT 0 CHECK (flagged_count >= 0),
  moderator_notes text,
  moderated_at timestamptz,
  moderated_by uuid REFERENCES public.profiles(id),
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);