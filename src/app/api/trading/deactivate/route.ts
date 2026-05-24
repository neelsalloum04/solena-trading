import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    await supabase.from('bot_sessions').update({
      is_active:  false,
      stopped_at: new Date().toISOString(),
    }).eq('user_id', user.id)

    await supabase.from('bot_logs').insert({
      user_id: user.id, level: 'warn',
      message: '⏹ Robot désactivé manuellement',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
