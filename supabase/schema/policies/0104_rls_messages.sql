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