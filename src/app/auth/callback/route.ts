import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  // Use origin from the actual request (works on any domain/preview)
  const appUrl = origin

  console.log('[auth/callback] incoming:', { code: !!code, token_hash: !!token_hash, type, origin })

  if (code) {
    const response = NextResponse.redirect(`${appUrl}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options ?? {})
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(error.message)}`)
  }

  if (token_hash && type) {
    const response = NextResponse.redirect(`${appUrl}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options ?? {})
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${appUrl}/reset-password`)
      }
      return response
    }
    console.error('[auth/callback] verifyOtp error:', error.message)
    return NextResponse.redirect(`${appUrl}/login?error=auth_failed`)
  }

  return NextResponse.redirect(`${appUrl}/login?error=auth_failed`)
}
