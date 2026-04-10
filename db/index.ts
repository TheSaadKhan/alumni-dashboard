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

// export * from './helpers/queries/profiles'
// export * from './helpers/queries/events'
// export * from './helpers/queries/jobs'
// export * from './helpers/queries/network'
// export * from './helpers/queries/donations'
// export * from './helpers/queries/stories'
// export * from './helpers/queries/messages'
// export * from './helpers/queries/analytics'

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
