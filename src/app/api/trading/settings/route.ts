import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data } = await supabase.from('risk_settings').select('*').eq('user_id', user.id).single()
    return NextResponse.json(data ?? {})
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()

    // Validation
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
    const settings = {
      user_id:                user.id,
      max_risk_pct:           clamp(body.max_risk_pct ?? 1, 0.1, 5),
      max_daily_loss_pct:     clamp(body.max_daily_loss_pct ?? 5, 1, 20),
      max_weekly_loss_pct:    clamp(body.max_weekly_loss_pct ?? 10, 1, 30),
      max_consecutive_losses: clamp(body.max_consecutive_losses ?? 3, 1, 10),
      suspension_hours:       clamp(body.suspension_hours ?? 2, 1, 24),
      max_positions:          clamp(body.max_positions ?? 1, 1, 3),
      min_confidence:         clamp(body.min_confidence ?? 75, 60, 95),
      leverage:               clamp(body.leverage ?? 5, 1, 20),
      paper_balance:          clamp(body.paper_balance ?? 10000, 100, 1_000_000),
      updated_at:             new Date().toISOString(),
    }

    const { error } = await supabase.from('risk_settings').upsert(settings, { onConflict: 'user_id' })
    if (error) throw error

    return NextResponse.json({ success: true, settings })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
