import { supabase } from '@/db/client/supabase-browser';
import { Database } from '@/db/types/supabase';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];

export const messageQueries = {
  // Get user conversations - FIXED: Remove conversation_participants reference
  async getUserConversations(profileId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (
          id,
          content,
          created_at,
          sender_id
        )
      `)
      // Filter conversations where the user is a participant
      // This assumes you have a different way to track participants, perhaps in metadata
      .or(`metadata->participants->>${profileId}.is.not.null,created_by.eq.${profileId}`)
      .order('updated_at', { ascending: false });
    
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

    // Update conversation updated_at time
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', message.conversation_id);

    return data;
  },

  // Create conversation - FIXED: Store participants in metadata instead of separate table
  async createConversation(createdBy: string, participantIds: string[], title?: string) {
    const allParticipants = [createdBy, ...participantIds.filter(id => id !== createdBy)];
    
    const conversationData: ConversationInsert = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        created_by: createdBy,
        participants: allParticipants,
        participant_count: allParticipants.length
      },
      subject: title || null,
      type: allParticipants.length > 2 ? 'group' : 'direct'
    };

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();
    
    if (error) throw error;

    return conversation;
  },

  // Alternative: Get conversations by participant (if using metadata)
  async getConversationsByParticipant(profileId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (
          id,
          content,
          created_at,
          sender_id
        )
      `)
      // Filter conversations where the user is in the participants metadata
      .contains('metadata->participants', [profileId])
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};