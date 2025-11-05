-- Conversations policies
CREATE POLICY "Users can view conversations they participate in" ON conversations
FOR SELECT USING (EXISTS (
  SELECT 1 FROM conversation_participants
  WHERE conversation_participants.conversation_id = conversations.id
  AND conversation_participants.profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
));

-- Conversation participants policies
CREATE POLICY "Users can view conversation participants" ON conversation_participants
FOR SELECT USING (EXISTS (
  SELECT 1 FROM conversation_participants AS cp
  WHERE cp.conversation_id = conversation_participants.conversation_id
  AND cp.profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (EXISTS (
  SELECT 1 FROM conversation_participants
  WHERE conversation_participants.conversation_id = messages.conversation_id
  AND conversation_participants.profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
));

CREATE POLICY "Users can send messages to conversations they participate in" ON messages
FOR INSERT WITH CHECK (
  sender_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.profile_id = messages.sender_id
  )
);