// ============================================================
// 🧱 Main Database Entry Point
// ============================================================

// ✅ Supabase Clients
export {
  createSupabaseServerClient,
  createSupabaseBrowserClient,
  createSupabaseAdminClient,
  getSupabaseClient,
} from './client/supabase'

// ============================================================
// 🔍 Query Modules
// ============================================================

export * from './queries/profiles'
export * from './queries/events'
export * from './queries/jobs'
export * from './queries/network'
export * from './queries/donations'
export * from './queries/stories'
export * from './queries/messages'
export * from './queries/analytics'

// ============================================================
// ⚙️ Helper Utilities
// ============================================================

export * from './helpers/pagination'
export * from './helpers/filters'
export * from './helpers/errors'

// ============================================================
// 🧩 Types
// ============================================================

export type { Database } from './types/supabase'
