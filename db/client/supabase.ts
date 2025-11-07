import { createServerClient, createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseCoreClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '../types/supabase'

/* ===========================================================
   🧠 1. SERVER CLIENT (SSR-SAFE)
   -----------------------------------------------------------
   ✅ Use this inside Server Components, Route Handlers, or 
   Server Actions. It automatically manages sessions via cookies.
   =========================================================== */
export const createSupabaseServerClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const cookieStore = await cookies()

  // ✅ The correct cookie interface expected by Supabase SSR
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // No-op during build (read-only)
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // No-op during build (read-only)
        }
      },
    },
  })
}

/* ===========================================================
   💻 2. BROWSER CLIENT
   -----------------------------------------------------------
   ✅ Use this inside React Client Components or hooks.
   Auth tokens are stored in localStorage automatically.
   =========================================================== */
export const createSupabaseBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

/* ===========================================================
   🔐 3. ADMIN CLIENT (SERVER-ONLY)
   -----------------------------------------------------------
   ⚠️ Use ONLY in backend logic or scripts that run on the server.
   NEVER import this into client code — it uses the Service Role Key.
   =========================================================== */
export const createSupabaseAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createSupabaseCoreClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}

/* ===========================================================
   🧩 4. AUTO-DETECT CLIENT (Optional Convenience)
   -----------------------------------------------------------
   ✅ Automatically picks the correct client based on environment.
   =========================================================== */
export const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    return createSupabaseServerClient()
  }
  return createSupabaseBrowserClient()
}
