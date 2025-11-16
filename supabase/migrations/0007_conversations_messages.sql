-- 0007_conversations_messages.sql
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  subject text,
  type text DEFAULT 'direct', -- direct, group, channel, announcement, support
  
  -- NEW: Enhanced conversation fields
  title text,
  description text,
  avatar_url text,
  is_public boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  
  -- NEW: Conversation settings
  settings jsonb DEFAULT '{
    "allow_replies": true,
    "allow_attachments": true,
    "moderated": false,
    "read_receipts": true
  }'::jsonb,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- NEW: Last message tracking
  last_message_at timestamptz,
  last_message_id uuid,
  last_message_preview text
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  body text,
  attachments jsonb, -- [{url: string, filename: string, mime_type: string, size: number}]
  
  -- NEW: Enhanced message fields
  message_type text DEFAULT 'text', -- text, image, file, system, announcement
  reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  
  -- NEW: Message status tracking
  is_read boolean DEFAULT false,
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  
  -- NEW: Moderation and reactions
  is_pinned boolean DEFAULT false,
  pinned_at timestamptz,
  pinned_by uuid REFERENCES public.profiles(id),
  reactions jsonb DEFAULT '{}'::jsonb, -- { "like": [user_id1, user_id2], "heart": [user_id3] }
  
  -- NEW: Delivery status
  delivered_to jsonb DEFAULT '[]'::jsonb, -- [{"user_id": uuid, "delivered_at": timestamp}]
  read_by jsonb DEFAULT '[]'::jsonb, -- [{"user_id": uuid, "read_at": timestamp}]
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversation participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- NEW: Organization context
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  participant_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  
  -- NEW: Participant settings and roles
  role text DEFAULT 'member', -- owner, admin, member, read_only
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  is_active boolean DEFAULT true,
  
  -- NEW: Participant preferences
  settings jsonb DEFAULT '{
    "muted": false,
    "notifications": true,
    "archived": false
  }'::jsonb,
  
  -- NEW: Last read tracking
  last_read_at timestamptz,
  last_read_message_id uuid REFERENCES public.messages(id),
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(conversation_id, participant_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Conversations
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE participant_id = auth.uid() AND is_active = true
    )
    OR
    -- Public conversations in their organization
    (is_public = true AND organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    ))
  );

CREATE POLICY "Organization members can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Conversation owners can update conversations" ON public.conversations
  FOR UPDATE USING (
    id IN (
      SELECT cp.conversation_id FROM public.conversation_participants cp
      WHERE cp.participant_id = auth.uid() 
      AND cp.role IN ('owner', 'admin')
      AND cp.is_active = true
    )
    OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      AND role_id IN (
        SELECT id FROM public.organization_roles 
        WHERE permissions->>'manage_conversations' = 'true'
      )
    )
  );

-- RLS Policies for Messages
CREATE POLICY "Users can view messages in conversations they participate in" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE participant_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can send messages to conversations they participate in" ON public.messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE participant_id = auth.uid() AND is_active = true
      AND settings->>'muted' = 'false'
    )
    AND sender_id = auth.uid()
  );

CREATE POLICY "Message senders can update their own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Conversation admins can manage all messages" ON public.messages
  FOR ALL USING (
    conversation_id IN (
      SELECT cp.conversation_id FROM public.conversation_participants cp
      WHERE cp.participant_id = auth.uid() 
      AND cp.role IN ('owner', 'admin')
      AND cp.is_active = true
    )
  );

-- RLS Policies for Conversation Participants
CREATE POLICY "Users can view participants in their conversations" ON public.conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE participant_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Conversation owners can manage participants" ON public.conversation_participants
  FOR ALL USING (
    conversation_id IN (
      SELECT cp.conversation_id FROM public.conversation_participants cp
      WHERE cp.participant_id = auth.uid() 
      AND cp.role IN ('owner', 'admin')
      AND cp.is_active = true
    )
  );

CREATE POLICY "Users can manage their own participant settings" ON public.conversation_participants
  FOR UPDATE USING (participant_id = auth.uid());

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_conversation_participants_updated_at
  BEFORE UPDATE ON public.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON public.conversations (organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations (type);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations (last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_is_public ON public.conversations (is_public);
CREATE INDEX IF NOT EXISTS idx_conversations_is_archived ON public.conversations (is_archived);

CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON public.messages (organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages (reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_pinned ON public.messages (is_pinned);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv_id ON public.conversation_participants (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_part_id ON public.conversation_participants (participant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_org_id ON public.conversation_participants (organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_is_active ON public.conversation_participants (is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_role ON public.conversation_participants (role);

-- Function to automatically set organization context for conversations
CREATE OR REPLACE FUNCTION public.set_conversation_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from created_by_member if available
  IF NEW.organization_id IS NULL AND NEW.created_by_member_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.organization_members
    WHERE id = NEW.created_by_member_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_conversation_organization_trigger
  BEFORE INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_conversation_organization();

-- Function to automatically set organization context for messages
CREATE OR REPLACE FUNCTION public.set_message_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id from conversation
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.conversations
    WHERE id = NEW.conversation_id;
  END IF;
  
  -- Set sender_member_id if available
  IF NEW.sender_member_id IS NULL AND NEW.organization_id IS NOT NULL THEN
    SELECT om.id INTO NEW.sender_member_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.sender_id 
    AND om.organization_id = NEW.organization_id
    AND om.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_message_organization_trigger
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_message_organization();

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_id = NEW.id,
    last_message_preview = CASE 
      WHEN LENGTH(NEW.body) > 100 THEN LEFT(NEW.body, 100) || '...'
      ELSE NEW.body
    END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(
  p_conversation_id uuid,
  p_participant_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_participant_id uuid := COALESCE(p_participant_id, auth.uid());
  v_last_message_id uuid;
BEGIN
  -- Get the latest message ID in the conversation
  SELECT id INTO v_last_message_id
  FROM public.messages
  WHERE conversation_id = p_conversation_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Update participant's last read
  UPDATE public.conversation_participants
  SET 
    last_read_at = NOW(),
    last_read_message_id = v_last_message_id,
    updated_at = NOW()
  WHERE conversation_id = p_conversation_id 
    AND participant_id = v_participant_id;
  
  -- Mark messages as read in read_by array
  UPDATE public.messages
  SET 
    read_by = COALESCE(read_by, '[]'::jsonb) || 
    jsonb_build_object('user_id', v_participant_id, 'read_at', NOW()::text)::jsonb,
    is_read = true
  WHERE conversation_id = p_conversation_id 
    AND NOT (read_by @> jsonb_build_array(jsonb_build_object('user_id', v_participant_id)));
END;
$$;

-- Function to add participant to conversation
CREATE OR REPLACE FUNCTION public.add_conversation_participant(
  p_conversation_id uuid,
  p_participant_id uuid,
  p_role text DEFAULT 'member'
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.conversation_participants (
    conversation_id,
    participant_id,
    role,
    organization_id,
    participant_member_id
  )
  SELECT 
    p_conversation_id,
    p_participant_id,
    p_role,
    c.organization_id,
    om.id
  FROM public.conversations c
  LEFT JOIN public.organization_members om ON om.user_id = p_participant_id AND om.organization_id = c.organization_id
  WHERE c.id = p_conversation_id;
  
  RETURN FOUND;
END;
$$;

-- View for conversation details with participant count
CREATE OR REPLACE VIEW public.conversation_details AS
SELECT 
  c.*,
  COUNT(cp.id) as participant_count,
  ARRAY_AGG(jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'role', cp.role
  )) as participants
FROM public.conversations c
LEFT JOIN public.conversation_participants cp ON c.id = cp.conversation_id AND cp.is_active = true
LEFT JOIN public.profiles p ON cp.participant_id = p.id
GROUP BY c.id;

-- View for message details with sender information
CREATE OR REPLACE VIEW public.message_details AS
SELECT 
  m.*,
  p.full_name as sender_name,
  p.avatar_url as sender_avatar,
  p.email as sender_email,
  org.name as organization_name,
  om.title as sender_title,
  om.department as sender_department,
  rm.body as reply_to_body,
  rm.sender_id as reply_to_sender_id,
  rp.full_name as reply_to_sender_name
FROM public.messages m
JOIN public.profiles p ON m.sender_id = p.id
LEFT JOIN public.organizations org ON m.organization_id = org.id
LEFT JOIN public.organization_members om ON m.sender_member_id = om.id
LEFT JOIN public.messages rm ON m.reply_to_id = rm.id
LEFT JOIN public.profiles rp ON rm.sender_id = rp.id;