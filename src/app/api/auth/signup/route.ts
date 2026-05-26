import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const IP_LIMIT    = 3                       // max accounts per IP
const WINDOW_DAYS = 30                      // rolling window in days
const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://primex-trading.vercel.app'

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
  }

  // ── Resolve real IP ──────────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  // ── IP rate limit check ──────────────────────────────────────────────────────
  if (ip !== 'unknown') {
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabaseAdmin
      .from('signup_ips')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', since)

    if ((count ?? 0) >= IP_LIMIT) {
      return NextResponse.json(
        { error: 'Trop de comptes créés depuis cette adresse. Réessayez dans 30 jours.' },
        { status: 429 }
      )
    }
  }

  // ── Create account ───────────────────────────────────────────────────────────
  const { data, error } = await supabaseAnon.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: name.trim() },
      emailRedirectTo: `${SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // ── Record IP ────────────────────────────────────────────────────────────────
  if (data.user) {
    await supabaseAdmin
      .from('signup_ips')
      .insert({ ip, user_id: data.user.id })
  }

  return NextResponse.json({
    requiresEmailConfirmation: !data.session,
  })
}
