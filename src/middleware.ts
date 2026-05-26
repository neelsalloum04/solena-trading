import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'))
}

// Routes requiring authentication (any plan)
const PROTECTED = [
  '/dashboard', '/chat', '/signals', '/bot', '/portfolio',
  '/settings', '/admin', '/analyse', '/support', '/mfa',
]

// These routes skip the AAL2 check to avoid redirect loops
const SKIP_AAL_CHECK = ['/mfa']

const AUTH_PAGES = ['/login', '/register']

// These routes must NEVER be blocked
const ALWAYS_PUBLIC = ['/auth/', '/forgot-password', '/reset-password', '/api/', '/legal/']

// Authenticated but unverified users can access these routes
const SKIP_EMAIL_CHECK = ['/verify-email', '/mfa']

// Simple in-memory rate limiting (reset on cold start)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, limit = 200, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static assets and always-public routes — pass through immediately
  if (ALWAYS_PUBLIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Basic rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': '60', 'Content-Type': 'text/plain' },
    })
  }

  // If Supabase isn't configured, open everything (dev mode)
  if (!isSupabaseConfigured()) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isAuthPage = AUTH_PAGES.includes(pathname)

  // Unauthenticated user trying to access protected route → login
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated but unverified user → verify-email page
  const skipEmailCheck = SKIP_EMAIL_CHECK.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isProtected && user && !user.email_confirmed_at && !skipEmailCheck) {
    const url = request.nextUrl.clone()
    url.pathname = '/verify-email'
    return NextResponse.redirect(url)
  }

  // Authenticated user on a protected route: check MFA (AAL2) if needed
  if (isProtected && user && !SKIP_AAL_CHECK.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      const url = request.nextUrl.clone()
      url.pathname = '/mfa'
      return NextResponse.redirect(url)
    }
  }

  // Verified user on verify-email page → dashboard
  if (pathname === '/verify-email' && user?.email_confirmed_at) {
    const url = request.nextUrl.clone()
    url.pathname = '/analyse'
    return NextResponse.redirect(url)
  }

  // Authenticated user on login/register → dashboard
  if (isAuthPage && user) {
    // Check MFA first — if needed, send to /mfa not dashboard
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      const url = request.nextUrl.clone()
      url.pathname = '/mfa'
      return NextResponse.redirect(url)
    }
    const url = request.nextUrl.clone()
    url.pathname = '/analyse'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
