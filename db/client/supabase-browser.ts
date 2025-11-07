// 📄 src/db/client/supabase-browser.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)

/**
 * 🔹 Auth state change listener (client-side only)
 * Use inside React components or hooks.
 */
export const authStateChange = (
  callback: (event: 'SIGNED_IN' | 'SIGNED_OUT', session: any) => void
) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      callback(event, session)
    }
  })
}
