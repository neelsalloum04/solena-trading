import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type Trade = { pnl: number; closed_at: string; [k: string]: unknown }

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const now   = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getTime() - 7 * 86400_000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: raw } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('closed_at', { ascending: false })

    const trades: Trade[] = (raw ?? []) as Trade[]

    if (!trades.length) {
      return NextResponse.json({
        total: { trades: 0, pnl: 0, winRate: 0, profitFactor: 0 },
        daily: { trades: 0, pnl: 0 },
        weekly: { trades: 0, pnl: 0 },
        monthly: { trades: 0, pnl: 0 },
      })
    }

    const calc = (subset: Trade[]) => {
      if (!subset.length) return { trades: 0, pnl: 0, winRate: 0, profitFactor: 0 }
      const pnl = subset.reduce((s, t) => s + (t.pnl ?? 0), 0)
      const wins  = subset.filter(t => (t.pnl ?? 0) > 0)
      const losses = subset.filter(t => (t.pnl ?? 0) < 0)
      const grossWin  = wins.reduce((s, t) => s + (t.pnl ?? 0), 0)
      const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0))
      return {
        trades:       subset.length,
        pnl,
        winRate:      (wins.length / subset.length) * 100,
        profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0,
      }
    }

    return NextResponse.json({
      total:   calc(trades),
      daily:   calc(trades.filter(t => t.closed_at >= today)),
      weekly:  calc(trades.filter(t => t.closed_at >= weekStart)),
      monthly: calc(trades.filter(t => t.closed_at >= monthStart)),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
