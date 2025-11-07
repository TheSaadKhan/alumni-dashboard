import { createServerClient, createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../types/supabase';

/**
 * ✅ Server-side Supabase client (SSR-safe)
 * Uses cookies for session management.
 * Works in Server Components, Route Handlers, and Server Actions.
 */
export const createSupabaseServerClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = await cookies();

  // ✅ Correct cookie interface expected by Supabase SSR
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: any) {
        try {
          cookieStore.set({
            name,
            value,
            ...options,
          });
        } catch {
          // no-op during static rendering
        }
      },
      remove(name: string, options?: any) {
        try {
          cookieStore.set({
            name,
            value: '',
            ...options,
          });
        } catch {
          // no-op during static rendering
        }
      },
    },
  });
};

/**
 * ✅ Browser-side Supabase client
 * Should only be used in Client Components or hooks.
 */
export const createSupabaseBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};
