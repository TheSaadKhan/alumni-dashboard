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