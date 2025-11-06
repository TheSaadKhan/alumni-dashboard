import { supabase } from '@/db/client/supabase-browser'
import { Database } from '@/db/types/supabase'

type Story = Database['public']['Tables']['stories']['Row']

export const storyQueries = {
  // Get published stories
  async getPublishedStories(limit = 10): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        profiles:author_id (first_name, last_name, avatar_url)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  // Get story by slug
  async getStoryBySlug(slug: string): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        profiles:author_id (first_name, last_name, avatar_url)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()
    
    if (error) return null
    return data
  },

  // Create story
  async createStory(story: {
    title: string
    slug: string
    content?: string
    author_id: string
    summary?: string
    tags?: string[]
    metadata?: Record<string, any>
    status?: string
  }): Promise<Story> {
    const { data, error } = await supabase
      .from('stories')
      .insert(story)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
