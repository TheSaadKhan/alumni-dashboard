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

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Stories
CREATE POLICY "Users can view stories based on visibility" ON public.stories
  FOR SELECT USING (
    -- Public stories
    visibility = 'public'
    OR 
    -- Organization stories visible to members
    (visibility = 'organization_only' AND organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    ))
    OR
    -- Private stories visible to author and collaborators
    (visibility = 'private' AND (
      author_id = auth.uid()
      OR id IN (
        SELECT story_id FROM public.story_collaborators 
        WHERE collaborator_id = auth.uid()
      )
    ))
    OR
    -- Organization admins can view all stories in their org
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_content' = 'true'
      )
    )
  );

CREATE POLICY "Organization members can create stories" ON public.stories
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'create_content' = 'true'
      )
    )
  );

CREATE POLICY "Authors and collaborators can update stories" ON public.stories
  FOR UPDATE USING (
    author_id = auth.uid()
    OR id IN (
      SELECT story_id FROM public.story_collaborators 
      WHERE collaborator_id = auth.uid()
      AND role IN ('co_author', 'editor')
    )
    OR organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_content' = 'true'
      )
    )
  );

-- RLS Policies for Story Collaborators
CREATE POLICY "Users can view collaborators for stories they can access" ON public.story_collaborators
  FOR SELECT USING (
    story_id IN (
      SELECT id FROM public.stories WHERE 
        visibility = 'public'
        OR visibility = 'organization_only'
        OR author_id = auth.uid()
        OR id IN (
          SELECT story_id FROM public.story_collaborators 
          WHERE collaborator_id = auth.uid()
        )
    )
  );

CREATE POLICY "Story authors can manage collaborators" ON public.story_collaborators
  FOR ALL USING (
    story_id IN (
      SELECT id FROM public.stories WHERE author_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_content' = 'true'
      )
    )
  );

-- RLS Policies for Story Likes
CREATE POLICY "Users can view likes for stories they can access" ON public.story_likes
  FOR SELECT USING (
    story_id IN (
      SELECT id FROM public.stories WHERE 
        visibility = 'public'
        OR visibility = 'organization_only'
        OR author_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own likes" ON public.story_likes
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for Story Comments
CREATE POLICY "Users can view comments for stories they can access" ON public.story_comments
  FOR SELECT USING (
    story_id IN (
      SELECT id FROM public.stories WHERE 
        visibility = 'public'
        OR visibility = 'organization_only'
        OR author_id = auth.uid()
    )
    AND status = 'published'
  );

CREATE POLICY "Users can create comments on stories they can access" ON public.story_comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND story_id IN (
      SELECT id FROM public.stories WHERE 
        visibility = 'public'
        OR visibility = 'organization_only'
    )
  );

CREATE POLICY "Users can update their own comments" ON public.story_comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Organization moderators can manage comments" ON public.story_comments
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'moderate_content' = 'true'
      )
    )
  );

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_story_collaborators_updated_at
  BEFORE UPDATE ON public.story_collaborators
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_story_comments_updated_at
  BEFORE UPDATE ON public.story_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
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

CREATE INDEX IF NOT EXISTS idx_story_collaborators_story_id ON public.story_collaborators (story_id);
CREATE INDEX IF NOT EXISTS idx_story_collaborators_collaborator_id ON public.story_collaborators (collaborator_id);
CREATE INDEX IF NOT EXISTS idx_story_collaborators_organization_id ON public.story_collaborators (organization_id);

CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON public.story_likes (story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id ON public.story_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_organization_id ON public.story_likes (organization_id);

CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON public.story_comments (story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_author_id ON public.story_comments (author_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_parent_comment_id ON public.story_comments (parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_organization_id ON public.story_comments (organization_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_created_at ON public.story_comments (created_at);

-- Function to automatically set organization context
CREATE OR REPLACE FUNCTION public.set_story_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from author's primary organization if not provided
  IF NEW.organization_id IS NULL THEN
    SELECT primary_organization_id INTO NEW.organization_id
    FROM public.profiles
    WHERE id = NEW.author_id;
  END IF;
  
  -- Set author_member_id if organization is found
  IF NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.author_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.author_id 
      AND om.organization_id = NEW.organization_id
      AND om.is_active = true
    LIMIT 1;
  END IF;
  
  -- Calculate reading time if content is provided (assuming 200 words per minute)
  IF NEW.content IS NOT NULL AND NEW.reading_time_minutes IS NULL THEN
    NEW.word_count := array_length(regexp_split_to_array(NEW.content, '\s+'), 1);
    NEW.reading_time_minutes := GREATEST(1, CEIL(NEW.word_count::decimal / 200));
  END IF;
  
  -- Generate slug from title if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s]', '', 'g'));
    NEW.slug := REGEXP_REPLACE(NEW.slug, '\s+', '-', 'g');
    NEW.slug := SUBSTRING(NEW.slug FROM 1 FOR 100); -- Limit length
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_story_organization_trigger
  BEFORE INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.set_story_organization();

-- Function to update story engagement counts
CREATE OR REPLACE FUNCTION public.update_story_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'story_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.stories
      SET 
        like_count = like_count + 1,
        updated_at = NOW()
      WHERE id = NEW.story_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.stories
      SET 
        like_count = like_count - 1,
        updated_at = NOW()
      WHERE id = OLD.story_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'story_comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.stories
      SET 
        comment_count = comment_count + 1,
        updated_at = NOW()
      WHERE id = NEW.story_id;
      
      -- Update parent comment reply count if it's a reply
      IF NEW.parent_comment_id IS NOT NULL THEN
        UPDATE public.story_comments
        SET 
          reply_count = reply_count + 1,
          updated_at = NOW()
        WHERE id = NEW.parent_comment_id;
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.stories
      SET 
        comment_count = comment_count - 1,
        updated_at = NOW()
      WHERE id = OLD.story_id;
      
      -- Update parent comment reply count if it was a reply
      IF OLD.parent_comment_id IS NOT NULL THEN
        UPDATE public.story_comments
        SET 
          reply_count = reply_count - 1,
          updated_at = NOW()
        WHERE id = OLD.parent_comment_id;
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_story_likes_count_trigger
  AFTER INSERT OR DELETE ON public.story_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_story_engagement_counts();

CREATE TRIGGER update_story_comments_count_trigger
  AFTER INSERT OR DELETE ON public.story_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_story_engagement_counts();

-- Function to publish a story
CREATE OR REPLACE FUNCTION public.publish_story(
  p_story_id uuid,
  p_publish_at timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.stories
  SET 
    status = 'published',
    published_at = COALESCE(p_publish_at, NOW()),
    updated_at = NOW()
  WHERE id = p_story_id
    AND status IN ('draft', 'scheduled');
  
  RETURN FOUND;
END;
$$;

-- Function to get story statistics
CREATE OR REPLACE FUNCTION public.get_story_stats(
  p_organization_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_stories bigint,
  published_stories bigint,
  total_views bigint,
  total_likes bigint,
  total_comments bigint,
  average_reading_time decimal,
  most_popular_category text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_stories,
    COUNT(*) FILTER (WHERE status = 'published') as published_stories,
    COALESCE(SUM(view_count), 0) as total_views,
    COALESCE(SUM(like_count), 0) as total_likes,
    COALESCE(SUM(comment_count), 0) as total_comments,
    COALESCE(AVG(reading_time_minutes), 0) as average_reading_time,
    MODE() WITHIN GROUP (ORDER BY category) as most_popular_category
  FROM public.stories
  WHERE organization_id = p_organization_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;

-- View for enhanced story details
CREATE OR REPLACE VIEW public.story_details AS
SELECT 
  s.*,
  p.full_name as author_name,
  p.avatar_url as author_avatar,
  p.headline as author_headline,
  org.name as organization_name,
  am.title as author_title,
  am.department as author_department,
  -- Calculate engagement rate
  CASE 
    WHEN s.view_count > 0 THEN 
      ((s.like_count + s.comment_count)::decimal / s.view_count::decimal) * 100 
    ELSE 0 
  END as engagement_rate
FROM public.stories s
JOIN public.profiles p ON s.author_id = p.id
LEFT JOIN public.organizations org ON s.organization_id = org.id
LEFT JOIN public.organization_members am ON s.author_member_id = am.id;

-- View for story collaboration details
CREATE OR REPLACE VIEW public.story_collaboration_details AS
SELECT 
  sc.*,
  s.title as story_title,
  s.slug as story_slug,
  c.full_name as collaborator_name,
  c.avatar_url as collaborator_avatar,
  c.headline as collaborator_headline,
  org.name as organization_name,
  cm.title as collaborator_title
FROM public.story_collaborators sc
JOIN public.stories s ON sc.story_id = s.id
JOIN public.profiles c ON sc.collaborator_id = c.id
LEFT JOIN public.organizations org ON sc.organization_id = org.id
LEFT JOIN public.organization_members cm ON sc.collaborator_member_id = cm.id;