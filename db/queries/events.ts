import { supabase } from '@/db/client/supabase-browser'
import { Database } from '@/db/types/supabase'

type Event = Database['public']['Tables']['events']['Row']
type EventInsert = Database['public']['Tables']['events']['Insert']
type EventAttendee = Database['public']['Tables']['event_attendees']['Row']
type EventAttendeeInsert = Database['public']['Tables']['event_attendees']['Insert']

export const eventQueries = {
  // Get upcoming events
  async getUpcomingEvents(limit = 10): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_date', new Date().toISOString())
      .eq('status', 'published')
      .order('start_date', { ascending: true })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching events:', error)
      return []
    }
    return data || []
  },

  // Get events by organizer
  async getEventsByOrganizer(organizerId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching organizer events:', error)
      return []
    }
    return data || []
  },

  // Create event
  async createEvent(event: EventInsert): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating event:', error)
      return null
    }
    return data
  },

  // Register for event - FIXED
  async registerForEvent(eventId: string, profileId: string): Promise<EventAttendee | null> {
    const { data, error } = await supabase
      .from('event_attendees')
      .insert({
        event_id: eventId,
        attendee_id: profileId, // Changed from profile_id to attendee_id
        status: 'registered'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error registering for event:', error)
      return null
    }
    return data
  },

  // Get event attendees
  async getEventAttendees(eventId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        *,
        profiles:attendee_id (*) // Changed from profile_id to attendee_id
      `)
      .eq('event_id', eventId)
    
    if (error) {
      console.error('Error fetching event attendees:', error)
      return []
    }
    return data || []
  },

  // Get user's event registrations
  async getUserEventRegistrations(profileId: string): Promise<EventAttendee[]> {
    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        *,
        events:event_id (*)
      `)
      .eq('attendee_id', profileId) // Changed from profile_id to attendee_id
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching user events:', error)
      return []
    }
    return data || []
  }
}