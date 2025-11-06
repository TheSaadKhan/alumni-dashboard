import { supabase } from '@/db/client/supabase-browser'
import { Database } from '@/db/types/supabase'

type Connection = Database['public']['Tables']['network_connections']['Row']

export const networkQueries = {
  // Send connection request
  async sendConnectionRequest(userA: string, userB: string): Promise<Connection | null> {
    const { data, error } = await supabase
      .from('network_connections')
      .insert({
        user_a: userA,
        user_b: userB,
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

  // Get user's accepted connections
  async getUserConnections(userId: string): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('network_connections')
      .select(`
        *,
        user_a_profile:user_a (*),
        user_b_profile:user_b (*)
      `)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq('status', 'accepted')

    if (error) {
      console.error('Error fetching connections:', error)
      return []
    }
    return data || []
  },

  // Get pending connection requests (where current user is receiver)
  async getPendingRequests(userId: string): Promise<Connection[]> {
    const { data, error } = await supabase
      .from('network_connections')
      .select(`
        *,
        user_a_profile:user_a (*)
      `)
      .eq('user_b', userId)
      .eq('status', 'pending')

    if (error) {
      console.error('Error fetching pending requests:', error)
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
