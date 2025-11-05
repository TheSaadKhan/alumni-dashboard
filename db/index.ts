// Main database exports
export { supabase } from './client/supabase-browser'
export { createServerClient, createClientClient } from './client/supabase-server'

// Export all queries
export * from './queries/profiles'
export * from './queries/events'
export * from './queries/jobs'
export * from './queries/network'
export * from './queries/donations'
export * from './queries/stories'
export * from './queries/messages'
export * from './queries/analytics'

// Export helpers
export * from './helpers/pagination'
export * from './helpers/filters'
export * from './helpers/errors'

// Export types
export type { Database } from './types/supabase'