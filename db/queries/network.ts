import { supabase } from '@/db/client/supabase-browser'
import { Database } from '@/db/types/supabase'

type Connection = Database['public']['Tables']['network_connections']['Row']

export const networkQueries = {
  // Send connection request
  async sendConnectionRequest(requesterId: string, receiverId: string, note?: string): Promise<Connection | null> {
    const { data, error } = await supabase
      .from('network_connections')
      .insert({
        requester_id: requesterId,
        receiver_id: receiverId,
        connection_note: note,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error sending connection request:', error)
      return null
    }
    return data
  },

  // Accept connection request
  async acceptConnectionRequest(connectionId: string): Promise<Connection | null> {
    const { data, error } = await supabase
      .from('network_connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId)
      .select()
      .single()
    
    if (error) {
      console.error('Error accepting connection:', error)
      return null
    }
    return data
  },

  // Get user's connections
  async getUserConnections(userId: string): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('network_connections')
      .select(`
        *,
        requester:requester_id (*),
        receiver:receiver_id (*)
      `)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')
    
    if (error) {
      console.error('Error fetching connections:', error)
      return []
    }
    return data || []
  },

  // Get pending connection requests
  async getPendingRequests(userId: string): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('network_connections')
      .select(`
        *,
        requester:requester_id (*)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
    
    if (error) {
      console.error('Error fetching pending requests:', error)
      return []
    }
    return data || []
  },

  // Get connection recommendations
  async getConnectionRecommendations(userId: string, limit = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('connection_recommendations')
      .select(`
        *,
        recommended_profile:recommended_profile_id (*)
      `)
      .eq('profile_id', userId)
      .order('score', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching recommendations:', error)
      return []
    }
    return data || []
  },

  // Remove connection
  async removeConnection(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('network_connections')
      .delete()
      .eq('id', connectionId)
    
    if (error) {
      console.error('Error removing connection:', error)
      throw error
    }
  }
}