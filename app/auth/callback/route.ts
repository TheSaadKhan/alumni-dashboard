// 📄 app/api/auth/callback/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/db/types/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const cookieStore = await cookies()

  // ✅ Create Supabase SSR client
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options?: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // read-only during build
        }
      },
      remove(name: string, options?: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // read-only during build
        }
      },
    },
  })

  // ✅ Handle Supabase OAuth callback
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        new URL('/auth/login?error=auth_callback_failed', request.url)
      )
    }
  }

  // ✅ Handle password recovery flow
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/auth/reset-password', request.url))
  }

  // ✅ Default redirect to dashboard after successful login
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
