import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth/login?error=auth_callback_failed', request.url))
    }
  }

  // Check if this is a password reset flow
  const type = requestUrl.searchParams.get('type')
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/auth/reset-password', request.url))
  }

  // Default redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
}