import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { mode } = await req.json()

    // Vérifier que les clés Bybit existent si mode live
    if (mode === 'live') {
      const { data: creds } = await supabase.from('bybit_credentials').select('is_valid').eq('user_id', user.id).single()
      if (!creds?.is_valid) {
        return NextResponse.json({ error: 'Connectez d\'abord votre compte Bybit' }, { status: 400 })
      }
    }

    // Initialiser session si besoin
    await supabase.from('bot_sessions').upsert({
      user_id:  user.id,
      is_active: true,
      mode:      mode ?? 'paper',
      started_at: new Date().toISOString(),
      consecutive_losses: 0,
      suspended_until: null,
    }, { onConflict: 'user_id' })

    // Initialiser compte paper si besoin
    await supabase.from('paper_accounts').upsert({
      user_id: user.id, balance: 10000, initial_balance: 10000,
    }, { onConflict: 'user_id' })

    await supabase.from('risk_settings').upsert({ user_id: user.id }, { onConflict: 'user_id' })

    await supabase.from('bot_logs').insert({
      user_id: user.id, level: 'info',
      message: `🤖 Robot activé en mode ${mode === 'live' ? 'LIVE' : 'PAPER TRADING'}`,
    })

    return NextResponse.json({ success: true, mode })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
