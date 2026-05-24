import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const [sessionRes, credRes, paperRes, riskRes, posRes, logsRes] = await Promise.all([
      supabase.from('bot_sessions').select('*').eq('user_id', user.id).single(),
      supabase.from('bybit_credentials').select('is_valid,api_key_preview,validated_at,permissions').eq('user_id', user.id).single(),
      supabase.from('paper_accounts').select('balance,initial_balance').eq('user_id', user.id).single(),
      supabase.from('risk_settings').select('*').eq('user_id', user.id).single(),
      supabase.from('positions').select('*').eq('user_id', user.id),
      supabase.from('bot_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ])

    return NextResponse.json({
      session:     sessionRes.data,
      credentials: credRes.data,
      paper:       paperRes.data,
      risk:        riskRes.data,
      positions:   posRes.data ?? [],
      logs:        logsRes.data ?? [],
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
