import { supabase } from '@/db/client/supabase-browser';
import { Database } from '@/db/types/supabase';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

export const messageQueries = {
  // Get user conversations
  async getUserConversations(profileId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_participants!inner (
          profile_id
        ),
        messages (
          id,
          content,
          created_at,
          sender_id
        )
      `)
      .eq('conversation_participants.profile_id', profileId)
      .order('last_message_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get conversation messages
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles:sender_id (first_name, last_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Send message
  async sendMessage(message: {
    conversation_id: string;
    sender_id: string;
    content: string;
    message_type?: string;
    replied_to_id?: string;
  }): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    if (error) throw error;

    // Update conversation last message time
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', message.conversation_id);

    return data;
  },

  // Create conversation
  async createConversation(createdBy: string, participantIds: string[], title?: string) {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        created_by: createdBy,
        title,
        conversation_type: participantIds.length > 2 ? 'group' : 'direct'
      })
      .select()
      .single();
    
    if (error) throw error;

    // Add participants
    const participants = [createdBy, ...participantIds].map(profileId => ({
      conversation_id: conversation.id,
      profile_id: profileId
    }));

    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert(participants);
    
    if (participantError) throw participantError;

    return conversation;
  }
};