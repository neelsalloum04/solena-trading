import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://solena-trading.vercel.app'
  const supabase = await createClient()

  // PKCE flow: code exchange (OAuth + email confirmation)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${appUrl}${next}`)
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${appUrl}/login?error=auth_failed`)
  }

  // Email link flow: token_hash (password recovery, magic link, email change)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${appUrl}/reset-password`)
      }
      return NextResponse.redirect(`${appUrl}${next}`)
    }
    console.error('[auth/callback] verifyOtp error:', error.message)
    return NextResponse.redirect(`${appUrl}/login?error=auth_failed`)
  }

  return NextResponse.redirect(`${appUrl}/login?error=auth_failed`)
}
