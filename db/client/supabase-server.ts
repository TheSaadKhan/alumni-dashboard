import { createServerClient, createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../types/supabase';

/**
 * ✅ Server-side Supabase client (SSR-safe)
 * Uses cookies for session management.
 * Safe to use in Server Components, Route Handlers, and Server Actions.
 */
export const createSupabaseServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: () => cookieStore,
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
